import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { use_lib } from "@/ctx";
import { c } from "@/theme";

type Props = { on_next: () => void };

export function StepFolder({ on_next }: Props) {
  const { music_dir, load_library } = use_lib();
  const [picking, set_picking] = useState(false);

  async function pick() {
    set_picking(true);
    try {
      const dir = await open({ directory: true, title: "Select Music Folder" });
      if (dir) await load_library(dir);
    } finally {
      set_picking(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", padding: "0 64px", gap: 40 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.05, color: c.text, margin: 0 }}>
          Where's your<br />music?
        </h2>
        <p style={{ fontSize: 15, color: c.w40, lineHeight: 1.65, maxWidth: 340, fontWeight: 400, margin: 0 }}>
          Choose the folder where your music lives and we'll scan it automatically.
        </p>
      </div>

      {music_dir ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: c.w30, margin: 0 }}>Selected folder</p>
            <p style={{ fontSize: 14, color: c.w70, margin: 0, wordBreak: "break-all", lineHeight: 1.5 }}>{music_dir}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={pick}
              style={{ padding: "11px 22px", borderRadius: 10, fontSize: 14, fontWeight: 500, background: c.w07, color: c.w55, border: `1px solid ${c.w08}`, transition: "opacity 0.12s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Change
            </button>
            <button
              onClick={on_next}
              style={{ padding: "11px 28px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: c.accent, color: c.white, transition: "opacity 0.12s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.82")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={pick}
          disabled={picking}
          style={{ alignSelf: "flex-start", padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: c.accent, color: c.white, opacity: picking ? 0.5 : 1, transition: "opacity 0.12s" }}
          onMouseEnter={e => { if (!picking) e.currentTarget.style.opacity = "0.82"; }}
          onMouseLeave={e => (e.currentTarget.style.opacity = picking ? "0.5" : "1")}
        >
          {picking ? "Choosing…" : "Choose folder"}
        </button>
      )}
    </div>
  );
}
