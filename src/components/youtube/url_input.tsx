import { useState } from "react";
import { Link } from "lucide-react";
import { c } from "@/theme";

export function YtUrlInput({
  loading,
  on_import,
}: {
  loading: boolean;
  on_import: (url: string) => void;
}) {
  const [url, set_url] = useState("");

  function handle_submit() {
    const trimmed = url.trim();
    if (!trimmed) return;
    on_import(trimmed);
  }

  return (
    <div style={{ padding: "24px 24px 0" }}>
      <div style={{
        display: "flex", gap: 8, alignItems: "center",
        background: c.w04, borderRadius: 10,
        border: `1px solid ${c.w08}`, padding: "4px 4px 4px 14px",
      }}>
        <Link size={14} color={c.w35} style={{ flexShrink: 0 }} />
        <input
          value={url}
          onChange={e => set_url(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handle_submit()}
          placeholder="Paste a YouTube or YouTube Music playlist URL..."
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: c.text, fontSize: 13, padding: "8px 0",
          }}
        />
        <button
          onClick={handle_submit}
          disabled={loading || !url.trim()}
          style={{
            padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: loading ? c.youtube_15 : c.youtube,
            color: c.white, flexShrink: 0, opacity: loading || !url.trim() ? 0.5 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {loading ? "Importing..." : "Import"}
        </button>
      </div>
    </div>
  );
}
