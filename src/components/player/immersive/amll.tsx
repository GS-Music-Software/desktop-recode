import { useRef, useEffect, useCallback, useState, memo } from "react";
import { LyricPlayer, BackgroundRender } from "@applemusic-like-lyrics/react";
import type { LyricPlayerRef } from "@applemusic-like-lyrics/react";
import type { LyricLine } from "@applemusic-like-lyrics/core";
import "@applemusic-like-lyrics/core/style.css";
import { format_duration, get_time, use_output_device, device_icon } from "@/lib";
import { type RepeatMode } from "@/ctx";
import { Shuffle, Repeat, Repeat1, Music, ChevronDown, Volume1, Volume2, EllipsisVertical, MessageSquare, List } from "lucide-react";
import { c } from "@/theme";
import { SkipBackIcon, SkipFwdIcon, PlayIcon, PauseIcon } from "../icons";
import { TrackCtxMenu } from "@/components/shared/track_ctx_menu";
import { Art } from "@/components/shared/art";
import { Marquee } from "@/components/shared/marquee";
import type { TTrack } from "@/types";

type Tab = "lyrics" | "queue";

type Props = {
  lines: LyricLine[] | null | undefined;
  time: number;
  dur: number;
  pct: number;
  playing: boolean;
  seeking: boolean;
  cover: string | null;
  cur: TTrack | null;
  art_key: number;
  shuffle: boolean;
  repeat: RepeatMode;
  vol: number;
  queue: TTrack[];
  queue_idx: number;
  set_vol: (v: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  tog_shuffle: () => void;
  tog_repeat: () => void;
  on_q_play: (t: TTrack) => void;
  on_close: () => void;
};

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", system-ui, sans-serif';

const press = {
  onMouseDown: (e: React.MouseEvent) => (e.currentTarget as HTMLElement).style.transform = "scale(0.85)",
  onMouseUp: (e: React.MouseEvent) => (e.currentTarget as HTMLElement).style.transform = "scale(1)",
  onMouseLeave: (e: React.MouseEvent) => (e.currentTarget as HTMLElement).style.transform = "scale(1)",
};

const btn: React.CSSProperties = { padding: 6, transition: "transform 0.1s", display: "flex" };

const QueueRow = memo(function QueueRow({ track, active, last, on_click }: { track: TTrack; active: boolean; last: boolean; on_click: () => void }) {
  const [hov, set_hov] = useState(false);
  return (
    <button
      onClick={on_click}
      onMouseEnter={() => set_hov(true)}
      onMouseLeave={() => set_hov(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 14,
        padding: "8px 8px", borderRadius: 10, textAlign: "left",
        background: active ? "rgba(255,255,255,0.1)" : hov ? "rgba(255,255,255,0.06)" : "transparent",
        transition: "background 0.15s",
        borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Art path={track.path} w={50} h={50} radius={8} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 16, fontWeight: 600,
          color: active ? "#fff" : "rgba(255,255,255,0.8)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          lineHeight: 1.3,
        }}>
          {track.title}
        </p>
        <p style={{
          fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {track.artist}
        </p>
      </div>
    </button>
  );
});

export function Amll({
  lines, time, dur, pct, playing, seeking, cover, cur, art_key,
  shuffle, repeat, vol, queue, queue_idx, set_vol, toggle, next, prev, seek,
  tog_shuffle, tog_repeat, on_q_play, on_close,
}: Props) {
  const ref = useRef<LyricPlayerRef>(null);
  const raf = useRef(0);
  const prev_ts = useRef(0);
  const device = use_output_device();
  const DevIcon = device_icon(device.form_factor);
  const vol_pct = vol * 100;
  const [ctx_menu, set_ctx_menu] = useState<{ x: number; y: number } | null>(null);
  const [tab, set_tab] = useState<Tab>("lyrics");

  useEffect(() => {
    if (ref.current?.lyricPlayer && lines) {
      ref.current.lyricPlayer.calcLayout();
    }
  }, [lines]);

  useEffect(() => {
    function tick(now: number) {
      const lp = ref.current?.lyricPlayer;
      if (lp) {
        const delta = prev_ts.current ? now - prev_ts.current : 16;
        prev_ts.current = now;
        lp.setCurrentTime(Math.round(get_time() * 1000));
        lp.update(delta);
      }
      raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const on_bar_down = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const apply = (cx: number) => {
      const r = el.getBoundingClientRect();
      seek(Math.max(0, Math.min(1, (cx - r.left) / r.width)) * dur);
    };
    apply(e.clientX);
    const move = (ev: MouseEvent) => apply(ev.clientX);
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }, [seek, dur]);

  const on_vol_down = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const apply = (cx: number) => {
      const r = el.getBoundingClientRect();
      set_vol(Math.max(0, Math.min(1, (cx - r.left) / r.width)));
    };
    apply(e.clientX);
    const move = (ev: MouseEvent) => apply(ev.clientX);
    const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }, [set_vol]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#111", fontFamily: FONT }}>
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <BackgroundRender
          album={cover ?? undefined}
          playing={playing}
          hasLyric={!!lines && lines.length > 0}
          fps={30}
          flowSpeed={2}
          renderScale={0.4}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div style={{
        position: "relative", zIndex: 1, height: "100%",
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gridTemplateColumns: "0.38fr 0.62fr",
        padding: "0 48px 36px",
        isolation: "isolate",
      }}>
        <div style={{
          gridColumn: "1 / -1", gridRow: "1",
          height: 52, display: "flex", alignItems: "center", flexShrink: 0,
        }}>
          <button onClick={on_close} style={{ color: "rgba(255,255,255,0.4)" }}>
            <ChevronDown size={22} />
          </button>
        </div>

        <div style={{
          gridColumn: "1", gridRow: "2",
          display: "flex", flexDirection: "column", justifyContent: "center",
          gap: 20, paddingRight: 48, maxWidth: 380,
        }}>
          <div
            key={art_key}
            style={{
              width: "100%", aspectRatio: "1", borderRadius: 14,
              overflow: "hidden", flexShrink: 0,
              boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)",
              animation: "art-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}
          >
            {cover ? (
              <img src={cover} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Music size={64} color="rgba(255,255,255,0.1)" />
              </div>
            )}
          </div>

          <div key={`info-${cur?.path}`} style={{ animation: "fade-up 0.4s ease forwards", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Marquee style={{ fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 3 }}>
                {cur?.title ?? "\u2014"}
              </Marquee>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                {cur?.artist ?? ""}
              </p>
            </div>
            {cur && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  const r = e.currentTarget.getBoundingClientRect();
                  set_ctx_menu({ x: r.right + 4, y: r.top });
                }}
                style={{
                  flexShrink: 0, width: 30, height: 30, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              >
                <EllipsisVertical size={16} color="rgba(255,255,255,0.7)" />
              </button>
            )}
          </div>

          <div>
            <div
              onMouseDown={on_bar_down}
              style={{ position: "relative", height: 7, borderRadius: 99, background: "rgba(255,255,255,0.15)", cursor: "pointer", marginBottom: 8 }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${pct}%`, borderRadius: 99, background: "rgba(255,255,255,0.6)", transition: "width 0.25s linear" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{format_duration(time)}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>-{format_duration(Math.max(0, dur - time))}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 280, margin: "0 auto", width: "100%" }}>
            <button onClick={tog_shuffle} style={{ ...btn, padding: 6 }} {...press}>
              <Shuffle size={18} color={shuffle ? c.accent : "rgba(255,255,255,0.5)"} strokeWidth={2} />
            </button>
            <button onClick={prev} style={btn} {...press}>
              <SkipBackIcon size={28} color="#fff" />
            </button>
            <button onClick={toggle} style={{ ...btn, flexShrink: 0 }} {...press}>
              {playing ? <PauseIcon size={38} color="#fff" /> : <PlayIcon size={38} color="#fff" />}
            </button>
            <button onClick={next} style={btn} {...press}>
              <SkipFwdIcon size={28} color="#fff" />
            </button>
            <button onClick={tog_repeat} style={{ ...btn, padding: 6 }} {...press}>
              {repeat === "one"
                ? <Repeat1 size={18} color={c.accent} strokeWidth={2} />
                : <Repeat size={18} color={repeat === "all" ? c.accent : "rgba(255,255,255,0.5)"} strokeWidth={2} />
              }
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
            <Volume1 size={16} color="rgba(255,255,255,0.4)" />
            <div
              onMouseDown={on_vol_down}
              style={{ flex: 1, position: "relative", height: 7, borderRadius: 99, background: "rgba(255,255,255,0.15)", cursor: "pointer" }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${vol_pct}%`, borderRadius: 99, background: "rgba(255,255,255,0.6)", transition: "width 0.1s ease" }} />
            </div>
            <Volume2 size={16} color="rgba(255,255,255,0.4)" />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 }}>
            <DevIcon size={12} color="rgba(255,255,255,0.3)" />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>{device.name}</span>
          </div>
        </div>

        <div style={{
          gridColumn: "2", gridRow: "2",
          position: "relative",
          contain: "paint",
          ...(tab === "lyrics" ? {
            maskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
          } : {}),
        }}>
          {tab === "lyrics" && (
            <>
              {lines === undefined && (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 14 }}>Loading lyrics…</p>
                </div>
              )}
              {lines === null && (
                <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 14 }}>No lyrics available</p>
                </div>
              )}
              {lines && lines.length > 0 && (
                <LyricPlayer
                  ref={ref}
                  disabled
                  lyricLines={lines}
                  currentTime={0}
                  playing={playing}
                  isSeeking={seeking}
                  alignAnchor="center"
                  alignPosition={0.5}
                  enableBlur
                  enableScale
                  wordFadeWidth={0.5}
                  style={{
                    position: "absolute",
                    inset: 0,
                    mixBlendMode: "plus-lighter",
                  }}
                />
              )}
            </>
          )}
          {tab === "queue" && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column",
              overflow: "hidden",
            }}>
              <div style={{ padding: "20px 16px 12px", flexShrink: 0 }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                  Playing Next
                </p>
              </div>
              <div style={{
                flex: 1, overflowY: "auto", overflowX: "hidden",
                padding: "0 8px 60px",
              }} className="iv-lyrics-scroll">
                {queue.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 14, marginTop: 40, textAlign: "center" }}>
                    Nothing in queue
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {queue.map((t, i) => (
                      <QueueRow
                        key={`${t.path}-${i}`}
                        track={t}
                        active={i === queue_idx}
                        last={i === queue.length - 1}
                        on_click={() => on_q_play(t)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ position: "absolute", bottom: 36, right: 48, display: "flex", gap: 10, zIndex: 2 }}>
          {([
            { icon: MessageSquare, id: "lyrics" as Tab },
            { icon: List, id: "queue" as Tab },
          ]).map(({ icon: Icon, id }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => set_tab(active && id === "queue" ? "lyrics" : id)}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(20px)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = active ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)")}
                onMouseLeave={e => (e.currentTarget.style.background = active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)")}
              >
                <Icon size={18} color={active ? "#fff" : "rgba(255,255,255,0.6)"} strokeWidth={2} />
              </button>
            );
          })}
        </div>
      </div>

      {ctx_menu && cur && (
        <TrackCtxMenu x={ctx_menu.x} y={ctx_menu.y} track={cur} on_close={() => set_ctx_menu(null)} />
      )}
    </div>
  );
}
