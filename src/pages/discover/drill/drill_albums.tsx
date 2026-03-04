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
          gap: 14,
          padding: "16px 24px 12px",
        }}
      >
        <img
          src={artist.picture_url}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            objectFit: "cover",
            background: c.card,
            flexShrink: 0,
          }}
        />
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: c.text }}>
            {artist.name}
          </p>
          <p
            style={{
              fontSize: 12,
              color: c.w35,
              marginTop: 3,
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
            gap: 14,
            padding: "8px 24px 16px",
          }}
        >
          {albums.map((a) => (
            <button
              key={a.id}
              onClick={() => on_open_album(a)}
              style={{
                textAlign: "left",
                background: c.w04,
                borderRadius: 12,
                overflow: "hidden",
                border: `1px solid ${c.w06}`,
                transition: "background 0.15s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = c.w07;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = c.w04;
                e.currentTarget.style.transform = "translateY(0)";
              }}
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
              <div style={{ padding: "10px 12px 12px" }}>
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
