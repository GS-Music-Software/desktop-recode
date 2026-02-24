import { use_lib, use_pl } from "@/ctx";
import { Header } from "@/components/layout/header";
import { GridCard } from "@/components/shared/grid_card";
import { ShufflePlayBtn } from "@/components/shared/shuffle_play_btn";
import { format_count } from "@/lib";
import { useMemo, useCallback } from "react";
import { Play, Shuffle } from "lucide-react";

export function Artists() {
  const { artists, set_view, set_artist, search } = use_lib();
  const { play } = use_pl();

  const filtered = useMemo(() => {
    if (!search) return artists;
    const q = search.toLowerCase();
    return artists.filter(a => a.name.toLowerCase().includes(q));
  }, [artists, search]);

  const all_tracks = useMemo(() => filtered.flatMap(a => a.tracks), [filtered]);

  const play_all = useCallback(() => {
    if (all_tracks.length === 0) return;
    play(all_tracks[0], all_tracks);
  }, [all_tracks, play]);

  const shuffle_all = useCallback(() => {
    if (all_tracks.length === 0) return;
    const shuffled = [...all_tracks].sort(() => Math.random() - 0.5);
    play(shuffled[0], shuffled);
  }, [all_tracks, play]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header title="Artists" actions={
        all_tracks.length > 0 ? (
          <div style={{ display: "flex", gap: 6 }}>
            <ShufflePlayBtn icon={Play} label="Play" on_click={play_all} />
            <ShufflePlayBtn icon={Shuffle} label="Shuffle" on_click={shuffle_all} filled={false} />
          </div>
        ) : undefined
      } />
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 4 }}>
          {filtered.map((a, i) => (
            <GridCard key={a.name} title={a.name} sub={format_count(a.albums.length, "album")} cover_path={a.cover_path} on_click={() => { set_artist(filtered[i]); set_view("artist_detail"); }} circle />
          ))}
        </div>
      </div>
    </div>
  );
}
