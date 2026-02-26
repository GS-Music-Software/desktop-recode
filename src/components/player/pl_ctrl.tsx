import { use_pl } from "@/ctx";
import { format_duration } from "@/lib";
import { Shuffle, Repeat, Repeat1 } from "lucide-react";
import { c } from "@/theme";
import { SkipBackIcon, SkipFwdIcon, PlayIcon, PauseIcon } from "./icons";

export function PlCtrl() {
  const { current, current_station, playing, time, toggle, next, prev, seek, shuffle, repeat, toggle_shuffle, toggle_repeat } = use_pl();
  const is_live = !!current_station;
  const dur = current?.duration ?? 0;
  const pct = dur ? (time / dur) * 100 : 0;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, maxWidth: 600, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {!is_live && (
          <button onClick={toggle_shuffle} style={{ opacity: 0.8 }}>
            <Shuffle size={15} color={shuffle ? c.accent : c.w45} />
          </button>
        )}
        {!is_live && (
          <button onClick={prev} style={{ display: "flex" }}>
            <SkipBackIcon size={20} color={c.w60} />
          </button>
        )}
        <button
          onClick={toggle}
          style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: c.white, flexShrink: 0 }}
        >
          {playing ? <PauseIcon size={16} color={c.black} /> : <PlayIcon size={16} color={c.black} />}
        </button>
        {!is_live && (
          <button onClick={next} style={{ display: "flex" }}>
            <SkipFwdIcon size={20} color={c.w60} />
          </button>
        )}
        {!is_live && (
          <button onClick={toggle_repeat} style={{ opacity: 0.8 }}>
            {repeat === "one"
              ? <Repeat1 size={15} color={c.accent} />
              : <Repeat size={15} color={repeat === "all" ? c.accent : c.w45} />
            }
          </button>
        )}
      </div>

      {!is_live && (
        <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, width: 40, textAlign: "right", fontVariantNumeric: "tabular-nums", color: c.w40, flexShrink: 0 }}>{format_duration(time)}</span>
          <input
            type="range"
            min={0}
            max={dur || 1}
            step={0.1}
            value={time}
            onChange={(e) => seek(Number(e.target.value))}
            style={{ flex: 1, background: `linear-gradient(to right, ${c.white} ${pct}%, ${c.card_alt_hover} ${pct}%)`, borderRadius: 2 }}
          />
          <span style={{ fontSize: 11, width: 40, fontVariantNumeric: "tabular-nums", color: c.w40, flexShrink: 0 }}>{format_duration(dur)}</span>
        </div>
      )}
    </div>
  );
}
