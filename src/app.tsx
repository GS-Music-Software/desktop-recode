import { useEffect, useState } from "react";
import { use_lib, use_pl, use_settings, use_profile } from "@/ctx";
import { use_cover, use_rpc } from "@/lib";
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
  const { loading, err, nav_back, nav_fwd } = use_lib();
  const { current } = use_pl();
  const { immersive_bg, discord_rpc, rpc_opts } = use_settings();
  use_rpc(discord_rpc, rpc_opts);
  const { onboarding_done, finish_onboarding } = use_profile();
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

  if (!onboarding_done) {
    return (
      <div style={{ ...base, background: c.bg }}>
        <Onboarding on_done={finish_onboarding} />
        {!ytdlp_ready && <YtdlpSetup on_ready={() => set_ytdlp_ready(true)} />}
        <OfflineNotice />
      </div>
    );
  }

  if (loading) return <div style={{ ...base, background: c.bg }}><Loading /><OfflineNotice /></div>;
  if (err) return (
    <div style={{ ...base, background: c.bg, alignItems: "center", justifyContent: "center", gap: 12 }}>
      <p style={{ fontSize: 14, color: c.accent, fontWeight: 600 }}>Scan failed</p>
      <p style={{ fontSize: 12, color: c.w40, maxWidth: 400, textAlign: "center", wordBreak: "break-all" }}>{err}</p>
      <OfflineNotice />
    </div>
  );

  return (
    <div style={{ ...base, background: immersive_bg ? "transparent" : c.bg }} className={immersive_bg ? "iv-mode" : ""}>
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
