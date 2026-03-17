import { useEffect, useRef, useState, useCallback } from "react";
import { use_pl } from "@/ctx";
import { use_cover, use_lyrics, use_ttml, use_amll_lines } from "@/lib";
import { TTrack } from "@/types";
import { Amll } from "./amll";

type Props = { open: boolean; on_close: () => void };

export function Immersive({ open, on_close }: Props) {
  const {
    current, playing, time, toggle, next, prev, seek,
    shuffle, repeat, toggle_shuffle, toggle_repeat,
    volume, set_volume, queue, queue_idx, play,
  } = use_pl();
  const cover = use_cover(current?.path ?? null);
  const lyrics = use_lyrics(
    current?.artist ?? "",
    current?.title ?? "",
    current?.album ?? "",
    current?.duration ?? 0,
  );
  const ttml = use_ttml(current?.artist ?? "", current?.title ?? "");
  const dur = current?.duration ?? 0;
  const amll_lines = use_amll_lines(ttml, lyrics, dur);
  const pct = dur ? (time / dur) * 100 : 0;

  const [closing, set_closing] = useState(false);
  const prev_path = useRef<string | null>(null);
  const [art_key, set_art_key] = useState(0);
  const [seeking, set_seeking] = useState(false);

  const on_q_play = useCallback((t: TTrack) => play(t, queue), [play, queue]);

  const do_seek = useCallback((t: number) => {
    set_seeking(true);
    seek(t);
    setTimeout(() => set_seeking(false), 100);
  }, [seek]);

  useEffect(() => {
    if (current?.path !== prev_path.current) {
      prev_path.current = current?.path ?? null;
      set_art_key((k) => k + 1);
    }
  }, [current?.path]);

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
      if (e.key === "F11") {
        e.preventDefault();
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      }
    }
    window.addEventListener("keydown", on_key);
    return () => {
      window.removeEventListener("keydown", on_key);
      if (document.fullscreenElement) document.exitFullscreen();
    };
  }, [open]);

  if (!open && !closing) return null;

  const anim = closing
    ? "iv-out 0.38s cubic-bezier(0.4,0,0.2,1) forwards"
    : "iv-in 0.42s cubic-bezier(0.4,0,0.2,1) forwards";

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
