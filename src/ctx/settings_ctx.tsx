import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { message } from "@tauri-apps/plugin-dialog";
import { set_eq_all, set_pitch as audio_set_pitch, EQ_FREQS } from "@/lib";

export type EqPreset = { name: string; gains: number[] };

export const EQ_PRESETS: EqPreset[] = [
  { name: "Flat",       gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: "Rock",       gains: [4, 3, 2, 1, -1, -1, 1, 3, 4, 4] },
  { name: "Bass Boost", gains: [6, 5, 4, 2, 1, 0, 0, 0, 0, 0] },
  { name: "Vocal",      gains: [-2, -2, 0, 2, 4, 4, 3, 2, 1, 0] },
  { name: "Electronic", gains: [4, 3, 1, 0, -2, 2, 1, 2, 3, 4] },
  { name: "Acoustic",   gains: [3, 2, 2, 1, 0, 1, 2, 2, 2, 1] },
];

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
  sp_connect: (override_id?: string) => Promise<void>;
  sp_disconnect: () => Promise<void>;
  sp_loading: boolean;
  pitch: number;
  set_pitch: (v: number) => void;
  exp_volume: boolean;
  set_exp_volume: (v: boolean) => void;
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

  function set_immersive_bg(v: boolean) {
    localStorage.setItem("immersive_bg", v ? "1" : "0");
    _set_bg(v);
  }

  function set_eq_bands(gains: number[]) {
    localStorage.setItem("eq_bands", JSON.stringify(gains));
    _set_bands(gains);
  }

  function set_eq_enabled(v: boolean) {
    localStorage.setItem("eq_enabled", v ? "1" : "0");
    _set_enabled(v);
  }

  function set_discord_rpc(v: boolean) {
    localStorage.setItem("discord_rpc", v ? "1" : "0");
    _set_rpc(v);
  }

  function set_rpc_opts(o: RpcOpts) {
    localStorage.setItem("rpc_opts", JSON.stringify(o));
    _set_rpc_opts(o);
  }

  function set_tray_enabled(v: boolean) {
    localStorage.setItem("tray_enabled", v ? "1" : "0");
    _set_tray(v);
  }

  function set_pitch(v: number) {
    const clamped = Math.round(Math.max(0.25, Math.min(2, v)) * 100) / 100;
    localStorage.setItem("pitch", String(clamped));
    _set_pitch(clamped);
  }

  function set_exp_volume(v: boolean) {
    localStorage.setItem("exp_volume", v ? "1" : "0");
    _set_exp_vol(v);
  }

  function set_sp_client_id(id: string | null) {
    _set_sp_cid(id);
    if (id) invoke("sp_save_client_id", { id }).catch(e => console.error("sp_save_client_id:", e));
  }

  async function sp_connect(override_id?: string) {
    const cid = override_id ?? sp_client_id;
    if (!cid) return;
    _set_sp_loading(true);
    try {
      const tokens = await invoke<SpTokens>("sp_authorize", { clientId: cid });
      _set_sp_tokens(tokens);
    } finally {
      _set_sp_loading(false);
    }
  }

  async function sp_disconnect() {
    await invoke("sp_disconnect").catch(e => console.error("sp_disconnect:", e));
    _set_sp_tokens(null);
  }

  return (
    <Ctx.Provider value={{ immersive_bg, set_immersive_bg, eq_bands, set_eq_bands, eq_enabled, set_eq_enabled, discord_rpc, set_discord_rpc, rpc_opts, set_rpc_opts, tray_enabled, set_tray_enabled, sp_client_id, set_sp_client_id, sp_tokens, sp_connect, sp_disconnect, sp_loading, pitch, set_pitch, exp_volume, set_exp_volume }}>
      {children}
    </Ctx.Provider>
  );
}

export function use_settings(): SettingsState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("use_settings outside provider");
  return ctx;
}
