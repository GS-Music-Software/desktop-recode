import type { YtTrack } from "@/components/youtube/discover";
import { BackBtn } from "../migrate/back_btn";
import { c } from "@/theme";

type Props = {
  name: string;
  tracks: YtTrack[];
  on_back: () => void;
  on_migrate: () => void;
};

export function YtTracksView({ name, tracks, on_back, on_migrate }: Props) {
  return (
    <>
      <BackBtn on_click={on_back} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.05, color: c.text, margin: 0 }}>
          {name || "YouTube Playlist"}
        </h2>
        <p style={{ fontSize: 13, color: c.w35, margin: 0 }}>
          {tracks.length} tracks found
        </p>
      </div>
      <div style={{
        display: "flex", flexDirection: "column", gap: 2,
        maxHeight: 260, overflowY: "auto", marginRight: -8, paddingRight: 8,
      }}>
        {tracks.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
            {t.cover_url && (
              <img
                src={t.cover_url}
                style={{
                  width: 32, height: 32, borderRadius: 4, objectFit: "cover",
                  flexShrink: 0, background: c.card,
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 12, fontWeight: 500, color: c.text,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {t.title}
              </p>
              <p style={{
                fontSize: 11, color: c.w35,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {t.artist}
              </p>
            </div>
          </div>
        ))}
      </div>
      {tracks.length > 0 && (
        <button
          onClick={on_migrate}
          style={{
            alignSelf: "flex-start", padding: "12px 28px", borderRadius: 10,
            fontSize: 14, fontWeight: 600, background: c.youtube, color: c.white,
            transition: "opacity 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.82")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Migrate {tracks.length} tracks
        </button>
      )}
    </>
  );
}
