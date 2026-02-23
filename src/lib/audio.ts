import { invoke } from "@tauri-apps/api/core";

type AudioCb = {
  on_time?: (t: number) => void;
  on_end?: () => void;
  on_play?: () => void;
  on_pause?: () => void;
};

export const EQ_FREQS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

let _el: HTMLAudioElement | null = null;
let _ctx: AudioContext | null = null;
let _filters: BiquadFilterNode[] = [];
let _gain: GainNode | null = null;
let _cbs: AudioCb = {};

function get_el(): HTMLAudioElement {
  if (!_el) {
    _el = new Audio();
    _el.addEventListener("timeupdate", () => _cbs.on_time?.(_el!.currentTime));
    _el.addEventListener("ended", () => _cbs.on_end?.());
    _el.addEventListener("play", () => _cbs.on_play?.());
    _el.addEventListener("pause", () => _cbs.on_pause?.());
    _el.addEventListener("error", (e) => console.error("audio error", _el!.error, e));
  }
  return _el;
}

function get_ctx(): { ctx: AudioContext; filters: BiquadFilterNode[] } {
  if (_ctx) return { ctx: _ctx, filters: _filters };

  _ctx = new AudioContext();
  const src = _ctx.createMediaElementSource(get_el());

  _filters = EQ_FREQS.map((freq, i) => {
    const f = _ctx!.createBiquadFilter();
    f.type = i === 0 ? "lowshelf" : i === EQ_FREQS.length - 1 ? "highshelf" : "peaking";
    f.frequency.value = freq;
    f.Q.value = 1.4;
    f.gain.value = 0;
    return f;
  });

  _gain = _ctx.createGain();
  _gain.gain.value = get_el().volume;

  let node: AudioNode = src;
  for (const f of _filters) { node.connect(f); node = f; }
  node.connect(_gain);
  _gain.connect(_ctx.destination);

  return { ctx: _ctx, filters: _filters };
}

export function set_cbs(cbs: AudioCb) {
  _cbs = cbs;
}

export async function play_src(path: string) {
  const el = get_el();
  const { ctx } = get_ctx();
  if (ctx.state === "suspended") ctx.resume();
  if (path.startsWith("http://") || path.startsWith("https://")) {
    el.src = path;
  } else {
    const data = await invoke<string>("stream_file", { path });
    el.src = data;
  }
  el.load();
  el.play().catch((e) => console.error("play failed", e));
}

export function is_live(): boolean {
  const el = get_el();
  return el.duration === Infinity || isNaN(el.duration);
}

export function play_resume() {
  const { ctx } = get_ctx();
  if (ctx.state === "suspended") ctx.resume();
  get_el().play();
}

export function play_pause() {
  get_el().pause();
}

export function play_seek(t: number) {
  get_el().currentTime = t;
}

export function get_vol(): number {
  return _gain ? _gain.gain.value : get_el().volume;
}

export function set_vol(v: number) {
  const clamped = Math.max(0, Math.min(1, v));
  const use_exp = localStorage.getItem("exp_volume") === "1";
  const val = use_exp ? clamped * clamped : clamped;
  if (_gain) {
    _gain.gain.value = val;
  } else {
    get_el().volume = val;
  }
}

export function get_playing(): boolean {
  return !get_el().paused;
}

export function get_time(): number {
  return get_el().currentTime;
}

export function get_latency(): number {
  if (!_ctx) return 0.5;
  const hw = (_ctx.baseLatency ?? 0) + (_ctx.outputLatency ?? 0);
  return Math.max(hw, 0.5);
}

export function set_eq_band(index: number, gain_db: number) {
  get_ctx().filters[index].gain.value = gain_db;
}

export function set_eq_all(gains: number[]) {
  const { filters } = get_ctx();
  gains.forEach((g, i) => { if (filters[i]) filters[i].gain.value = g; });
}

export function get_pitch(): number {
  return get_el().playbackRate;
}

export function set_pitch(rate: number) {
  const clamped = Math.max(0.25, Math.min(2, rate));
  get_el().playbackRate = clamped;
  get_el().preservesPitch = false;
}
