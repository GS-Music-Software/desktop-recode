import { useEffect, useRef, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { use_pl, use_settings } from "@/ctx";
import { use_cover, use_lyrics, use_ttml, use_amll_lines, get_time, get_latency } from "@/lib";
import { ChevronDown } from "lucide-react";
import { TTrack } from "@/types";

import { Backdrop } from "./backdrop";
import { Controls } from "./controls";
import { Lyrics } from "./lyrics";
import { Amll } from "./amll";
import { Queue } from "./queue";
import { IV_ROW_H } from "./queue_row";
import { c } from "@/theme";

type Tab = "lyrics" | "queue";

type Props = { open: boolean; on_close: () => void };

export function Immersive({ open, on_close }: Props) {
  const {
    current,
    playing,
    time,
    toggle,
    next,
    prev,
    seek,
    shuffle,
    repeat,
    toggle_shuffle,
    toggle_repeat,
    volume,
    set_volume,
    queue,
    queue_idx,
    play,
  } = use_pl();
  const { exp_volume, amll_lyrics, amll_word_sync } = use_settings();
  const cover = use_cover(current?.path ?? null);
  const lyrics = use_lyrics(
    current?.artist ?? "",
    current?.title ?? "",
    current?.album ?? "",
    current?.duration ?? 0,
  );
  const ttml = use_ttml(
    amll_lyrics && amll_word_sync ? (current?.artist ?? "") : "",
    amll_lyrics && amll_word_sync ? (current?.title ?? "") : "",
  );
  const dur = current?.duration ?? 0;

  const amll_lines = use_amll_lines(ttml, lyrics, dur);
  const pct = dur ? (time / dur) * 100 : 0;

  const [closing, set_closing] = useState(false);
  const [tab, set_tab] = useState<Tab>("lyrics");
  const prev_path = useRef<string | null>(null);
  const [art_key, set_art_key] = useState(0);
  const lyrics_ref = useRef<HTMLDivElement>(null);
  const active_ref = useRef<HTMLDivElement>(null);
  const scroll_raf = useRef<number>(0);
  const q_scroll_ref = useRef<HTMLDivElement>(null);
  const [seeking, set_seeking] = useState(false);

  const q_virt = useVirtualizer({
    count: queue.length,
    getScrollElement: () => q_scroll_ref.current,
    estimateSize: () => IV_ROW_H,
    overscan: 10,
    enabled: tab === "queue",
  });

  const on_q_play = useCallback((t: TTrack) => play(t, queue), [play, queue]);

  const do_seek = useCallback((t: number) => {
    set_seeking(true);
    seek(t);
    setTimeout(() => set_seeking(false), 100);
  }, [seek]);

  const [lyric_idx, set_lyric_idx] = useState(-1);
  const lyric_raf = useRef<number>(0);

  useEffect(() => {
    if (!open || !lyrics || tab !== "lyrics" || amll_lyrics) {
      set_lyric_idx(-1);
      return;
    }
    let prev = -1;
    function tick() {
      const t = get_time() - get_latency();
      const idx = lyrics!.reduce((best, line, i) => (line.time <= t ? i : best), -1);
      if (idx !== prev) { prev = idx; set_lyric_idx(idx); }
      lyric_raf.current = requestAnimationFrame(tick);
    }
    lyric_raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(lyric_raf.current);
  }, [open, lyrics, tab, amll_lyrics]);

  const active_idx = lyric_idx;

  useEffect(() => {
    if (current?.path !== prev_path.current) {
      prev_path.current = current?.path ?? null;
      set_art_key((k) => k + 1);
    }
  }, [current?.path]);

  useEffect(() => {
    const container = lyrics_ref.current;
    const active = active_ref.current;
    if (!container || !active) return;
    const target = Math.max(
      0,
      active.offsetTop - container.clientHeight / 2 + active.clientHeight / 2,
    );
    const start = container.scrollTop;
    const dist = target - start;
    if (Math.abs(dist) < 2) return;
    const duration = 520;
    let t0: number | null = null;
    cancelAnimationFrame(scroll_raf.current);
    function ease(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    function step(ts: number) {
      if (t0 === null) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      container!.scrollTop = start + dist * ease(p);
      if (p < 1) scroll_raf.current = requestAnimationFrame(step);
    }
    scroll_raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(scroll_raf.current);
  }, [active_idx]);

  function close() {
    set_closing(true);
    setTimeout(() => {
      set_closing(false);
      on_close();
    }, 380);
  }

  useEffect(() => {
    if (!open) return;
    function on_key(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", on_key);
    return () => window.removeEventListener("keydown", on_key);
  }, [open]);

  if (!open && !closing) return null;

  const anim = closing
    ? "iv-out 0.38s cubic-bezier(0.4,0,0.2,1) forwards"
    : "iv-in 0.42s cubic-bezier(0.4,0,0.2,1) forwards";

  if (amll_lyrics) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, overflow: "hidden", animation: anim }}>
        <Amll
          lines={amll_lines}
          time={time}
          dur={dur}
          pct={pct}
          playing={playing}
          seeking={seeking}
          cover={cover}
          cur={current}
          art_key={art_key}
          shuffle={shuffle}
          repeat={repeat}
          queue={queue}
          queue_idx={queue_idx}
          toggle={toggle}
          next={next}
          prev={prev}
          vol={volume}
          set_vol={set_volume}
          seek={do_seek}
          tog_shuffle={toggle_shuffle}
          tog_repeat={toggle_repeat}
          on_q_play={on_q_play}
          on_close={close}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        overflow: "hidden",
        animation: anim,
      }}
    >
      <Backdrop cover={cover} />

      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "0 48px 36px",
        }}
      >
        <div
          style={{
            height: 60,
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <button onClick={close} style={{ color: c.w40 }}>
            <ChevronDown size={24} />
          </button>
        </div>

        <div style={{ flex: 1, display: "flex", gap: 52, minHeight: 0 }}>
          <Controls
            cover={cover}
            art_key={art_key}
            cur={current}
            playing={playing}
            time={time}
            dur={dur}
            pct={pct}
            shuffle={shuffle}
            repeat={repeat}
            vol={volume}
            tab={tab}
            set_tab={set_tab}
            toggle={toggle}
            next={next}
            prev={prev}
            seek={do_seek}
            tog_shuffle={toggle_shuffle}
            tog_repeat={toggle_repeat}
            set_vol={set_volume}
            exp_volume={exp_volume}
          />

          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {tab === "lyrics" && (
              <Lyrics
                lyrics={lyrics}
                active_idx={active_idx}
                lyrics_ref={lyrics_ref}
                active_ref={active_ref}
                seek={do_seek}
              />
            )}

            {tab === "queue" && (
              <Queue
                q_virt={q_virt}
                queue={queue}
                q_idx={queue_idx}
                q_scroll_ref={q_scroll_ref}
                on_q_play={on_q_play}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
