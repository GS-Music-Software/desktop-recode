import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { message } from "@tauri-apps/plugin-dialog";
import { set_eq_all, set_pitch as audio_set_pitch, set_crossfade as audio_set_cf, set_spatial as audio_set_spatial, EQ_FREQS } from "@/lib";

export type EqPreset = { name: string; gains: number[] };

export const EQ_PRESETS: EqPreset[] = [
  { name: "Flat",       gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: "Rock",       gains: [4, 3, 2, 1, -1, -1, 1, 3, 4, 4] },
  { name: "Bass Boost", gains: [6, 5, 4, 2, 1, 0, 0, 0, 0, 0] },
  { name: "Vocal",      gains: [-2, -2, 0, 2, 4, 4, 3, 2, 1, 0] },
  { name: "Electronic", gains: [4, 3, 1, 0, -2, 2, 1, 2, 3, 4] },
  { name: "Acoustic",   gains: [3, 2, 2, 1, 0, 1, 2, 2, 2, 1] },
];

function load_custom_presets(): EqPreset[] {
  try {
    const s = localStorage.getItem("eq_custom_presets");
    if (s) {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr;
    }
  } catch {}
  return [];
}

const FLAT = EQ_PRESETS[0].gains;

export type RpcField = "title" | "artist" | "album" | "title_artist" | "artist_album" | "none";

export type RpcOpts = {
  detail: RpcField;
  state: RpcField;
  show_ts: boolean;
  show_art: boolean;
};

const RPC_DEF: RpcOpts = { detail: "title", state: "artist", show_ts: true, show_art: true };

function load_rpc_opts(): RpcOpts {
  try {
    const s = localStorage.getItem("rpc_opts");
    if (s) return { ...RPC_DEF, ...JSON.parse(s) };
  } catch {}
  return { ...RPC_DEF };
}

export type SpTokens = {
  access_token: string;
  refresh_token: string;
  display_name: string;
};

type SettingsState = {
  immersive_bg: boolean;
  set_immersive_bg: (v: boolean) => void;
  eq_bands: number[];
  set_eq_bands: (gains: number[]) => void;
  eq_enabled: boolean;
  set_eq_enabled: (v: boolean) => void;
  discord_rpc: boolean;
  set_discord_rpc: (v: boolean) => void;
  rpc_opts: RpcOpts;
  set_rpc_opts: (o: RpcOpts) => void;
  tray_enabled: boolean;
  set_tray_enabled: (v: boolean) => void;
  sp_client_id: string | null;
  set_sp_client_id: (id: string | null) => void;
  sp_tokens: SpTokens | null;
  sp_token: () => Promise<string>;
  sp_connect: (override_id?: string) => Promise<void>;
  sp_disconnect: () => Promise<void>;
  sp_loading: boolean;
  pitch: number;
  set_pitch: (v: number) => void;
  exp_volume: boolean;
  set_exp_volume: (v: boolean) => void;
  amll_lyrics: boolean;
  set_amll_lyrics: (v: boolean) => void;
  amll_word_sync: boolean;
  set_amll_word_sync: (v: boolean) => void;
  crossfade: number;
  set_crossfade: (v: number) => void;
  spatial_audio: boolean;
  set_spatial_audio: (v: boolean) => void;
  custom_presets: EqPreset[];
  save_preset: (name: string, gains: number[]) => void;
  delete_preset: (name: string) => void;
};

const Ctx = createContext<SettingsState | null>(null);

function load_bands(): number[] {
  try {
    const s = localStorage.getItem("eq_bands");
    if (s) {
      const arr = JSON.parse(s);
      if (Array.isArray(arr) && arr.length === EQ_FREQS.length) return arr;
    }
  } catch {}
  return [...FLAT];
}

export function SettingsProv({ children }: { children: ReactNode }) {
  const [immersive_bg, _set_bg] = useState(() => localStorage.getItem("immersive_bg") === "1");
  const [eq_bands, _set_bands] = useState<number[]>(load_bands);
  const [eq_enabled, _set_enabled] = useState(() => localStorage.getItem("eq_enabled") !== "0");
  const [discord_rpc, _set_rpc] = useState(() => localStorage.getItem("discord_rpc") === "1");
  const [rpc_opts, _set_rpc_opts] = useState<RpcOpts>(load_rpc_opts);
  const [tray_enabled, _set_tray] = useState(() => localStorage.getItem("tray_enabled") === "1");
  const [sp_client_id, _set_sp_cid] = useState<string | null>(null);
  const [sp_tokens, _set_sp_tokens] = useState<SpTokens | null>(null);
  const [sp_loading, _set_sp_loading] = useState(false);
  const [pitch, _set_pitch] = useState(() => {
    const s = localStorage.getItem("pitch");
    return s ? parseFloat(s) || 1 : 1;
  });
  const [exp_volume, _set_exp_vol] = useState(() => localStorage.getItem("exp_volume") === "1");
  const [amll_lyrics, _set_amll] = useState(() => localStorage.getItem("amll_lyrics") !== "0");
  const [amll_word_sync, _set_amll_ws] = useState(() => localStorage.getItem("amll_word_sync") === "1");
  const [crossfade, _set_cf] = useState(() => {
    const s = localStorage.getItem("crossfade");
    return s ? Math.max(0, Math.min(12, parseFloat(s) || 0)) : 0;
  });
  const [spatial_audio, _set_spatial] = useState(() => localStorage.getItem("spatial_audio") === "1");
  const [custom_presets, _set_custom_presets] = useState<EqPreset[]>(load_custom_presets);

  useEffect(() => {
    invoke<string | null>("sp_load_client_id").then(id => _set_sp_cid(id ?? null)).catch(e => console.error("sp_load_client_id:", e));
    invoke<SpTokens | null>("sp_load_tokens").then(t => _set_sp_tokens(t ?? null)).catch(e => console.error("sp_load_tokens:", e));
  }, []);

  useEffect(() => {
    set_eq_all(eq_enabled ? eq_bands : [...FLAT]);
  }, [eq_bands, eq_enabled]);

  useEffect(() => {
    audio_set_pitch(pitch);
  }, [pitch]);

  useEffect(() => {
    audio_set_cf(crossfade);
  }, [crossfade]);

  useEffect(() => {
    audio_set_spatial(spatial_audio);
  }, [spatial_audio]);

  useEffect(() => {
    if (!tray_enabled) {
      invoke("tray_set", { enabled: false }).catch(e => console.error("tray_set off:", e));
      return;
    }
    invoke("tray_set", { enabled: true }).catch((err: string) => {
      localStorage.setItem("tray_enabled", "0");
      _set_tray(false);
      message(
        `GS Music requires '${err}' to show a system tray icon.\n\nPlease install it with your package manager, then try again.\n\nThe system tray has been turned off.`,
        { title: "System Tray Unavailable", kind: "error" },
      );
    });
  }, [tray_enabled]);

  function persist_bool(key: string, v: boolean, setter: (v: boolean) => void) {
    localStorage.setItem(key, v ? "1" : "0");
    setter(v);
  }

  const set_immersive_bg = (v: boolean) => persist_bool("immersive_bg", v, _set_bg);
  const set_eq_enabled = (v: boolean) => persist_bool("eq_enabled", v, _set_enabled);
  const set_discord_rpc = (v: boolean) => persist_bool("discord_rpc", v, _set_rpc);
  const set_tray_enabled = (v: boolean) => persist_bool("tray_enabled", v, _set_tray);
  const set_exp_volume = (v: boolean) => persist_bool("exp_volume", v, _set_exp_vol);
  const set_amll_lyrics = (v: boolean) => persist_bool("amll_lyrics", v, _set_amll);
  const set_amll_word_sync = (v: boolean) => persist_bool("amll_word_sync", v, _set_amll_ws);
  const set_spatial_audio = (v: boolean) => persist_bool("spatial_audio", v, _set_spatial);

  function set_eq_bands(gains: number[]) {
    localStorage.setItem("eq_bands", JSON.stringify(gains));
    _set_bands(gains);
  }

  function set_rpc_opts(o: RpcOpts) {
    localStorage.setItem("rpc_opts", JSON.stringify(o));
    _set_rpc_opts(o);
  }

  function set_pitch(v: number) {
    const clamped = Math.round(Math.max(0.25, Math.min(2, v)) * 100) / 100;
    localStorage.setItem("pitch", String(clamped));
    _set_pitch(clamped);
  }

  function set_crossfade(v: number) {
    const clamped = Math.max(0, Math.min(12, Math.round(v)));
    localStorage.setItem("crossfade", String(clamped));
    _set_cf(clamped);
  }

  function save_preset(name: string, gains: number[]) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next = [...custom_presets.filter(p => p.name !== trimmed), { name: trimmed, gains: [...gains] }];
    localStorage.setItem("eq_custom_presets", JSON.stringify(next));
    _set_custom_presets(next);
  }

  function delete_preset(name: string) {
    const next = custom_presets.filter(p => p.name !== name);
    localStorage.setItem("eq_custom_presets", JSON.stringify(next));
    _set_custom_presets(next);
  }

  function set_sp_client_id(id: string | null) {
    _set_sp_cid(id);
    if (id) invoke("sp_save_client_id", { id }).catch(e => console.error("sp_save_client_id:", e));
  }

  async function sp_token(): Promise<string> {
    try {
      const fresh = await invoke<SpTokens | null>("sp_fresh_token");
      if (!fresh) throw new Error("not connected to spotify");
      _set_sp_tokens(fresh);
      return fresh.access_token;
    } catch (e) {
      _set_sp_tokens(null);
      message(`Spotify session expired. Please reconnect your account in Settings.\n\n${e}`, { title: "Spotify Error", kind: "error" });
      throw e;
    }
  }

  async function sp_connect(override_id?: string) {
    const cid = override_id ?? sp_client_id;
    if (!cid) return;
    _set_sp_loading(true);
    try {
      const tokens = await invoke<SpTokens>("sp_authorize", { clientId: cid });
      _set_sp_tokens(tokens);
    } catch (e) {
      message(`Spotify connection failed:\n${e}`, { title: "Spotify Error", kind: "error" });
      throw e;
    } finally {
      _set_sp_loading(false);
    }
  }

  async function sp_disconnect() {
    await invoke("sp_disconnect").catch(e => console.error("sp_disconnect:", e));
    _set_sp_tokens(null);
  }

  return (
    <Ctx.Provider value={{ immersive_bg, set_immersive_bg, eq_bands, set_eq_bands, eq_enabled, set_eq_enabled, discord_rpc, set_discord_rpc, rpc_opts, set_rpc_opts, tray_enabled, set_tray_enabled, sp_client_id, set_sp_client_id, sp_tokens, sp_token, sp_connect, sp_disconnect, sp_loading, pitch, set_pitch, exp_volume, set_exp_volume, amll_lyrics, set_amll_lyrics, amll_word_sync, set_amll_word_sync, crossfade, set_crossfade, spatial_audio, set_spatial_audio, custom_presets, save_preset, delete_preset }}>
      {children}
    </Ctx.Provider>
  );
}

export function use_settings(): SettingsState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("use_settings outside provider");
  return ctx;
}
