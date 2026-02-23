import { format_duration } from "@/lib";
import type { DzAlbum, DzTrack, DlState } from "../types";
import { DlButton } from "../components/dl_btn";
import { c } from "@/theme";

export function DrillTracks({
  album,
  tracks,
  loading,
  downloads,
  on_download,
}: {
  album: DzAlbum;
  tracks: DzTrack[] | null;
  loading: boolean;
  downloads: Map<number, DlState>;
  on_download: (t: DzTrack) => void;
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
          src={album.cover_url}
          style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            objectFit: "cover",
            background: c.card,
            flexShrink: 0,
          }}
        />
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: c.text }}>
            {album.title}
          </p>
          <p
            style={{
              fontSize: 12,
              color: c.w40,
              marginTop: 2,
            }}
          >
            {album.artist}
          </p>
        </div>
      </div>
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: 32 }} className="dot-bounce">
          <span /><span /><span />
        </div>
      )}
      {tracks &&
        tracks.map((t) => {
          const dl = downloads.get(t.id);
          return (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "7px 24px",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = c.w04)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: c.text,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.title}
                </p>
                <p
                  style={{
                    fontSize: 12,
                    color: c.w45,
                    marginTop: 2,
                  }}
                >
                  {t.artist}
                </p>
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: c.w30,
                  flexShrink: 0,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {format_duration(t.duration)}
              </span>
              <DlButton
                dl={dl}
                on_click={() => on_download(t)}
                on_retry={() => on_download(t)}
              />
            </div>
          );
        })}
      {tracks && tracks.length === 0 && (
        <p
          style={{
            fontSize: 13,
            color: c.w30,
            padding: "16px 24px",
          }}
        >
          No tracks found
        </p>
      )}
    </div>
  );
}
