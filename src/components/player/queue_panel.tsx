import { memo, useState, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { use_pl } from "@/ctx";
import { Art } from "@/components/shared/art";
import { format_duration } from "@/lib";
import { X } from "lucide-react";
import { TTrack } from "@/types";
import { c } from "@/theme";

const ROW_H = 48;

const QRow = memo(function QRow({ track, idx, active, on_click }: { track: TTrack; idx: number; active: boolean; on_click: () => void }) {
  const [hov, set_hov] = useState(false);
  return (
    <button
      onClick={on_click}
      onMouseEnter={() => set_hov(true)}
      onMouseLeave={() => set_hov(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "6px 8px",
        borderRadius: 8, textAlign: "left",
        background: active ? c.accent_12 : hov ? c.w05 : "transparent",
        transition: "background 0.1s",
      }}
    >
      <span style={{ width: 20, textAlign: "right", fontSize: 11, fontVariantNumeric: "tabular-nums", color: active ? c.accent : c.w30, flexShrink: 0 }}>
        {idx + 1}
      </span>
      <Art path={track.path} w={36} h={36} radius={4} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: active ? c.accent : c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {track.title}
        </p>
        <p style={{ fontSize: 11, color: c.w40, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist}</p>
      </div>
      <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums", color: c.w30, flexShrink: 0 }}>{format_duration(track.duration)}</span>
    </button>
  );
});

export function QueuePanel({ open, on_close }: { open: boolean; on_close: () => void }) {
  const { queue, queue_idx, play } = use_pl();
  const [cls_hov, set_cls_hov] = useState(false);
  const scroll_ref = useRef<HTMLDivElement>(null);

  const virt = useVirtualizer({
    count: queue.length,
    getScrollElement: () => scroll_ref.current,
    estimateSize: () => ROW_H,
    overscan: 10,
  });

  const on_play = useCallback((t: TTrack) => play(t, queue), [play, queue]);

  return (
    <>
      {open && (
        <div
          onClick={on_close}
          style={{ position: "fixed", inset: 0, zIndex: 90 }}
        />
      )}
      <div
        className={open ? "q-panel-in" : "q-panel-out"}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 80, width: 340,
          background: c.surface_raised, borderLeft: `1px solid ${c.w07}`,
          zIndex: 100, display: "flex", flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", flexShrink: 0, borderBottom: `1px solid ${c.w07}` }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: c.text }}>Queue</h2>
          <button
            onClick={on_close}
            onMouseEnter={() => set_cls_hov(true)}
            onMouseLeave={() => set_cls_hov(false)}
            style={{ color: cls_hov ? c.white : c.w40, transition: "color 0.15s", padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>

        <div ref={scroll_ref} style={{ flex: 1, overflowY: "auto", padding: "8px 8px 16px" }}>
          {queue.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: c.w25, fontSize: 13 }}>
              Nothing in queue
            </div>
          ) : (
            <div style={{ position: "relative", height: virt.getTotalSize() }}>
              {virt.getVirtualItems().map(vi => {
                const t = queue[vi.index];
                return (
                  <div key={`${t.path}-${vi.index}`} style={{ position: "absolute", left: 0, right: 0, height: ROW_H, transform: `translateY(${vi.start}px)` }}>
                    <QRow track={t} idx={vi.index} active={vi.index === queue_idx} on_click={() => on_play(t)} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
