import type { DzArtist } from "../types";
import { c } from "@/theme";

type Props = {
  artists: DzArtist[];
  on_open: (artist: DzArtist) => void;
};

export function ArtistResults({ artists, on_open }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 14,
        padding: "12px 24px",
      }}
    >
      {artists.map((a) => (
        <button
          key={a.id}
          onClick={() => on_open(a)}
          style={{
            textAlign: "center",
            background: c.w04,
            borderRadius: 12,
            overflow: "hidden",
            border: `1px solid ${c.w06}`,
            padding: "20px 10px 16px",
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
            src={a.picture_url}
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              objectFit: "cover",
              display: "block",
              margin: "0 auto 12px",
              background: c.card,
            }}
          />
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
            {a.name}
          </p>
          {a.nb_album > 0 && (
            <p
              style={{
                fontSize: 11,
                color: c.w35,
                marginTop: 4,
              }}
            >
              {a.nb_album} albums
            </p>
          )}
        </button>
      ))}
    </div>
  );
}
