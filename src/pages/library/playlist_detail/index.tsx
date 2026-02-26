import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useVirtualizer } from "@tanstack/react-virtual";
import { use_lib, use_pl } from "@/ctx";
import { TPlaylist, TTrack } from "@/types";
import { format_duration } from "@/lib";
import { Play, Shuffle, ListMusic, Search } from "lucide-react";
import { PlCover } from "./cover";
import { HeroBtn } from "./hero_btn";
import { PlTrackRow, ROW_H } from "./track_row";
import { SortDropdown, type SortMode } from "./sort_dropdown";
import { c } from "@/theme";

export function PlaylistDetail() {
  const { selected_playlist, tracks, load_playlists, favs, is_fav, toggle_fav, albums, artists, set_album, set_artist, set_view } = use_lib();
  const { play, current } = use_pl();
  const [pl, set_pl] = useState<TPlaylist | null>(selected_playlist);
  const [hov_idx, set_hov_idx] = useState<number | null>(null);
  const [sort, set_sort] = useState<SortMode>("recent");
  const [query, set_query] = useState("");
  const scroll_ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected_playlist) {
      invoke<TPlaylist>("pl_get", { id: selected_playlist.id })
        .then(set_pl)
        .catch(e => console.error("pl_get:", e));
    }
    set_query("");
  }, [selected_playlist]);

  useEffect(() => {
    if (pl?.id === "__favorites") {
      invoke<TPlaylist>("pl_favs").then(set_pl).catch(e => console.error("pl_favs:", e));
    }
  }, [favs]);

  const all_tracks = useMemo(() => {
    if (!pl) return [];
    const by_path = new Map(tracks.map(t => [t.path, t]));
    return pl.tracks
      .map(p => by_path.get(p))
      .filter((t): t is TTrack => !!t);
  }, [pl, tracks]);

  const resolved = useMemo(() => {
    let list = [...all_tracks];
    if (sort === "recent") {
      list.reverse();
    } else if (sort === "title") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "artist") {
      list.sort((a, b) => a.artist.localeCompare(b.artist));
    } else if (sort === "album") {
      list.sort((a, b) => a.album.localeCompare(b.album));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
      );
    }
    return list;
  }, [all_tracks, sort, query]);

  const virt = useVirtualizer({
    count: resolved.length,
    getScrollElement: () => scroll_ref.current,
    estimateSize: () => ROW_H,
    overscan: 20,
  });

  const remove_track = useCallback(async (path: string) => {
    if (!pl) return;
    await invoke("pl_remove_track", { id: pl.id, trackPath: path }).catch(e => console.error("pl_remove_track:", e));
    set_pl(prev => prev ? { ...prev, tracks: prev.tracks.filter(t => t !== path) } : null);
    load_playlists();
  }, [pl, load_playlists]);

  const play_all = useCallback(() => {
    if (!resolved.length) return;
    play(resolved[0], resolved);
  }, [resolved, play]);

  const shuffle_all = useCallback(() => {
    if (!resolved.length) return;
    const shuffled = [...resolved].sort(() => Math.random() - 0.5);
    play(shuffled[0], shuffled);
  }, [resolved, play]);

  const handle_artist = useCallback((name: string) => {
    const ar = artists.find(a => a.name === name);
    if (ar) { set_artist(ar); set_view("artist_detail"); }
  }, [artists, set_artist, set_view]);

  const handle_album = useCallback((name: string, artist: string) => {
    const al = albums.find(a => a.name === name && a.artist === artist);
    if (al) { set_album(al); set_view("album_detail"); }
  }, [albums, set_album, set_view]);

  if (!pl) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: c.w30 }}>
        No playlist selected
      </div>
    );
  }

  const total_dur = all_tracks.reduce((s, t) => s + t.duration, 0);
  const cur_path = current?.path ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div ref={scroll_ref} style={{ flex: 1, overflowY: "auto" }}>
        <div style={{
          display: "flex", gap: 28, padding: "32px 32px 24px",
          alignItems: "flex-end",
        }}>
          <PlCover
            cover={pl.cover}
            is_favs={pl.id === "__favorites"}
            pl_id={pl.id}
            on_cover_change={(cover) => set_pl(prev => prev ? { ...prev, cover } : null)}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
            <h1 style={{
              fontSize: 32, fontWeight: 800, color: c.text, letterSpacing: "-0.5px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{pl.name}</h1>
            {pl.description && (
              <p style={{ fontSize: 13, color: c.w45, lineHeight: 1.4 }}>{pl.description}</p>
            )}
            <p style={{
              fontSize: 12, fontWeight: 600, color: c.w40,
              textTransform: "uppercase", letterSpacing: "0.04em",
            }}>
              {all_tracks.length} {all_tracks.length === 1 ? "track" : "tracks"}
              {total_dur > 0 && <span> &middot; {format_duration(total_dur)}</span>}
            </p>
            {all_tracks.length > 0 && (
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <HeroBtn label="Play" icon={Play} on_click={play_all} fill />
                <HeroBtn label="Shuffle" icon={Shuffle} on_click={shuffle_all} />
              </div>
            )}
          </div>
        </div>

        {all_tracks.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 36px 8px", maxWidth: 420 }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: 8,
              background: c.w06, borderRadius: 8, padding: "6px 12px",
            }}>
              <Search size={14} color={c.w30} />
              <input
                value={query}
                onChange={e => set_query(e.target.value)}
                placeholder="Search in playlist..."
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  fontSize: 13, color: c.text,
                }}
              />
            </div>
            <SortDropdown value={sort} on_change={set_sort} />
          </div>
        )}

        {resolved.length > 0 && (
          <div style={{ position: "relative", height: virt.getTotalSize(), padding: "0 0 8px" }}>
            {virt.getVirtualItems().map(vi => {
              const t = resolved[vi.index];
              return (
                <div
                  key={t.path}
                  style={{
                    position: "absolute", top: 0, left: 0, width: "100%",
                    height: vi.size, transform: `translateY(${vi.start}px)`,
                  }}
                >
                  <PlTrackRow
                    track={t}
                    active={cur_path === t.path}
                    fav={is_fav(t.path)}
                    hov={hov_idx === vi.index}
                    on_play={() => play(t, resolved)}
                    on_enter={() => set_hov_idx(vi.index)}
                    on_leave={() => set_hov_idx(null)}
                    on_remove={() => remove_track(t.path)}
                    on_fav={() => toggle_fav(t.path)}
                    on_artist={() => handle_artist(t.artist)}
                    on_album={() => handle_album(t.album, t.artist)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {all_tracks.length === 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "60px 0", gap: 8, color: c.w20,
          }}>
            <ListMusic size={40} strokeWidth={1} />
            <p style={{ fontSize: 13 }}>This playlist is empty</p>
          </div>
        )}

        {all_tracks.length > 0 && resolved.length === 0 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "40px 0", color: c.w25, fontSize: 13,
          }}>
            No matching tracks
          </div>
        )}
      </div>
    </div>
  );
}
