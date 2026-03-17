import { useMemo } from "react";
import type { LyricLine as AmllLine } from "@applemusic-like-lyrics/core";
import type { LyricLine } from "./lyrics";

export function use_amll_lines(
  ttml: AmllLine[] | null | undefined,
  lyrics: LyricLine[] | null | undefined,
  dur: number,
): AmllLine[] | null | undefined {
  return useMemo(() => {
    if (ttml === undefined || lyrics === undefined) return undefined;
    if (ttml && ttml.length > 0) {
      return ttml.map(l => ({
        ...l,
        words: [{ startTime: l.startTime, endTime: l.endTime, word: l.words.map(w => w.word).join(""), romanWord: "", obscene: false }],
      })) as AmllLine[];
    }
    if (!lyrics || lyrics.length === 0) return null;
    return lyrics.map((l, i) => {
      const start = l.time * 1000;
      const end = i < lyrics.length - 1 ? lyrics[i + 1].time * 1000 : dur * 1000;
      return {
        words: [{ startTime: start, endTime: end, word: l.text, romanWord: "", obscene: false }],
        translatedLyric: "",
        romanLyric: "",
        startTime: start,
        endTime: end,
        isBG: false,
        isDuet: false,
      } as AmllLine;
    });
  }, [ttml, lyrics, dur]);
}
