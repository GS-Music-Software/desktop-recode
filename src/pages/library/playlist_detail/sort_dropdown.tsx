import { useState, useEffect } from "react";
import { ArrowUpDown } from "lucide-react";
import { c } from "@/theme";

export type SortMode = "recent" | "title" | "artist" | "album";

const SORT_LABELS: Record<SortMode, string> = { recent: "Recently Added", title: "Title", artist: "Artist", album: "Album" };

export function SortDropdown({ value, on_change }: { value: SortMode; on_change: (v: SortMode) => void }) {
  const [open, set_open] = useState(false);
  const [hov_item, set_hov_item] = useState<SortMode | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => set_open(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.stopPropagation(); set_open(!open); }}
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
          borderRadius: 8, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
          background: c.w06, color: c.w60,
          transition: "background 0.1s",
        }}
      >
        <ArrowUpDown size={12} />
        {SORT_LABELS[value]}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", right: 0, marginTop: 4, zIndex: 100,
          background: c.dropdown, border: `1px solid ${c.w10}`,
          borderRadius: 10, padding: 4, minWidth: 160,
          boxShadow: `0 8px 32px ${c.b50}`, backdropFilter: "blur(20px)",
        }}>
          {(Object.keys(SORT_LABELS) as SortMode[]).map(k => (
            <button
              key={k}
              onClick={(e) => { e.stopPropagation(); on_change(k); set_open(false); }}
              onMouseEnter={() => set_hov_item(k)}
              onMouseLeave={() => set_hov_item(null)}
              style={{
                display: "block", width: "100%", padding: "7px 10px", borderRadius: 6,
                fontSize: 13, fontWeight: value === k ? 600 : 400, textAlign: "left",
                background: hov_item === k ? c.w08 : "transparent",
                color: value === k ? c.accent : c.text,
                transition: "background 0.1s",
              }}
            >
              {SORT_LABELS[k]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
