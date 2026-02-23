import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { TTrack, TRadioStation } from "@/types";
import { play_src, play_resume, play_pause, play_seek, set_vol as audio_set_vol, set_cbs } from "@/lib";

export type RepeatMode = "off" | "all" | "one";

type PlState = {
  current: TTrack | null;
  current_station: TRadioStation | null;
  queue: TTrack[];
  queue_idx: number;
  playing: boolean;
  time: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  play: (track: TTrack, queue?: TTrack[]) => void;
  play_station: (station: TRadioStation) => void;
  toggle: () => void;
  seek: (t: number) => void;
  next: () => void;
  prev: () => void;
  set_volume: (v: number) => void;
  toggle_shuffle: () => void;
  toggle_repeat: () => void;
};

const Ctx = createContext<PlState | null>(null);

function shuf_arr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PlProv({ children }: { children: ReactNode }) {
  const [current, set_current] = useState<TTrack | null>(null);
  const [current_station, set_station] = useState<TRadioStation | null>(null);
  const [queue, set_queue] = useState<TTrack[]>([]);
  const [queue_idx, set_queue_idx] = useState(0);
  const [playing, set_playing] = useState(false);
  const [time, set_time] = useState(0);
  const [volume, _set_volume] = useState(() => {
    const s = localStorage.getItem("volume");
    return s ? Math.max(0, Math.min(1, parseFloat(s) || 1)) : 1;
  });
  const [shuffle, set_shuffle] = useState(false);
  const [repeat, set_repeat] = useState<RepeatMode>("off");

  const go = useCallback((track: TTrack) => {
    set_current(track);
    set_time(0);
    play_src(track.path).then(() => set_playing(true)).catch(console.error);
  }, []);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    if (repeat === "one") {
      play_seek(0);
      set_time(0);
      play_resume();
      return;
    }
    let ni = queue_idx + 1;
    if (ni >= queue.length) {
      if (repeat === "all") ni = 0;
      else return;
    }
    set_queue_idx(ni);
    go(queue[ni]);
  }, [queue, queue_idx, repeat, go]);

  const prev = useCallback(() => {
    if (queue.length === 0) return;
    if (time > 3) {
      play_seek(0);
      set_time(0);
      return;
    }
    let ni = queue_idx - 1;
    if (ni < 0) ni = repeat === "all" ? queue.length - 1 : 0;
    set_queue_idx(ni);
    go(queue[ni]);
  }, [queue, queue_idx, time, repeat, go]);

  useEffect(() => {
    set_cbs({
      on_time: (t) => set_time(t),
      on_end: () => next(),
      on_play: () => set_playing(true),
      on_pause: () => set_playing(false),
    });
  }, [next]);

  useEffect(() => {
    audio_set_vol(volume);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = useCallback((track: TTrack, q?: TTrack[]) => {
    set_station(null);
    if (q) {
      const ordered = shuffle ? shuf_arr(q) : q;
      set_queue(ordered);
      const idx = ordered.findIndex((t) => t.path === track.path);
      set_queue_idx(idx >= 0 ? idx : 0);
    }
    go(track);
  }, [shuffle, go]);

  const play_station = useCallback((station: TRadioStation) => {
    set_current(null);
    set_station(station);
    set_queue([]);
    set_time(0);
    play_src(station.url).then(() => set_playing(true)).catch(console.error);
  }, []);

  const toggle = useCallback(() => {
    if (playing) play_pause();
    else play_resume();
  }, [playing]);

  const seek = useCallback((t: number) => {
    play_seek(t);
    set_time(t);
  }, []);

  const set_v = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    localStorage.setItem("volume", String(clamped));
    audio_set_vol(clamped);
    _set_volume(clamped);
  }, []);

  const toggle_shuffle = useCallback(() => set_shuffle((s) => !s), []);
  const toggle_repeat = useCallback(() => set_repeat((r) => r === "off" ? "all" : r === "all" ? "one" : "off"), []);

  return (
    <Ctx.Provider
      value={{
        current, current_station, queue, queue_idx, playing, time, volume, shuffle, repeat,
        play, play_station, toggle, seek, next, prev, set_volume: set_v,
        toggle_shuffle, toggle_repeat,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function use_pl(): PlState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("use_pl outside provider");
  return ctx;
}
