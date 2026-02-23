import { Heart, ListMusic } from "lucide-react";
import type { SpPlaylist } from "./types";
import { c } from "@/theme";

export function SpPlaylistList({
  playlists,
  loading,
  on_open_playlist,
  on_open_liked,
}: {
  playlists: SpPlaylist[] | null;
  loading: boolean;
  on_open_playlist: (p: SpPlaylist) => void;
  on_open_liked: () => void;
}) {
  return (
    <div>
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: 32 }} className="dot-bounce">
          <span /><span /><span />
        </div>
      )}
      {!loading && (
        <>
          <button
            onClick={on_open_liked}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 24px", width: "100%", textAlign: "left",
              transition: "background 0.1s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = c.w04)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 6, flexShrink: 0,
              background: c.liked_gradient,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Heart size={20} color={c.white} fill={c.white} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: c.text }}>Liked Songs</p>
              <p style={{ fontSize: 11, color: c.w35, marginTop: 2 }}>Your saved tracks</p>
            </div>
          </button>
          {playlists?.map(pl => (
            <button
              key={pl.id}
              onClick={() => on_open_playlist(pl)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 24px", width: "100%", textAlign: "left",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = c.w04)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 6, flexShrink: 0,
                background: c.w06,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ListMusic size={18} color={c.w40} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13, fontWeight: 500, color: c.text,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{pl.name}</p>
                <p style={{ fontSize: 11, color: c.w35, marginTop: 2 }}>{pl.nb_tracks} tracks</p>
              </div>
            </button>
          ))}
          {playlists?.length === 0 && (
            <p style={{ fontSize: 13, color: c.w30, padding: "16px 24px" }}>No playlists found</p>
          )}
        </>
      )}
    </div>
  );
}
