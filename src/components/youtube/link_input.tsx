import { useState } from "react";
import { Link } from "lucide-react";
import { c } from "@/theme";

export function YtLinkInput({
  loading,
  on_search,
}: {
  loading: boolean;
  on_search: (urls: string) => void;
}) {
  const [text, set_text] = useState("");

  function handle_submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    on_search(trimmed);
  }

  const has_multi =
    text.includes("\n") && text.trim().split(/\n/).filter(Boolean).length > 1;

  return (
    <div style={{ padding: "24px 24px 0" }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: has_multi ? "flex-end" : "center",
          background: c.w04,
          borderRadius: 10,
          border: `1px solid ${c.w08}`,
          padding: "4px 4px 4px 14px",
        }}
      >
        <Link
          size={14}
          color={c.w35}
          style={{ flexShrink: 0, marginBottom: has_multi ? 8 : 0 }}
        />
        <textarea
          value={text}
          onChange={(e) => set_text(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !has_multi) {
              e.preventDefault();
              handle_submit();
            }
          }}
          placeholder="Paste YouTube link(s) — one per line for bulk"
          rows={has_multi ? Math.min(text.split("\n").length, 6) : 1}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: c.text,
            fontSize: 13,
            padding: "8px 0",
            resize: "none",
            fontFamily: "inherit",
            lineHeight: "1.5",
            overflow: "hidden",
          }}
        />
        <button
          onClick={handle_submit}
          disabled={loading || !text.trim()}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            background: loading ? c.youtube_15 : c.youtube,
            color: c.white,
            flexShrink: 0,
            opacity: loading || !text.trim() ? 0.5 : 1,
            transition: "opacity 0.15s",
            marginBottom: has_multi ? 4 : 0,
          }}
        >
          {loading ? "Importing..." : has_multi ? "Import All" : "Import"}
        </button>
      </div>
    </div>
  );
}
