import { Link } from "lucide-react";
import { BackBtn } from "../migrate/back_btn";
import { c } from "@/theme";

type Props = {
  url: string;
  set_url: (url: string) => void;
  loading: boolean;
  progress: { phase: string; done: number; total: number } | null;
  on_back: () => void;
  on_import: () => void;
};

export function YtInputView({ url, set_url, loading, progress, on_back, on_import }: Props) {
  return (
    <>
      <BackBtn on_click={on_back} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.05, color: c.text, margin: 0 }}>
          YouTube Music
        </h2>
        <p style={{ fontSize: 14, color: c.w40, margin: 0, maxWidth: 340 }}>
          Paste a YouTube or YouTube Music playlist URL to import it.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{
          display: "flex", gap: 8, alignItems: "center", maxWidth: 400,
          background: c.w04, borderRadius: 10,
          border: `1px solid ${c.w08}`, padding: "4px 4px 4px 14px",
        }}>
          <Link size={14} color={c.w35} style={{ flexShrink: 0 }} />
          <input
            value={url}
            onChange={(e) => set_url(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && on_import()}
            placeholder="Paste playlist URL..."
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: c.text, fontSize: 13, padding: "8px 0",
            }}
          />
          <button
            onClick={on_import}
            disabled={loading || !url.trim()}
            style={{
              padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: loading ? c.youtube_15 : c.youtube,
              color: c.white, flexShrink: 0,
              opacity: loading || !url.trim() ? 0.5 : 1,
            }}
          >
            {loading ? "Importing..." : "Import"}
          </button>
        </div>
        {loading && progress && progress.phase === "covers" && progress.total > 0 && (
          <div style={{ maxWidth: 300 }}>
            <p style={{ fontSize: 12, color: c.w40, marginBottom: 6 }}>
              Looking up track {progress.done} / {progress.total}
            </p>
            <div style={{ height: 4, borderRadius: 2, background: c.w10, overflow: "hidden" }}>
              <div style={{
                width: `${Math.round((progress.done / progress.total) * 100)}%`,
                height: "100%", borderRadius: 2, background: c.youtube,
                transition: "width 0.2s ease",
              }} />
            </div>
          </div>
        )}
        {loading && !progress && (
          <div style={{ display: "flex", gap: 6 }} className="dot-bounce">
            <span /><span /><span />
          </div>
        )}
      </div>
    </>
  );
}
