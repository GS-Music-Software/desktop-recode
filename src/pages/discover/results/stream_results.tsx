import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Play, Loader2 } from "lucide-react";
import { use_pl } from "@/ctx";
import { c } from "@/theme";

type YtResult = {
  video_id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
};

type Props = {
  results: YtResult[];
};

function fmt_dur(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function StreamResults({ results }: Props) {
  const [loading_id, set_loading_id] = useState<string | null>(null);
  const pl = use_pl();

  async function play_stream(r: YtResult) {
    set_loading_id(r.video_id);
    try {
      console.log("[stream] resolving:", r.video_id, r.title);
      const stream = await invoke<{ url: string; mime: string; bitrate: number; duration_ms: number }>(
        "yt_get_stream",
        { videoId: r.video_id, highQuality: true },
      );
      console.log("[stream] playing:", stream.mime, stream.bitrate, "bps");
      pl.play(
        {
          path: stream.url,
          title: r.title,
          artist: r.artist,
          album: "",
          duration: stream.duration_ms / 1000,
          track_no: 0,
          year: null,
          cover: r.thumbnail || null,
        },
      );
    } catch (e) {
      console.error("[stream] failed:", e);
    } finally {
      set_loading_id(null);
    }
  }

  return (
    <div style={{ padding: "0 12px" }}>
      {results.map((r) => (
        <div
          key={r.video_id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 12px",
            borderRadius: 10,
            cursor: "pointer",
          }}
          onClick={() => { if (loading_id !== r.video_id) play_stream(r); }}
          onMouseEnter={(e) => (e.currentTarget.style.background = c.w06)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 6,
              overflow: "hidden",
              flexShrink: 0,
              background: c.w08,
              position: "relative",
            }}
          >
            {r.thumbnail && (
              <img
                src={r.thumbnail}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.4)",
                opacity: loading_id === r.video_id ? 1 : 0,
                transition: "opacity 0.15s",
              }}
            >
              {loading_id === r.video_id ? (
                <Loader2 size={18} color={c.white} className="spin" />
              ) : (
                <Play size={18} color={c.white} fill={c.white} />
              )}
            </div>
          </div>
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
              {r.title}
            </p>
            <p
              style={{
                fontSize: 11,
                color: c.w40,
                marginTop: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {r.artist}
            </p>
          </div>
          {r.duration > 0 && (
            <p style={{ fontSize: 11, color: c.w25, flexShrink: 0 }}>
              {fmt_dur(r.duration)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
