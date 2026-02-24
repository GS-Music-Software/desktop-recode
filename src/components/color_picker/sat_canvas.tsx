import { useRef, useCallback, useEffect } from "react";
import { hsv_to_hex, clamp } from "./helpers";

type Props = {
  hue: number;
  sat: number;
  val: number;
  on_change: (s: number, v: number) => void;
};

const SIZE = 220;

export function SatCanvas({ hue, sat, val, on_change }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);

  const draw = useCallback(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);

    const hue_color = hsv_to_hex(hue, 100, 100);
    ctx.fillStyle = hue_color;
    ctx.fillRect(0, 0, SIZE, SIZE);

    const white_grad = ctx.createLinearGradient(0, 0, SIZE, 0);
    white_grad.addColorStop(0, "rgba(255,255,255,1)");
    white_grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = white_grad;
    ctx.fillRect(0, 0, SIZE, SIZE);

    const black_grad = ctx.createLinearGradient(0, 0, 0, SIZE);
    black_grad.addColorStop(0, "rgba(0,0,0,0)");
    black_grad.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = black_grad;
    ctx.fillRect(0, 0, SIZE, SIZE);
  }, [hue]);

  useEffect(() => { draw(); }, [draw]);

  const update = useCallback((e: MouseEvent | React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp(e.clientX - rect.left, 0, SIZE);
    const y = clamp(e.clientY - rect.top, 0, SIZE);
    on_change((x / SIZE) * 100, (1 - y / SIZE) * 100);
  }, [on_change]);

  const on_down = useCallback((e: React.MouseEvent) => {
    dragging.current = true;
    update(e);
  }, [update]);

  useEffect(() => {
    const on_move = (e: MouseEvent) => { if (dragging.current) update(e); };
    const on_up = () => { dragging.current = false; };
    window.addEventListener("mousemove", on_move);
    window.addEventListener("mouseup", on_up);
    return () => {
      window.removeEventListener("mousemove", on_move);
      window.removeEventListener("mouseup", on_up);
    };
  }, [update]);

  const cx = (sat / 100) * SIZE;
  const cy = (1 - val / 100) * SIZE;

  return (
    <div style={{ position: "relative", width: SIZE, height: SIZE, borderRadius: 12, overflow: "hidden", cursor: "crosshair" }}>
      <canvas ref={ref} width={SIZE} height={SIZE} onMouseDown={on_down} style={{ display: "block", width: SIZE, height: SIZE }} />
      <div style={{
        position: "absolute",
        left: cx - 8,
        top: cy - 8,
        width: 16,
        height: 16,
        borderRadius: "50%",
        border: "2.5px solid #fff",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.4)",
        pointerEvents: "none",
      }} />
    </div>
  );
}
