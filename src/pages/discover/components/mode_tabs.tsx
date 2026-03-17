import type { SearchMode } from "../types";
import { c } from "@/theme";

type Props = {
  mode: SearchMode;
  has_spotify: boolean;
  on_switch: (m: SearchMode) => void;
};

export function ModeTabs({ mode, has_spotify, on_switch }: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        padding: "6px 24px 10px",
        flexShrink: 0,
        borderBottom: `1px solid ${c.w06}`,
      }}
    >
      {(["tracks", "albums", "artists", "recs"] as SearchMode[]).map((m) => (
        <button
          key={m}
          onClick={() => on_switch(m)}
          style={{
            padding: "5px 14px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 500,
            background: mode === m ? c.accent : c.w06,
            color: mode === m ? c.white : c.w50,
            border: mode === m ? "none" : `1px solid ${c.w08}`,
          }}
          onMouseEnter={(e) => {
            if (mode !== m) e.currentTarget.style.color = c.white;
          }}
          onMouseLeave={(e) => {
            if (mode !== m) e.currentTarget.style.color = c.w50;
          }}
        >
          {m === "recs" ? "Recommendations" : m.charAt(0).toUpperCase() + m.slice(1)}
        </button>
      ))}
      {has_spotify && (
        <button
          onClick={() => on_switch("spotify")}
          style={{
            padding: "5px 14px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 500,
            background: mode === "spotify" ? c.spotify : c.w06,
            color: mode === "spotify" ? c.white : c.w50,
            border: mode === "spotify" ? "none" : `1px solid ${c.w08}`,
          }}
          onMouseEnter={(e) => {
            if (mode !== "spotify") e.currentTarget.style.color = c.white;
          }}
          onMouseLeave={(e) => {
            if (mode !== "spotify") e.currentTarget.style.color = c.w50;
          }}
        >
          Spotify
        </button>
      )}
      <button
        onClick={() => on_switch("youtube")}
        style={{
          padding: "5px 14px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 500,
          background: mode === "youtube" ? c.youtube : c.w06,
          color: mode === "youtube" ? c.white : c.w50,
          border: mode === "youtube" ? "none" : `1px solid ${c.w08}`,
        }}
        onMouseEnter={(e) => {
          if (mode !== "youtube") e.currentTarget.style.color = c.white;
        }}
        onMouseLeave={(e) => {
          if (mode !== "youtube") e.currentTarget.style.color = c.w50;
        }}
      >
        YouTube Playlist
      </button>
      <button
        onClick={() => on_switch("youtube_link")}
        style={{
          padding: "5px 14px",
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 500,
          background: mode === "youtube_link" ? c.youtube : c.w06,
          color: mode === "youtube_link" ? c.white : c.w50,
          border: mode === "youtube_link" ? "none" : `1px solid ${c.w08}`,
        }}
        onMouseEnter={(e) => {
          if (mode !== "youtube_link") e.currentTarget.style.color = c.white;
        }}
        onMouseLeave={(e) => {
          if (mode !== "youtube_link") e.currentTarget.style.color = c.w50;
        }}
      >
        YouTube Link
      </button>
    </div>
  );
}
