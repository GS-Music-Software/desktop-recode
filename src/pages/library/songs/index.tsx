import { use_lib, use_pl } from "@/ctx";
import { Header } from "@/components/layout/header";
import { TrackRow } from "@/components/shared/track_row";
import { ShufflePlayBtn } from "@/components/shared/shuffle_play_btn";
import { useMemo, useRef, useCallback, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Play, Shuffle, RefreshCw } from "lucide-react";
import { c } from "@/theme";

const ROW_H = 52;

export function Songs() {
  const { tracks, search, rescan_library } = use_lib();
  const { play, set_shuffle } = use_pl();
  const ref = useRef<HTMLDivElement>(null);
  const [scanning, set_scanning] = useState(false);
  const [rescan_key, set_rescan_key] = useState(0);

  const filtered = useMemo(() => {
    if (!search) return tracks;
    const q = search.toLowerCase();
    return tracks.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.album.toLowerCase().includes(q));
  }, [tracks, search]);

  const play_all = useCallback(() => {
    if (filtered.length === 0) return;
    play(filtered[0], filtered);
  }, [filtered, play]);

  const shuffle_all = useCallback(() => {
    if (filtered.length === 0) return;
    set_shuffle(true);
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    play(shuffled[0], shuffled);
  }, [filtered, play, set_shuffle]);

  const rescan = useCallback(async () => {
    if (scanning) return;
    set_scanning(true);
    const min = new Promise(r => setTimeout(r, 800));
    await Promise.all([rescan_library(), min]);
    set_rescan_key(k => k + 1);
    set_scanning(false);
  }, [scanning, rescan_library]);

  const virt = useVirtualizer({ count: filtered.length, getScrollElement: () => ref.current, estimateSize: () => ROW_H, overscan: 20 });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header title="Songs" actions={
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {filtered.length > 0 && (
            <>
              <ShufflePlayBtn icon={Play} label="Play" on_click={play_all} />
              <ShufflePlayBtn icon={Shuffle} label="Shuffle" on_click={shuffle_all} filled={false} />
            </>
          )}
          <button
            onClick={rescan}
            title="Rescan library"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 30, height: 30, borderRadius: "50%",
              background: "transparent",
              transition: "background 0.15s",
              cursor: scanning ? "default" : "pointer",
              opacity: scanning ? 0.5 : 1,
              animation: scanning ? "spin 0.8s linear infinite" : "none",
            }}
            onMouseEnter={e => { if (!scanning) e.currentTarget.style.background = c.w10; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <RefreshCw size={15} color={c.w45} />
          </button>
        </div>
      } />
      <div ref={ref} style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
        <div style={{ position: "relative", height: virt.getTotalSize() }}>
          {virt.getVirtualItems().map(vi => {
            const t = filtered[vi.index];
            return (
              <div
                key={`${t.path}-${rescan_key}`}
                style={{
                  position: "absolute", left: 0, right: 0, height: ROW_H,
                  transform: `translateY(${vi.start}px)`,
                  animation: `rescan-row 0.35s ease both`,
                  animationDelay: `${Math.min(vi.index * 20, 400)}ms`,
                }}
              >
                <TrackRow track={t} idx={vi.index} queue={filtered} show_art />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
