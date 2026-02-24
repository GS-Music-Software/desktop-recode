import { use_lib, use_pl } from "@/ctx";
import { Header } from "@/components/layout/header";
import { TrackRow } from "@/components/shared/track_row";
import { ShufflePlayBtn } from "@/components/shared/shuffle_play_btn";
import { useMemo, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Play, Shuffle } from "lucide-react";

const ROW_H = 52;

export function Songs() {
  const { tracks, search } = use_lib();
  const { play } = use_pl();
  const ref = useRef<HTMLDivElement>(null);

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
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    play(shuffled[0], shuffled);
  }, [filtered, play]);

  const virt = useVirtualizer({ count: filtered.length, getScrollElement: () => ref.current, estimateSize: () => ROW_H, overscan: 20 });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header title="Songs" actions={
        filtered.length > 0 ? (
          <div style={{ display: "flex", gap: 6 }}>
            <ShufflePlayBtn icon={Play} label="Play" on_click={play_all} />
            <ShufflePlayBtn icon={Shuffle} label="Shuffle" on_click={shuffle_all} filled={false} />
          </div>
        ) : undefined
      } />
      <div ref={ref} style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
        <div style={{ position: "relative", height: virt.getTotalSize() }}>
          {virt.getVirtualItems().map(vi => {
            const t = filtered[vi.index];
            return (
              <div key={t.path} style={{ position: "absolute", left: 0, right: 0, height: ROW_H, transform: `translateY(${vi.start}px)` }}>
                <TrackRow track={t} idx={vi.index} queue={filtered} show_art />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
