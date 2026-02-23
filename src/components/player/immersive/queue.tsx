import type { RefObject } from "react";
import type { Virtualizer } from "@tanstack/virtual-core";
import { IvQRow, IV_ROW_H } from "./queue_row";
import { TTrack } from "@/types";
import { c } from "@/theme";

type Props = {
  q_virt: Virtualizer<HTMLDivElement, Element>;
  queue: TTrack[];
  q_idx: number;
  q_scroll_ref: RefObject<HTMLDivElement | null>;
  on_q_play: (t: TTrack) => void;
};

export function Queue({ q_virt, queue, q_idx, q_scroll_ref, on_q_play }: Props) {
  return (
    <div style={{ flex: 1, position: "relative" }}>
      <div
        ref={q_scroll_ref}
        className="iv-lyrics-scroll"
        style={{
          position: "absolute",
          inset: 0,
          padding: "12px 0 40px",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
        }}
      >
        {queue.length === 0 ? (
          <p
            style={{
              color: c.w15,
              fontSize: 14,
              marginTop: 40,
            }}
          >
            Nothing in queue
          </p>
        ) : (
          <div
            style={{
              position: "relative",
              height: q_virt.getTotalSize(),
            }}
          >
            {q_virt.getVirtualItems().map((vi) => {
              const t = queue[vi.index];
              return (
                <div
                  key={`${t.path}-${vi.index}`}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: IV_ROW_H,
                    transform: `translateY(${vi.start}px)`,
                  }}
                >
                  <IvQRow
                    track={t}
                    idx={vi.index}
                    active={vi.index === q_idx}
                    on_click={() => on_q_play(t)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
