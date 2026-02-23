import { format_duration } from "@/lib";
import type { DzTrack, DlState } from "../types";
import { DlButton } from "../components/dl_btn";
import { c } from "@/theme";

type Props = {
  tracks: DzTrack[];
  downloads: Map<number, DlState>;
  on_download: (track: DzTrack) => void;
};

export function TrackResults({ tracks, downloads, on_download }: Props) {
  return (
    <>
      {tracks.map((t) => {
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
            <img
              src={t.cover_url}
              style={{
                width: 44,
                height: 44,
                borderRadius: 6,
                objectFit: "cover",
                flexShrink: 0,
                background: c.card,
              }}
            />
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
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {t.artist} · {t.album}
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
    </>
  );
}
