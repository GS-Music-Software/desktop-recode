import type { DzAlbum } from "../types";
import { c } from "@/theme";

type Props = {
  albums: DzAlbum[];
  on_open: (album: DzAlbum) => void;
};

export function AlbumResults({ albums, on_open }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 14,
        padding: "12px 24px",
      }}
    >
      {albums.map((a) => (
        <button
          key={a.id}
          onClick={() => on_open(a)}
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
            <p
              style={{
                fontSize: 11,
                color: c.w40,
                marginTop: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {a.artist}
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
    </div>
  );
}
