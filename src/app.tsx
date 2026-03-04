import { useEffect, useState, useRef } from "react";
import { use_lib, use_pl, use_settings, use_profile, use_theme } from "@/ctx";
import { use_cover, use_rpc, load_keybinds, combo_from_event, get_time } from "@/lib";
import type { KeybindAction, KeybindBinds } from "@/lib";
import { WifiOff, RefreshCw, Unplug } from "lucide-react";
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
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      <img src={cover} style={{
        position: "absolute", inset: "-40%", width: "180%", height: "180%",
        objectFit: "cover", filter: "blur(60px) saturate(2) brightness(0.25)",
      }} />
      <img src={cover} className="iv-bg-b1" style={{
        position: "absolute", width: "80%", height: "80%", top: "-25%", left: "-20%",
        objectFit: "cover", borderRadius: "50%",
        filter: "blur(80px) saturate(3) brightness(0.35)",
        animation: "blob1 18s ease-in-out infinite",
      }} />
      <img src={cover} className="iv-bg-b2" style={{
        position: "absolute", width: "75%", height: "75%", bottom: "-25%", right: "-15%",
        objectFit: "cover", borderRadius: "50%",
        filter: "blur(90px) saturate(3.2) brightness(0.3)",
        animation: "blob2 24s ease-in-out infinite",
      }} />
      <img src={cover} className="iv-bg-b3" style={{
        position: "absolute", width: "60%", height: "60%", top: "20%", right: "5%",
        objectFit: "cover", borderRadius: "50%",
        filter: "blur(70px) saturate(2.8) brightness(0.28)",
        animation: "blob3 30s ease-in-out infinite",
      }} />
      <div style={{ position: "absolute", inset: 0, background: c.b68 }} />
    </div>
  );
}

const base: React.CSSProperties = { height: "100%", display: "flex", flexDirection: "column", color: c.text, position: "relative" };

export function App() {
  const { loading, err, nav_back, nav_fwd, library_mode, server_url, connect_server, disconnect_server } = use_lib();
  const { current } = use_pl();
  const { immersive_bg, discord_rpc, rpc_opts } = use_settings();
  const { theme } = use_theme();
  use_rpc(discord_rpc, rpc_opts);
  const { onboarding_done, finish_onboarding } = use_profile();
  const app_bg = theme.bg2_enabled ? `linear-gradient(135deg, ${theme.bg1}, ${theme.bg2})` : c.bg;
  const cover = use_cover(immersive_bg ? (current?.path ?? null) : null);
  const [ytdlp_ready, set_ytdlp_ready] = useState(false);

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
                onClick={disconnect_server}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: c.card_alt, color: c.w60,
                }}
              >
                <Unplug size={14} /> Disconnect
              </button>
            </div>
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
