import { Card } from "../migrate/card";
import { SpotifyIcon, YoutubeIcon } from "../migrate/icons";
import { c } from "@/theme";

type Props = {
  did_migrate: boolean;
  on_spotify: () => void;
  on_youtube: () => void;
  on_next: () => void;
};

export function HomeView({ did_migrate, on_spotify, on_youtube, on_next }: Props) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.05, color: c.text, margin: 0 }}>
          Allow us to help<br />you migrate.
        </h2>
        <p style={{ fontSize: 15, color: c.w40, lineHeight: 1.65, maxWidth: 340, fontWeight: 400, margin: 0 }}>
          Import your playlists and liked songs from other platforms.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 360 }}>
        <Card
          label="Import from Spotify"
          sub="Playlists and liked songs"
          color={c.spotify}
          icon={<SpotifyIcon />}
          on_click={on_spotify}
        />
        <Card
          label="Import from YouTube Music"
          sub="Playlists via URL"
          color={c.youtube}
          icon={<YoutubeIcon />}
          on_click={on_youtube}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <button
          onClick={on_next}
          style={{
            alignSelf: "flex-start", padding: "12px 28px", borderRadius: 10,
            fontSize: 14, fontWeight: 600,
            background: did_migrate ? c.accent : c.w07,
            color: did_migrate ? c.white : c.w55,
            border: did_migrate ? "none" : `1px solid ${c.w08}`,
            transition: "opacity 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.82")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {did_migrate ? "Continue" : "Skip for now"}
        </button>
      </div>
    </>
  );
}
