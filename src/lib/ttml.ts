import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { parseTTML } from "@applemusic-like-lyrics/lyric";
import type { LyricLine, LyricWord } from "@applemusic-like-lyrics/core";

type RichSyncResult = { source: string; data: string };

type RichSyncLine = {
  ts: number;
  te: number;
  x: string;
  l: { c: string; o: number }[];
};

const CREDIT_RE = /^[\s\p{P}]*(作[词曲编]|编曲|制作[人]?|混音|母带|录音|配唱|和声|吉他手?|鼓手?|贝[斯司]手?|键盘手?|主唱|演唱|词[：:]|曲[：:]|Prod|Producer|Songwriter|Composer|Guitar|Drum|Bass|Vocal|Mix|Master|Recording|Arrange)[\s\p{P}]/iu;

function is_credit(text: string): boolean {
  return CREDIT_RE.test(text);
}

function fix_ttml(src: ReturnType<typeof parseTTML>["lines"]): LyricLine[] {
  return src
    .filter(l => {
      const text = l.words.map(w => w.word).join("");
      return text.trim().length > 0 && !is_credit(text);
    })
    .map(l => ({
      ...l,
      words: l.words.map(w => ({ ...w, obscene: false }) as LyricWord),
    })) as LyricLine[];
}

function parse_richsync(raw: string): LyricLine[] {
  const data: RichSyncLine[] = JSON.parse(raw);
  return data.map((line) => {
    const start = line.ts * 1000;
    const end = line.te * 1000;
    const words: LyricWord[] = line.l.map((w, i) => {
      const ws = start + w.o * 1000;
      const next = line.l[i + 1];
      const we = next ? start + next.o * 1000 : end;
      return { startTime: ws, endTime: we, word: w.c, romanWord: "", obscene: false };
    });
    return {
      words,
      translatedLyric: "",
      romanLyric: "",
      startTime: start,
      endTime: end,
      isBG: false,
      isDuet: false,
    } as LyricLine;
  });
}

type Entry = LyricLine[] | null;
const cache = new Map<string, Entry>();

export function use_ttml(artist: string, title: string): LyricLine[] | null | undefined {
  const key = `${artist}::${title}`;
  const [lines, set] = useState<LyricLine[] | null | undefined>(() =>
    cache.has(key) ? cache.get(key) : undefined
  );
  const prev = useRef(key);

  useEffect(() => {
    if (key !== prev.current) {
      prev.current = key;
      set(cache.has(key) ? cache.get(key) : undefined);
    }
    let stale = false;
    if (!artist || !title) { set(null); return; }
    if (cache.has(key)) { set(cache.get(key) ?? null); return; }
    set(undefined);
    invoke<RichSyncResult | null>("fetch_ttml", { artist, title })
      .then(res => {
        if (stale) return;
        if (!res) { cache.set(key, null); set(null); return; }
        try {
          let result: LyricLine[];
          if (res.source === "richsync") {
            result = parse_richsync(res.data);
          } else {
            result = fix_ttml(parseTTML(res.data).lines);
          }
          if (result.length === 0) { cache.set(key, null); set(null); return; }
          cache.set(key, result);
          set(result);
        } catch {
          cache.set(key, null);
          set(null);
        }
      })
      .catch(() => {
        if (stale) return;
        cache.set(key, null);
        set(null);
      });
    return () => { stale = true; };
  }, [key]);

  return lines;
}
