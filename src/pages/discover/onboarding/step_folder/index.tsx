import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { use_lib } from "@/ctx";
import { c } from "@/theme";
import { ServerConnect } from "./server_connect";

type Props = { on_next: () => void };
type Source = "pick" | "local" | "server";

export function StepFolder({ on_next }: Props) {
  const { music_dir, library_mode } = use_lib();
  const [source, set_source] = useState<Source>("pick");

  const done = (library_mode === "server") || !!music_dir;

  if (source === "pick") return <SourcePicker set_source={set_source} done={done} on_next={on_next} />;
  if (source === "server") return <ServerConnect on_back={() => set_source("pick")} on_next={on_next} />;
  return <LocalPicker on_back={() => set_source("pick")} on_next={on_next} />;
}

function SourcePicker({ set_source, done, on_next }: { set_source: (s: Source) => void; done: boolean; on_next: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", padding: "0 64px", gap: 40 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.05, color: c.text, margin: 0 }}>
          Where's your<br />music?
        </h2>
        <p style={{ fontSize: 15, color: c.w40, lineHeight: 1.65, maxWidth: 360, fontWeight: 400, margin: 0 }}>
          Choose a local folder on this device, or connect to a GS Music server.
        </p>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <OptionCard
          title="Local Files"
          desc="Scan a folder on this device"
          on_click={() => set_source("local")}
        />
        <OptionCard
          title="Connect to Server"
          desc="Stream from a GS Music server"
          on_click={() => set_source("server")}
        />
      </div>

      {done && (
        <button
          onClick={on_next}
          style={{ alignSelf: "flex-start", padding: "11px 28px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: c.accent, color: c.white, transition: "opacity 0.12s" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.82")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          Continue
        </button>
      )}
    </div>
  );
}

function OptionCard({ title, desc, on_click }: { title: string; desc: string; on_click: () => void }) {
  return (
    <button
      onClick={on_click}
      style={{
        display: "flex", flexDirection: "column", gap: 6,
        padding: "20px 24px", borderRadius: 14,
        background: c.w04, border: `1px solid ${c.w08}`,
        textAlign: "left", cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
        minWidth: 160,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = c.w15; e.currentTarget.style.background = c.w06; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = c.w08; e.currentTarget.style.background = c.w04; }}
    >
      <p style={{ fontSize: 14, fontWeight: 600, color: c.text, margin: 0 }}>{title}</p>
      <p style={{ fontSize: 12, color: c.w40, margin: 0 }}>{desc}</p>
    </button>
  );
}

function LocalPicker({ on_back, on_next }: { on_back: () => void; on_next: () => void }) {
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
          Local Files
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
            <BackBtn on_click={on_back} />
            <button onClick={pick} style={sec_btn}>Change</button>
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
        <div style={{ display: "flex", gap: 10 }}>
          <BackBtn on_click={on_back} />
          <button
            onClick={pick}
            disabled={picking}
            style={{ padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: c.accent, color: c.white, opacity: picking ? 0.5 : 1, transition: "opacity 0.12s" }}
            onMouseEnter={e => { if (!picking) e.currentTarget.style.opacity = "0.82"; }}
            onMouseLeave={e => (e.currentTarget.style.opacity = picking ? "0.5" : "1")}
          >
            {picking ? "Choosing..." : "Choose folder"}
          </button>
        </div>
      )}
    </div>
  );
}

function BackBtn({ on_click }: { on_click: () => void }) {
  return (
    <button
      onClick={on_click}
      style={sec_btn}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
    >
      Back
    </button>
  );
}

const sec_btn: React.CSSProperties = {
  padding: "11px 22px", borderRadius: 10, fontSize: 14, fontWeight: 500,
  background: c.w07, color: c.w55, border: `1px solid ${c.w08}`, transition: "opacity 0.12s",
};
