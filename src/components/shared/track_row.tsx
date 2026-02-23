import { useState } from "react";
import { TTrack } from "@/types";
import { use_pl, use_lib } from "@/ctx";
import { format_duration } from "@/lib";
import { Art } from "./art";
import { TrackCtxMenu } from "./track_ctx_menu";
import { Heart } from "lucide-react";
import { c } from "@/theme";

type Props = { track: TTrack; idx: number; queue: TTrack[]; show_art?: boolean };

export function TrackRow({ track, idx, queue, show_art = false }: Props) {
  const { play, current } = use_pl();
  const { is_fav, toggle_fav } = use_lib();
  const active = current?.path === track.path;
  const fav = is_fav(track.path);
  const [hov, set_hov] = useState(false);
  const [ctx, set_ctx] = useState<{ x: number; y: number } | null>(null);

  const on_ctx = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    set_ctx({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <button
        onClick={() => play(track, queue)}
        onContextMenu={on_ctx}
        onMouseEnter={() => set_hov(true)}
        onMouseLeave={() => set_hov(false)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "0 12px",
          height: 52, borderRadius: 8, textAlign: "left",
          background: active ? c.accent_10 : hov ? c.w05 : "transparent",
          transition: "background 0.1s",
        }}
      >
        <span style={{ width: 24, textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", color: active ? c.accent : c.w35, flexShrink: 0 }}>
          {idx + 1}
        </span>

        {show_art && <Art path={track.path} w={40} h={40} radius={4} />}

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: active ? c.accent : c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {track.title}
          </p>
          <p style={{ fontSize: 12, color: c.w50, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist}</p>
        </div>

        <div
          onClick={(e) => { e.stopPropagation(); toggle_fav(track.path); }}
          style={{ flexShrink: 0, display: "flex", alignItems: "center", opacity: fav ? 1 : hov ? 0.5 : 0, transition: "opacity 0.15s", cursor: "pointer" }}
        >
          <Heart size={14} fill={fav ? c.accent : "none"} color={fav ? c.accent : c.w50} />
        </div>

        <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", color: c.w35, flexShrink: 0 }}>{format_duration(track.duration)}</span>
      </button>

      {ctx && (
        <TrackCtxMenu x={ctx.x} y={ctx.y} track={track} on_close={() => set_ctx(null)} />
      )}
    </>
  );
}
