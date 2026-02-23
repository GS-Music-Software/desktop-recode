import { SbNav, NAV_LIB, NAV_OTHER } from "./sb_nav";
import { SbPlaylists } from "./sb_playlists";
import { use_profile } from "@/ctx";
import { User } from "lucide-react";
import { c } from "@/theme";

function ProfileCard() {
  const { name, avatar } = use_profile();

  return (
    <div style={{ padding: "12px 14px", borderTop: `1px solid ${c.w07}`, flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: c.w08, border: `1px solid ${c.w10}`, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {avatar
          ? <img src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <User size={16} color={c.w35} />
        }
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name || "You"}
        </p>
        <p style={{ fontSize: 11, color: c.w30, marginTop: 1 }}>Member</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: c.surface,
      borderRight: `1px solid ${c.w07}`,
    }}>
      <div
        style={{ height: 52, display: "flex", alignItems: "center", padding: "0 20px", flexShrink: 0 }}
        data-tauri-drag-region
      >
        <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.4px", color: c.text }}>GS Music</span>
      </div>

      <div style={{ flex: 1, padding: "4px 8px", overflowY: "auto" }}>
        <p style={{ padding: "12px 12px 6px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: c.w30 }}>
          Library
        </p>
        <SbNav items={NAV_LIB} />
        <p style={{ padding: "12px 12px 6px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: c.w30, marginTop: 4 }}>
          Playlists
        </p>
        <SbPlaylists />
        <div style={{ height: 1, background: c.w07, margin: "6px 4px" }} />
        <SbNav items={NAV_OTHER} />
      </div>

      <ProfileCard />
    </aside>
  );
}
