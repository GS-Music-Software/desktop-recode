import { Download, Check, X } from "lucide-react";
import { format_duration } from "@/lib";
import type { DlState } from "@/types";
import type { YtTrack } from "./types";
import { c } from "@/theme";

export function YtTrackList({
  tracks,
  dl_keys,
  on_download,
  on_download_all,
}: {
  tracks: YtTrack[];
  dl_keys: Map<string, DlState>;
  on_download: (t: YtTrack, idx: number) => void;
  on_download_all: (tracks: YtTrack[]) => void;
}) {
  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px 8px",
      }}>
        <p style={{ fontSize: 13, color: c.w40 }}>
          {tracks.length} tracks found
        </p>
        {tracks.length > 0 && (
          <button
            onClick={() => on_download_all(tracks)}
            style={{
              padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: c.youtube, color: c.white, flexShrink: 0,
              display: "flex", alignItems: "center", gap: 6,
              transition: "opacity 0.1s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <Download size={14} />
            Download All
          </button>
        )}
      </div>
      {tracks.map((t, i) => {
        const key = `yt::${t.title}::${t.artist}::${i}`;
        const dl = dl_keys.get(key);
        return (
          <div
            key={key}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "7px 24px", transition: "background 0.1s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = c.w04)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {t.cover_url && (
              <img src={t.cover_url} style={{
                width: 36, height: 36, borderRadius: 4, objectFit: "cover",
                flexShrink: 0, background: c.card,
              }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13, fontWeight: 500, color: c.text,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{t.title}</p>
              <p style={{
                fontSize: 12, color: c.w45, marginTop: 2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{t.artist}</p>
            </div>
            {t.duration > 0 && (
              <span style={{
                fontSize: 11, color: c.w30, flexShrink: 0,
                fontVariantNumeric: "tabular-nums",
              }}>
                {format_duration(t.duration)}
              </span>
            )}
            <YtDlButton dl={dl} on_click={() => on_download(t, i)} on_retry={() => on_download(t, i)} />
          </div>
        );
      })}
      {tracks.length === 0 && (
        <p style={{ fontSize: 13, color: c.w30, padding: "16px 24px" }}>No tracks found</p>
      )}
    </div>
  );
}

function YtDlButton({ dl, on_click, on_retry }: { dl: DlState | undefined; on_click: () => void; on_retry: () => void }) {
  return (
    <div style={{ width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {!dl && (
        <button onClick={on_click} style={{ color: c.w40, transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = c.white)}
          onMouseLeave={e => (e.currentTarget.style.color = c.w40)}
        >
          <Download size={16} />
        </button>
      )}
      {dl && !dl.done && !dl.err && (
        <div style={{ position: "relative", width: 28, height: 28 }}>
          <svg width="28" height="28" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="14" cy="14" r="11" fill="none" stroke={c.w10} strokeWidth="2.5" />
            <circle cx="14" cy="14" r="11" fill="none" stroke={c.youtube} strokeWidth="2.5"
              strokeDasharray={`${2 * Math.PI * 11}`}
              strokeDashoffset={`${2 * Math.PI * 11 * (1 - dl.pct / 100)}`}
              style={{ transition: "stroke-dashoffset 0.3s linear" }}
            />
          </svg>
          <span style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 8, color: c.w60, fontVariantNumeric: "tabular-nums",
          }}>{Math.round(dl.pct)}</span>
        </div>
      )}
      {dl?.done && <Check size={16} color={c.success} />}
      {dl?.err && <button onClick={on_retry} title={dl.err ?? ""}><X size={16} color={c.accent} /></button>}
    </div>
  );
}
