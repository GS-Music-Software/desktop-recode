import { useRef } from "react";
import { format_duration } from "@/lib";
import { type RepeatMode } from "@/ctx";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  MicVocal,
  ListMusic,
  Music,
} from "lucide-react";
import { c } from "@/theme";
import { Marquee } from "@/components/shared/marquee";

type Tab = "lyrics" | "queue";

type Props = {
  cover: string | null;
  art_key: number;
  cur: { title?: string; artist?: string; path?: string } | null;
  playing: boolean;
  time: number;
  dur: number;
  pct: number;
  shuffle: boolean;
  repeat: RepeatMode;
  vol: number;
  tab: Tab;
  set_tab: (t: Tab) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  tog_shuffle: () => void;
  tog_repeat: () => void;
  set_vol: (v: number) => void;
  exp_volume: boolean;
};

function IvVolSection({ vol, set_vol, exp }: { vol: number; set_vol: (v: number) => void; exp: boolean }) {
  const svg_ref = useRef<SVGSVGElement>(null);
  const W = 280, H = 14;

  function from_x(clientX: number) {
    const r = svg_ref.current!.getBoundingClientRect();
    set_vol(Math.max(0, Math.min(1, (clientX - r.left) / r.width)));
  }

  function on_svg_down(e: React.MouseEvent) {
    e.preventDefault();
    from_x(e.clientX);
    function on_move(ev: MouseEvent) { from_x(ev.clientX); }
    function on_up() { window.removeEventListener("mousemove", on_move); window.removeEventListener("mouseup", on_up); }
    window.addEventListener("mousemove", on_move);
    window.addEventListener("mouseup", on_up);
  }

  const mid = H / 2;
  const shape = `M0,${mid - 0.5} L${W},0 L${W},${H} L0,${mid + 0.5} Z`;

  return (
    <div
      onWheel={(e) => { e.preventDefault(); set_vol(vol + (e.deltaY < 0 ? 0.05 : -0.05)); }}
      style={{ display: "flex", alignItems: "center", gap: 10 }}
    >
      <button onClick={() => set_vol(vol > 0 ? 0 : 1)} style={{ color: c.w28, flexShrink: 0 }}>
        {vol > 0 ? <Volume2 size={14} /> : <VolumeX size={14} />}
      </button>
      {exp ? (
        <svg ref={svg_ref} width={W} height={H} style={{ cursor: "pointer", display: "block", flex: 1 }} onMouseDown={on_svg_down}>
          <defs><clipPath id="iv-vol-clip"><rect x={0} y={0} width={vol * W} height={H} /></clipPath></defs>
          <path d={shape} fill={c.w10} />
          <path d={shape} fill={c.w50} clipPath="url(#iv-vol-clip)" />
        </svg>
      ) : (
        <div
          style={{ flex: 1, height: 3, borderRadius: 2, background: c.w10, cursor: "pointer", position: "relative" }}
          onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); set_vol(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${vol * 100}%`, borderRadius: 2, background: c.w50 }} />
        </div>
      )}
    </div>
  );
}

export function Controls({
  cover,
  art_key,
  cur,
  playing,
  time,
  dur,
  pct,
  shuffle,
  repeat,
  vol,
  tab,
  set_tab,
  toggle,
  next,
  prev,
  seek,
  tog_shuffle,
  tog_repeat,
  set_vol,
  exp_volume,
}: Props) {
  return (
    <div
      style={{
        width: "clamp(280px, 28vw, 45vh)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 22,
      }}
    >
      <div
        key={art_key}
        style={{
          width: "100%",
          aspectRatio: "1",
          borderRadius: 18,
          overflow: "hidden",
          flexShrink: 0,
          boxShadow:
            `0 24px 72px ${c.b85}, 0 0 0 1px ${c.w07}`,
          animation:
            "art-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}
      >
        {cover ? (
          <img
            src={cover}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: c.surface_input,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Music size={72} color={c.w12} />
          </div>
        )}
      </div>

      <div
        key={`info-${cur?.path}`}
        style={{ animation: "fade-up 0.4s ease forwards" }}
      >
        <Marquee style={{ fontSize: 24, fontWeight: 700, color: c.white, lineHeight: 1.25, marginBottom: 4 }}>
          {cur?.title ?? "\u2014"}
        </Marquee>
        <p
          style={{
            fontSize: 14,
            color: c.w42,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {cur?.artist ?? ""}
        </p>
      </div>

      <div>
        <div
          style={{
            position: "relative",
            height: 3,
            borderRadius: 2,
            background: c.w12,
            cursor: "pointer",
            marginBottom: 7,
          }}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - r.left) / r.width) * dur);
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: `${pct}%`,
              borderRadius: 2,
              background: c.w80,
              transition: "width 0.25s linear",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: `${pct}%`,
              transform: "translate(-50%,-50%)",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: c.white,
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span
            style={{
              fontSize: 11,
              color: c.w28,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {format_duration(time)}
          </span>
          <span
            style={{
              fontSize: 11,
              color: c.w28,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {format_duration(dur)}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button onClick={tog_shuffle}>
          <Shuffle
            size={18}
            color={shuffle ? c.accent : c.w30}
          />
        </button>
        <button onClick={prev}>
          <SkipBack
            size={28}
            fill={c.w70}
            strokeWidth={0}
          />
        </button>
        <button
          onClick={toggle}
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: c.white,
            boxShadow: `0 6px 28px ${c.b50}`,
            transition: "transform 0.1s",
            flexShrink: 0,
          }}
          onMouseDown={(e) =>
            (e.currentTarget.style.transform = "scale(0.91)")
          }
          onMouseUp={(e) =>
            (e.currentTarget.style.transform = "scale(1)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = "scale(1)")
          }
        >
          {playing ? (
            <Pause size={24} fill={c.black} strokeWidth={0} />
          ) : (
            <Play
              size={24}
              fill={c.black}
              strokeWidth={0}
              style={{ marginLeft: 2 }}
            />
          )}
        </button>
        <button onClick={next}>
          <SkipForward
            size={28}
            fill={c.w70}
            strokeWidth={0}
          />
        </button>
        <button onClick={tog_repeat}>
          {repeat === "one"
            ? <Repeat1 size={18} color={c.accent} />
            : <Repeat size={18} color={repeat === "all" ? c.accent : c.w30} />
          }
        </button>
      </div>

      <IvVolSection vol={vol} set_vol={set_vol} exp={exp_volume} />

      <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
        {(
          [
            ["lyrics", MicVocal, "Lyrics"],
            ["queue", ListMusic, "Queue"],
          ] as const
        ).map(([id, Icon, label]) => (
          <button
            key={id}
            onClick={() => set_tab(id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              color: tab === id ? c.white : c.w35,
              background:
                tab === id ? c.w12 : "transparent",
              transition: "all 0.15s",
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
