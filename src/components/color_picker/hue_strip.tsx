import { useRef, useCallback, useEffect } from "react";
import { clamp } from "./helpers";

type Props = {
  hue: number;
  on_change: (h: number) => void;
};

const WIDTH = 220;
const HEIGHT = 14;

export function HueStrip({ hue, on_change }: Props) {
  const dragging = useRef(false);

  const on_down = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, WIDTH);
    on_change(Math.round((x / WIDTH) * 360));
  }, [on_change]);

  useEffect(() => {
    const on_move = (e: MouseEvent) => {
      if (!dragging.current) return;
      const el = document.querySelector("[data-hue-strip]");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clamp(e.clientX - rect.left, 0, WIDTH);
      on_change(Math.round((x / WIDTH) * 360));
    };
    const on_up = () => { dragging.current = false; };
    window.addEventListener("mousemove", on_move);
    window.addEventListener("mouseup", on_up);
    return () => {
      window.removeEventListener("mousemove", on_move);
      window.removeEventListener("mouseup", on_up);
    };
  }, [on_change]);

  const pos = (hue / 360) * WIDTH;

  return (
    <div
      data-hue-strip
      onMouseDown={on_down}
      style={{
        position: "relative",
        width: WIDTH,
        height: HEIGHT,
        borderRadius: HEIGHT / 2,
        background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
        cursor: "pointer",
      }}
    >
      <div style={{
        position: "absolute",
        left: pos - 7,
        top: -1,
        width: 14,
        height: 16,
        borderRadius: 7,
        border: "2.5px solid #fff",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.35)",
        pointerEvents: "none",
        background: "transparent",
      }} />
    </div>
  );
}
