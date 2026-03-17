import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { use_settings } from "@/ctx";

export type LyricLine = { time: number; text: string };

type CacheEntry = LyricLine[] | null;
const cache = new Map<string, CacheEntry>();

export function use_lyrics(artist: string, title: string, album: string, dur: number): LyricLine[] | null | undefined {
  const { lyrics_source } = use_settings();
  const key = `${artist}::${title}::${lyrics_source}`;
  const [lines, set_lines] = useState<LyricLine[] | null | undefined>(() => cache.has(key) ? cache.get(key) : undefined);

  useEffect(() => {
    let stale = false;
    if (!artist || !title) { set_lines(null); return; }
    if (cache.has(key)) { set_lines(cache.get(key) ?? null); return; }
    set_lines(undefined);
    invoke<LyricLine[] | null>("fetch_lyrics", { artist, title, album, duration: dur, source: lyrics_source })
      .then(res => {
        if (stale) return;
        cache.set(key, res);
        set_lines(res);
      })
      .catch(() => {
        if (stale) return;
        cache.set(key, null);
        set_lines(null);
      });
    return () => { stale = true; };
  }, [key]);

  return lines;
}
