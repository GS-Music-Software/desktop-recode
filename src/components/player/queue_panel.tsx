import { memo, useState, useRef, useCallback, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { use_pl } from "@/ctx";
import { Art } from "@/components/shared/art";
import { format_duration } from "@/lib";
import { X, ListMusic, Locate } from "lucide-react";
import { TTrack } from "@/types";
import { c } from "@/theme";

const ROW_H = 52;

function PlayingBars() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 1.5, height: 14, width: 14, justifyContent: "center" }}>
      {[0, 0.2, 0.4].map((d, i) => (
        <span key={i} className="radio-bar" style={{ width: 2.5, borderRadius: 1, background: c.accent, animationDelay: `${d}s` }} />
      ))}
    </div>
  );
}

const QRow = memo(function QRow({ track, active, playing, on_click }: { track: TTrack; active: boolean; playing: boolean; on_click: () => void }) {
  const [hov, set_hov] = useState(false);
  return (
    <button
      onClick={on_click}
      onMouseEnter={() => set_hov(true)}
      onMouseLeave={() => set_hov(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "6px 12px 6px 8px",
        borderRadius: 8, textAlign: "left",
        background: active ? c.accent_12 : hov ? c.w05 : "transparent",
        borderLeft: active ? `2px solid ${c.accent}` : "2px solid transparent",
        transition: "background 0.1s",
      }}
    >
      <div style={{ width: 36, height: 36, flexShrink: 0, position: "relative" }}>
        <Art path={track.path} w={36} h={36} radius={4} />
        {active && playing && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: 4,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <PlayingBars />
          </div>
        )}
      </div>
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
  const { queue, queue_idx, play, playing } = use_pl();
  const [cls_hov, set_cls_hov] = useState(false);
  const [loc_hov, set_loc_hov] = useState(false);
  const [has_opened, set_has_opened] = useState(false);
  const scroll_ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !has_opened) set_has_opened(true);
  }, [open, has_opened]);

  const virt = useVirtualizer({
    count: queue.length,
    getScrollElement: () => scroll_ref.current,
    estimateSize: () => ROW_H,
    overscan: 10,
  });

  const on_play = useCallback((t: TTrack) => play(t, queue), [play, queue]);

  const scroll_to_current = useCallback(() => {
    if (queue_idx >= 0 && queue_idx < queue.length) {
      virt.scrollToIndex(queue_idx, { align: "center", behavior: "smooth" });
    }
  }, [virt, queue_idx, queue.length]);

  if (!has_opened) return null;

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
        <div style={{
          height: 52, display: "flex", alignItems: "center", padding: "0 12px 0 16px", flexShrink: 0,
          borderBottom: `1px solid ${c.w07}`,
          boxShadow: "0 1px 8px rgba(0,0,0,0.15)",
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: c.text }}>Queue</h2>
          {queue.length > 0 && (
            <span style={{ fontSize: 11, color: c.w30, marginLeft: 8, fontVariantNumeric: "tabular-nums" }}>
              {queue.length} {queue.length === 1 ? "track" : "tracks"}
            </span>
          )}
          <div style={{ flex: 1 }} />
          {queue.length > 0 && queue_idx >= 0 && (
            <button
              onClick={scroll_to_current}
              onMouseEnter={() => set_loc_hov(true)}
              onMouseLeave={() => set_loc_hov(false)}
              title="Scroll to current"
              style={{ color: loc_hov ? c.white : c.w40, transition: "color 0.15s", padding: 4, marginRight: 4 }}
            >
              <Locate size={15} />
            </button>
          )}
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8 }}>
              <ListMusic size={32} color={c.w15} />
              <p style={{ color: c.w25, fontSize: 13 }}>Nothing in queue</p>
            </div>
          ) : (
            <div style={{ position: "relative", height: virt.getTotalSize() }}>
              {virt.getVirtualItems().map(vi => {
                const t = queue[vi.index];
                return (
                  <div key={`${t.path}-${vi.index}`} style={{ position: "absolute", left: 0, right: 0, height: ROW_H, transform: `translateY(${vi.start}px)` }}>
                    <QRow track={t} active={vi.index === queue_idx} playing={playing} on_click={() => on_play(t)} />
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
