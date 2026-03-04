import { invoke } from "@tauri-apps/api/core";
import { create_spatial, get_spatial_nodes, is_spatial_enabled, set_spatial_enabled } from "./spatial";

type AudioCb = {
  on_time?: (t: number) => void;
  on_end?: () => void;
  on_play?: () => void;
  on_pause?: () => void;
};

export const EQ_FREQS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

type Deck = {
  el: HTMLAudioElement;
  gain: GainNode | null;
  filters: BiquadFilterNode[];
};

let _a: Deck | null = null;
let _b: Deck | null = null;
let _active: "a" | "b" = "a";
let _ctx: AudioContext | null = null;
let _cbs: AudioCb = {};
let _cf_duration = 0;
let _cf_timer: number | null = null;
let _cf_raf: number | null = null;
let _cf_active = false;

function make_el(): HTMLAudioElement {
  const el = new Audio();
  el.crossOrigin = "anonymous";
  return el;
}

function get_ctx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  return _ctx;
}

function wire_deck(el: HTMLAudioElement): Deck {
  const ctx = get_ctx();
  const src = ctx.createMediaElementSource(el);
  const filters = EQ_FREQS.map((freq, i) => {
    const f = ctx.createBiquadFilter();
    f.type = i === 0 ? "lowshelf" : i === EQ_FREQS.length - 1 ? "highshelf" : "peaking";
    f.frequency.value = freq;
    f.Q.value = 1.4;
    f.gain.value = 0;
    return f;
  });
  const gain = ctx.createGain();
  gain.gain.value = 1;
  let node: AudioNode = src;
  for (const f of filters) { node.connect(f); node = f; }
  node.connect(gain);

  if (is_spatial_enabled()) {
    let spatial = get_spatial_nodes();
    if (!spatial) spatial = create_spatial(ctx);
    gain.connect(spatial.input);
    spatial.output.connect(ctx.destination);
  } else {
    gain.connect(ctx.destination);
  }

  return { el, gain, filters };
}

function get_active(): Deck {
  if (!_a) {
    _a = wire_deck(make_el());
    bind_events(_a, true);
  }
  if (!_b) {
    _b = wire_deck(make_el());
    bind_events(_b, false);
  }
  return _active === "a" ? _a : _b;
}

function bind_events(deck: Deck, is_a: boolean) {
  deck.el.addEventListener("timeupdate", () => {
    const tag = is_a ? "a" : "b";
    if (_active !== tag) return;
    _cbs.on_time?.(deck.el.currentTime);
    check_crossfade(deck);
  });
  deck.el.addEventListener("ended", () => {
    const tag = is_a ? "a" : "b";
    if (_active !== tag) return;
    if (!_cf_active) _cbs.on_end?.();
  });
  deck.el.addEventListener("play", () => {
    const tag = is_a ? "a" : "b";
    if (_active === tag) _cbs.on_play?.();
  });
  deck.el.addEventListener("pause", () => {
    const tag = is_a ? "a" : "b";
    if (_active === tag && !_cf_active) _cbs.on_pause?.();
  });
  deck.el.addEventListener("error", (e) => console.error("audio error", deck.el.error, e));
}

function check_crossfade(deck: Deck) {
  if (_cf_active || _cf_duration <= 0) return;
  const dur = deck.el.duration;
  if (!dur || !isFinite(dur)) return;
  const remaining = dur - deck.el.currentTime;
  if (remaining <= _cf_duration && remaining > 0.1) {
    _cbs.on_end?.();
  }
}

function cancel_fade() {
  if (_cf_timer !== null) { clearInterval(_cf_timer); _cf_timer = null; }
  if (_cf_raf !== null) { cancelAnimationFrame(_cf_raf); _cf_raf = null; }
  _cf_active = false;
}

function do_crossfade(incoming: Deck, outgoing: Deck, duration: number) {
  cancel_fade();
  _cf_active = true;
  const steps = 30;
  const interval = (duration * 1000) / steps;
  let step = 0;
  const vol = get_master_vol();

  incoming.gain!.gain.value = 0;

  _cf_timer = window.setInterval(() => {
    step++;
    const t = Math.min(step / steps, 1);
    const ease = t * t * (3 - 2 * t);
    incoming.gain!.gain.value = ease * vol;
    outgoing.gain!.gain.value = (1 - ease) * vol;
    if (step >= steps) {
      cancel_fade();
      outgoing.el.pause();
      outgoing.el.currentTime = 0;
      incoming.gain!.gain.value = vol;
      outgoing.gain!.gain.value = vol;
    }
  }, interval);
}

let _master_vol = 1;

function get_master_vol(): number {
  return _master_vol;
}

export function set_cbs(cbs: AudioCb) {
  _cbs = cbs;
}

export function set_crossfade(seconds: number) {
  _cf_duration = Math.max(0, Math.min(12, seconds));
}

export function get_crossfade(): number {
  return _cf_duration;
}

export async function play_src(path: string) {
  const ctx = get_ctx();
  if (ctx.state === "suspended") ctx.resume();

  const was_active = get_active();
  const use_cf = _cf_duration > 0 && !was_active.el.paused && isFinite(was_active.el.duration);

  if (use_cf) {
    _active = _active === "a" ? "b" : "a";
    const incoming = get_active();
    const outgoing = was_active;

    if (path.startsWith("http://") || path.startsWith("https://")) {
      incoming.el.src = path;
    } else {
      incoming.el.src = await invoke<string>("stream_file", { path });
    }
    incoming.el.load();
    incoming.el.play().catch((e) => console.error("play failed", e));
    do_crossfade(incoming, outgoing, _cf_duration);
  } else {
    cancel_fade();
    const deck = get_active();
    if (path.startsWith("http://") || path.startsWith("https://")) {
      deck.el.src = path;
    } else {
      deck.el.src = await invoke<string>("stream_file", { path });
    }
    deck.el.load();
    deck.el.play().catch((e) => console.error("play failed", e));
    deck.gain!.gain.value = _master_vol;
  }
}

export function is_live(): boolean {
  const el = get_active().el;
  return el.duration === Infinity || isNaN(el.duration);
}

export function play_resume() {
  const ctx = get_ctx();
  if (ctx.state === "suspended") ctx.resume();
  get_active().el.play();
}

export function play_pause() {
  get_active().el.pause();
}

export function play_seek(t: number) {
  get_active().el.currentTime = t;
}

export function get_vol(): number {
  return _master_vol;
}

export function set_vol(v: number) {
  const clamped = Math.max(0, Math.min(1, v));
  const use_exp = localStorage.getItem("exp_volume") === "1";
  _master_vol = use_exp ? clamped * clamped : clamped;
  if (!_cf_active) {
    const deck = get_active();
    if (deck.gain) deck.gain.gain.value = _master_vol;
  }
}

export function get_playing(): boolean {
  return !get_active().el.paused;
}

export function get_time(): number {
  return get_active().el.currentTime;
}

export function get_latency(): number {
  if (!_ctx) return 0.5;
  const hw = (_ctx.baseLatency ?? 0) + (_ctx.outputLatency ?? 0);
  return Math.max(hw, 0.5);
}

export function set_eq_band(index: number, gain_db: number) {
  if (_a?.filters[index]) _a.filters[index].gain.value = gain_db;
  if (_b?.filters[index]) _b.filters[index].gain.value = gain_db;
}

export function set_eq_all(gains: number[]) {
  gains.forEach((g, i) => {
    if (_a?.filters[i]) _a.filters[i].gain.value = g;
    if (_b?.filters[i]) _b.filters[i].gain.value = g;
  });
}

export function get_pitch(): number {
  return get_active().el.playbackRate;
}

export function set_pitch(rate: number) {
  const clamped = Math.max(0.25, Math.min(2, rate));
  if (_a) { _a.el.playbackRate = clamped; _a.el.preservesPitch = false; }
  if (_b) { _b.el.playbackRate = clamped; _b.el.preservesPitch = false; }
}

export function set_spatial(on: boolean) {
  set_spatial_enabled(on);
  const ctx = get_ctx();

  function rewire(deck: Deck | null) {
    if (!deck?.gain) return;
    deck.gain.disconnect();
    if (on) {
      let spatial = get_spatial_nodes();
      if (!spatial) spatial = create_spatial(ctx);
      spatial.output.disconnect();
      deck.gain.connect(spatial.input);
      spatial.output.connect(ctx.destination);
    } else {
      deck.gain.connect(ctx.destination);
    }
  }

  rewire(_a);
  rewire(_b);
}
