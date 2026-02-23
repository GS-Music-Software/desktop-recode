import { useState, memo } from "react";
import { TTrack } from "@/types";
import { format_duration } from "@/lib";
import { Art } from "@/components/shared/art";
import { TrackCtxMenu } from "@/components/shared/track_ctx_menu";
import { Trash2, Heart } from "lucide-react";
import { c } from "@/theme";

export const ROW_H = 52;

export const PlTrackRow = memo(function PlTrackRow({ track, active, fav, hov, on_play, on_enter, on_leave, on_remove, on_fav, on_artist, on_album }: {
  track: TTrack; active: boolean; fav: boolean;
  hov: boolean; on_play: () => void; on_enter: () => void; on_leave: () => void;
  on_remove: () => void; on_fav: () => void; on_artist: () => void; on_album: () => void;
}) {
  const [ctx, set_ctx] = useState<{ x: number; y: number } | null>(null);
  const [hov_artist, set_hov_artist] = useState(false);
  const [hov_album, set_hov_album] = useState(false);

  const on_ctx = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    set_ctx({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div
        onMouseEnter={on_enter}
        onMouseLeave={on_leave}
        onClick={on_play}
        onContextMenu={on_ctx}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "6px 12px", margin: "0 24px", borderRadius: 8,
          cursor: "pointer", height: ROW_H, boxSizing: "border-box",
          background: active ? c.accent_08 : hov ? c.w04 : "transparent",
          transition: "background 0.1s",
        }}
      >
        <Art path={track.path} w={40} h={40} radius={4} />

        <div style={{ flex: 2, minWidth: 0 }}>
          <p style={{
            fontSize: 14, fontWeight: 500,
            color: active ? c.accent : c.text,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{track.title}</p>
        </div>

        <p
          onClick={(e) => { e.stopPropagation(); on_artist(); }}
          onMouseEnter={() => set_hov_artist(true)}
          onMouseLeave={() => set_hov_artist(false)}
          style={{
            flex: 1.5, fontSize: 13, color: c.w50, minWidth: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            cursor: "pointer", textDecoration: hov_artist ? "underline" : "none",
          }}
        >{track.artist}</p>

        <p
          onClick={(e) => { e.stopPropagation(); on_album(); }}
          onMouseEnter={() => set_hov_album(true)}
          onMouseLeave={() => set_hov_album(false)}
          style={{
            flex: 1.5, fontSize: 13, color: c.w50, minWidth: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            cursor: "pointer", textDecoration: hov_album ? "underline" : "none",
          }}
        >{track.album}</p>

        <div
          onClick={(e) => { e.stopPropagation(); on_fav(); }}
          style={{ flexShrink: 0, display: "flex", alignItems: "center", opacity: fav ? 1 : hov ? 0.5 : 0, transition: "opacity 0.15s", cursor: "pointer" }}
        >
          <Heart size={14} fill={fav ? c.accent : "none"} color={fav ? c.accent : c.w50} />
        </div>

        <span style={{
          fontSize: 12, color: c.w30, flexShrink: 0,
          fontVariantNumeric: "tabular-nums", width: 40, textAlign: "right",
        }}>
          {format_duration(track.duration)}
        </span>

        <div style={{ width: 24, flexShrink: 0, display: "flex", justifyContent: "center" }}>
          {hov && (
            <button
              onClick={(e) => { e.stopPropagation(); on_remove(); }}
              style={{ color: c.w30, transition: "color 0.1s" }}
              onMouseEnter={e => (e.currentTarget.style.color = c.accent)}
              onMouseLeave={e => (e.currentTarget.style.color = c.w30)}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
      {ctx && <TrackCtxMenu x={ctx.x} y={ctx.y} track={track} on_close={() => set_ctx(null)} />}
    </>
  );
});
