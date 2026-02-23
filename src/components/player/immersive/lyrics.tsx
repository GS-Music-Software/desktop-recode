import type { RefObject } from "react";
import type { LyricLine } from "@/lib/lyrics";
import { c } from "@/theme";

type Props = {
  lyrics: LyricLine[] | null | undefined;
  active_idx: number;
  lyrics_ref: RefObject<HTMLDivElement | null>;
  active_ref: RefObject<HTMLDivElement | null>;
  seek: (t: number) => void;
};

export function Lyrics({ lyrics, active_idx, lyrics_ref, active_ref, seek }: Props) {
  return (
    <div style={{ flex: 1, position: "relative" }}>
      <div
        ref={lyrics_ref}
        className="iv-lyrics-scroll"
        style={{
          position: "absolute",
          inset: 0,
          padding: "60px 0 80px",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 15%, black 80%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 15%, black 80%, transparent 100%)",
        }}
      >
        {lyrics === undefined && (
          <p
            style={{
              color: c.w18,
              fontSize: 14,
              marginTop: 40,
            }}
          >
            Loading lyrics…
          </p>
        )}
        {lyrics === null && (
          <p
            style={{
              color: c.w15,
              fontSize: 14,
              marginTop: 40,
            }}
          >
            We Couldn't Find Lyrics For This Song.
          </p>
        )}
        {lyrics &&
          lyrics.map((line, i) => {
            const is_active = i === active_idx;
            const dist = Math.abs(i - active_idx);
            const cls = [
              "iv-lyric",
              is_active
                ? "iv-lyric-active"
                : dist === 1
                  ? "iv-lyric-d1"
                  : dist === 2
                    ? "iv-lyric-d2"
                    : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div
                key={i}
                ref={is_active ? active_ref : undefined}
                onClick={() => seek(line.time)}
                className={cls}
              >
                {line.text}
              </div>
            );
          })}
        <div style={{ height: "40vh" }} />
      </div>
    </div>
  );
}
