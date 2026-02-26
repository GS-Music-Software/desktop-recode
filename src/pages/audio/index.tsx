import { use_settings } from "@/ctx";
import { Eq } from "./eq";
import { Pitch } from "./pitch";
import { Crossfade } from "./crossfade";
import { c } from "@/theme";

export function Audio() {
  const { eq_enabled, set_eq_enabled } = use_settings();

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div className="page-header" style={{ height: 52, display: "flex", alignItems: "center", padding: "0 24px", flexShrink: 0, borderBottom: `1px solid ${c.w07}`, gap: 12 }} data-tauri-drag-region>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px", color: c.text, flex: 1 }}>Audio</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: c.w40 }}>Equalizer</span>
          <button
            onClick={() => set_eq_enabled(!eq_enabled)}
            style={{
              width: 36, height: 22, borderRadius: 11, position: "relative", flexShrink: 0,
              background: eq_enabled ? c.accent : c.w12,
              transition: "background 0.2s",
            }}
          >
            <div style={{
              position: "absolute", top: 2, left: eq_enabled ? 16 : 2,
              width: 18, height: 18, borderRadius: "50%", background: c.white,
              transition: "left 0.2s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: `0 1px 4px ${c.b40}`,
            }} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "24px 28px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Eq />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "center", minHeight: "100%" }}>
            <Pitch />
            <Crossfade />
          </div>
        </div>
      </div>
    </div>
  );
}
