import { useEffect, useState, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { use_lib, use_pl, use_settings, use_profile, use_theme } from "@/ctx";
import { use_cover, use_rpc, load_keybinds, combo_from_event, get_time } from "@/lib";
import type { KeybindAction, KeybindBinds } from "@/lib";
import { WifiOff, RefreshCw, FolderOpen, Server } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { PlBar } from "@/components/player/pl_bar";
import { Router } from "@/pages/router";
import { Onboarding } from "@/pages/discover/onboarding";
import { Loading } from "@/pages/loading";
import { Toasts } from "@/components/toasts";
import { YtdlpSetup } from "@/components/youtube/ytdlp_setup";
import { OfflineNotice } from "@/components/offline_notice";
import { c } from "@/theme";

function ImmersiveBg({ cover }: { cover: string | null }) {
  if (!cover) return null;
  return (
    <div style={{ position: "fixed", inset: 0, z_index: 0, pointer_events: "none", overflow: "hidden" }}>
      <img
        src={cover}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "200%",
          height: "200%",
          filter: "brightness(100%) blur(80px) saturate(150%) contrast(1.2)",
          opacity: 0.8,
          animation: "rotate_bg 35s linear infinite",
          object_fit: "cover",
        }}
      />
      <img
        src={cover}
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "200%",
          height: "200%",
          filter: "brightness(95%) blur(80px) saturate(140%) contrast(1.1)",
          opacity: 0.6,
          animation: "rotate_bg 35s linear infinite reverse",
          animation_delay: "10s",
          object_fit: "cover",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: c.b68 }} />
      <style>{`
        @keyframes rotate_bg {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

const base: React.CSSProperties = { height: "100%", display: "flex", flexDirection: "column", color: c.text, position: "relative" };

export function App() {
  const { loading, err, nav_back, nav_fwd, server_url, connect_server, disconnect_server, load_library } = use_lib();
  const { current } = use_pl();
  const { immersive_bg, discord_rpc, rpc_opts } = use_settings();
  const { theme } = use_theme();
  use_rpc(discord_rpc, rpc_opts);
  const { onboarding_done, finish_onboarding } = use_profile();
  const app_bg = theme.bg2_enabled ? `linear-gradient(135deg, ${theme.bg1}, ${theme.bg2})` : c.bg;
  const cover = use_cover(immersive_bg ? (current?.path ?? null) : null);
  const [ytdlp_ready, set_ytdlp_ready] = useState(false);
  const [show_switch, set_show_switch] = useState(false);
  const [switch_url, set_switch_url] = useState("");

 
  useEffect(() => {
    const win = getCurrentWindow();
    const t = current?.title ? `GS Music - ${current.title}` : "GS Music";
    document.title = t;
    win.setTitle(t).catch(console.error);
  }, [current?.title, current?.artist]);

  useEffect(() => {
    function on_mouse(e: MouseEvent) {
      if (e.button === 3) { e.preventDefault(); nav_back(); }
      if (e.button === 4) { e.preventDefault(); nav_fwd(); }
    }
    window.addEventListener("mouseup", on_mouse);
    return () => window.removeEventListener("mouseup", on_mouse);
  }, [nav_back, nav_fwd]);

  const { toggle, next, prev, set_volume, volume, seek, toggle_shuffle, toggle_repeat } = use_pl();
  const binds_ref = useRef<KeybindBinds>(load_keybinds());
  const vol_ref = useRef(volume);
  const prev_vol = useRef(volume);
  vol_ref.current = volume;

  useEffect(() => {
    function reload() { binds_ref.current = load_keybinds(); }
    window.addEventListener("keybinds_changed", reload);
    return () => window.removeEventListener("keybinds_changed", reload);
  }, []);

  useEffect(() => {
    function on_key(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const combo = combo_from_event(e);
      const b = binds_ref.current;
      const lookup = new Map<string, KeybindAction>();
      for (const [action, key] of Object.entries(b)) lookup.set(key, action as KeybindAction);
      const action = lookup.get(combo);
      if (!action) return;

      e.preventDefault();
      switch (action) {
        case "play_pause": toggle(); break;
        case "next": next(); break;
        case "prev": prev(); break;
        case "vol_up": set_volume(Math.min(1, vol_ref.current + 0.05)); break;
        case "vol_down": set_volume(Math.max(0, vol_ref.current - 0.05)); break;
        case "mute":
          if (vol_ref.current > 0) { prev_vol.current = vol_ref.current; set_volume(0); }
          else set_volume(prev_vol.current || 1);
          break;
        case "seek_fwd": seek(get_time() + 5); break;
        case "seek_back": seek(Math.max(0, get_time() - 5)); break;
        case "shuffle": toggle_shuffle(); break;
        case "repeat": toggle_repeat(); break;
      }
    }
    window.addEventListener("keydown", on_key);
    return () => window.removeEventListener("keydown", on_key);
  }, [toggle, next, prev, set_volume, seek, toggle_shuffle, toggle_repeat]);

  if (!onboarding_done) {
    return (
      <div style={{ ...base, background: app_bg }}>
        <Onboarding on_done={finish_onboarding} />
        {!ytdlp_ready && <YtdlpSetup on_ready={() => set_ytdlp_ready(true)} />}
        <OfflineNotice />
      </div>
    );
  }

  if (loading) return <div style={{ ...base, background: app_bg }}><Loading /><OfflineNotice /></div>;

  async function pick_local_folder() {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const picked = await open({ directory: true, multiple: false });
    if (!picked) return;
    disconnect_server();
    load_library(picked as string);
  }

  function switch_to_server() {
    if (!switch_url.trim()) return;
    disconnect_server();
    connect_server(switch_url.trim());
    set_show_switch(false);
    set_switch_url("");
  }

  if (err) {
    const is_server = err === "server_offline";
    return (
      <div style={{ ...base, background: app_bg, alignItems: "center", justifyContent: "center", gap: 16 }}>
        {is_server ? (
          <>
            <WifiOff size={36} color={c.w30} />
            <p style={{ fontSize: 16, color: c.text, fontWeight: 600 }}>Server Unreachable</p>
            <p style={{ fontSize: 13, color: c.w40, maxWidth: 400, textAlign: "center" }}>
              Couldn't connect to <span style={{ color: c.w60, fontWeight: 500 }}>{server_url}</span>
            </p>
            <p style={{ fontSize: 12, color: c.w30, maxWidth: 360, textAlign: "center", lineHeight: 1.5 }}>
              Make sure the server is running and the URL is correct.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                onClick={() => server_url && connect_server(server_url)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: c.accent, color: "#fff",
                }}
              >
                <RefreshCw size={14} /> Retry
              </button>
              <button
                onClick={() => set_show_switch(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: c.card_alt, color: c.w60,
                }}
              >
                Switch Source
              </button>
            </div>
            {show_switch && (
              <div style={{
                position: "fixed", inset: 0, zIndex: 100,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
              }} onClick={(e) => { if (e.target === e.currentTarget) set_show_switch(false); }}>
                <div style={{
                  background: c.card, border: `1px solid ${c.w10}`, borderRadius: 16,
                  padding: 24, width: 340, display: "flex", flexDirection: "column", gap: 16,
                }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: c.text, margin: 0 }}>Switch Source</p>
                  <button
                    onClick={pick_local_folder}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                      background: c.w06, color: c.text, border: `1px solid ${c.w08}`,
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = c.w10}
                    onMouseLeave={(e) => e.currentTarget.style.background = c.w06}
                  >
                    <FolderOpen size={18} color={c.w50} />
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Use Local Files</p>
                      <p style={{ margin: 0, fontSize: 11, color: c.w40 }}>Pick a music folder on this device</p>
                    </div>
                  </button>
                  <div style={{
                    display: "flex", flexDirection: "column", gap: 8,
                    padding: "12px 16px", borderRadius: 10,
                    background: c.w06, border: `1px solid ${c.w08}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Server size={18} color={c.w50} />
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: c.text }}>Connect to Server</p>
                        <p style={{ margin: 0, fontSize: 11, color: c.w40 }}>Enter a different server URL</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <input
                        value={switch_url}
                        onChange={(e) => set_switch_url(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && switch_to_server()}
                        placeholder="http://192.168.1.x:7700"
                        style={{
                          flex: 1, padding: "7px 10px", borderRadius: 8, fontSize: 12,
                          background: c.w04, border: `1px solid ${c.w10}`, color: c.text,
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={switch_to_server}
                        style={{
                          padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: c.accent, color: "#fff",
                        }}
                      >
                        Go
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => set_show_switch(false)}
                    style={{ fontSize: 12, color: c.w40, padding: "6px 0" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: c.accent, fontWeight: 600 }}>Scan failed</p>
            <p style={{ fontSize: 12, color: c.w40, maxWidth: 400, textAlign: "center", wordBreak: "break-all" }}>{err}</p>
          </>
        )}
        <OfflineNotice />
      </div>
    );
  }

  return (
    <div style={{ ...base, background: immersive_bg ? "transparent" : app_bg }} className={immersive_bg ? "iv-mode" : ""}>
      {immersive_bg && <ImmersiveBg key={current?.path ?? "none"} cover={cover} />}
      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative", zIndex: 1 }}>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Router />
        </main>
      </div>
      <PlBar />
      <Toasts />
      {!ytdlp_ready && <YtdlpSetup on_ready={() => set_ytdlp_ready(true)} />}
      <OfflineNotice />
    </div>
  );
}
