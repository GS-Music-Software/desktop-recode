import { memo, useState } from "react";
import { TTrack } from "@/types";
import { format_duration } from "@/lib";
import { c } from "@/theme";

export const IV_ROW_H = 52;

export const IvQRow = memo(function IvQRow({
  track,
  idx,
  active,
  on_click,
}: {
  track: TTrack;
  idx: number;
  active: boolean;
  on_click: () => void;
}) {
  const [hov, set_hov] = useState(false);
  return (
    <button
      onClick={on_click}
      onMouseEnter={() => set_hov(true)}
      onMouseLeave={() => set_hov(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 8px",
        height: IV_ROW_H,
        borderRadius: 10,
        textAlign: "left",
        background: active
          ? c.w10
          : hov
            ? c.w06
            : "transparent",
        transition: "background 0.15s",
      }}
    >
      <span
        style={{
          width: 22,
          textAlign: "right",
          fontSize: 13,
          fontVariantNumeric: "tabular-nums",
          color: active ? c.white : c.w20,
          flexShrink: 0,
          fontWeight: active ? 700 : 400,
        }}
      >
        {idx + 1}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 15,
            fontWeight: active ? 700 : 500,
            color: active ? c.white : c.w70,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {track.title}
        </p>
        <p
          style={{
            fontSize: 12,
            color: c.w30,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {track.artist}
        </p>
      </div>
      <span
        style={{
          fontSize: 12,
          fontVariantNumeric: "tabular-nums",
          color: c.w20,
          flexShrink: 0,
        }}
      >
        {format_duration(track.duration)}
      </span>
    </button>
  );
});
