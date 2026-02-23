import type { DzArtist, DzAlbum } from "../types";
import { c } from "@/theme";

export function DrillAlbums({
  artist,
  albums,
  loading,
  on_open_album,
}: {
  artist: DzArtist;
  albums: DzAlbum[] | null;
  loading: boolean;
  on_open_album: (a: DzAlbum) => void;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 24px 8px",
        }}
      >
        <img
          src={artist.picture_url}
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            objectFit: "cover",
            background: c.card,
            flexShrink: 0,
          }}
        />
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: c.text }}>
            {artist.name}
          </p>
          <p
            style={{
              fontSize: 12,
              color: c.w40,
              marginTop: 2,
            }}
          >
            Albums
          </p>
        </div>
      </div>
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: 32 }} className="dot-bounce">
          <span /><span /><span />
        </div>
      )}
      {albums && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 16,
            padding: "12px 24px",
          }}
        >
          {albums.map((a) => (
            <button
              key={a.id}
              onClick={() => on_open_album(a)}
              style={{
                textAlign: "left",
                background: c.w04,
                borderRadius: 10,
                overflow: "hidden",
                border: `1px solid ${c.w07}`,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = c.w08)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = c.w04)
              }
            >
              <img
                src={a.cover_url}
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  objectFit: "cover",
                  display: "block",
                  background: c.card,
                }}
              />
              <div style={{ padding: "10px 10px 12px" }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: c.text,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {a.title}
                </p>
                {a.nb_tracks > 0 && (
                  <p
                    style={{
                      fontSize: 10,
                      color: c.w25,
                      marginTop: 4,
                    }}
                  >
                    {a.nb_tracks} tracks
                  </p>
                )}
              </div>
            </button>
          ))}
          {albums.length === 0 && (
            <p
              style={{
                fontSize: 13,
                color: c.w30,
                gridColumn: "1/-1",
              }}
            >
              No albums found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
