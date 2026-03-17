import { useState, useRef, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Modal } from "@/components/modal";
import { c } from "@/theme";

type Props = {
  src: string;
  on_apply: (data_url: string) => void;
  on_cancel: () => void;
};

const SIZE = 240;
const OUTPUT = 256;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

export function AvatarCrop({ src, on_apply, on_cancel }: Props) {
  const [zoom, set_zoom] = useState(1);
  const [offset, set_offset] = useState({ x: 0, y: 0 });
  const [img_size, set_img_size] = useState({ w: 0, h: 0 });
  const dragging = useRef(false);
  const last_pos = useRef({ x: 0, y: 0 });
  const img_ref = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      set_img_size({ w: img.naturalWidth, h: img.naturalHeight });
      set_offset({ x: 0, y: 0 });
      set_zoom(1);
    };
    img.src = src;
    img_ref.current = img;
  }, [src]);

  const get_scaled = useCallback(() => {
    if (!img_size.w || !img_size.h) return { w: SIZE, h: SIZE };
    const aspect = img_size.w / img_size.h;
    if (aspect > 1) return { w: SIZE * aspect * zoom, h: SIZE * zoom };
    return { w: SIZE * zoom, h: (SIZE / aspect) * zoom };
  }, [img_size, zoom]);

  const clamp_offset = useCallback((ox: number, oy: number) => {
    const scaled = get_scaled();
    const max_x = Math.max(0, (scaled.w - SIZE) / 2);
    const max_y = Math.max(0, (scaled.h - SIZE) / 2);
    return {
      x: Math.min(max_x, Math.max(-max_x, ox)),
      y: Math.min(max_y, Math.max(-max_y, oy)),
    };
  }, [get_scaled]);

  const on_mouse_down = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    last_pos.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const on_move = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - last_pos.current.x;
      const dy = e.clientY - last_pos.current.y;
      last_pos.current = { x: e.clientX, y: e.clientY };
      set_offset(prev => clamp_offset(prev.x + dx, prev.y + dy));
    };
    const on_up = () => { dragging.current = false; };
    window.addEventListener("mousemove", on_move);
    window.addEventListener("mouseup", on_up);
    return () => {
      window.removeEventListener("mousemove", on_move);
      window.removeEventListener("mouseup", on_up);
    };
  }, [clamp_offset]);

  useEffect(() => {
    set_offset(prev => clamp_offset(prev.x, prev.y));
  }, [zoom, clamp_offset]);

  const on_wheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    set_zoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta)));
  };

  const nudge_zoom = (dir: number) => {
    set_zoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + dir * 0.2)));
  };

  const scaled = get_scaled();

  return (
    <Modal on_close={on_cancel} z={10001} panel_style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {(close) => {
        const render_crop = () => {
          const canvas = document.createElement("canvas");
          canvas.width = OUTPUT;
          canvas.height = OUTPUT;
          const ctx = canvas.getContext("2d");
          if (!ctx || !img_ref.current) return;

          const s = get_scaled();
          const draw_x = (SIZE / 2 + offset.x - s.w / 2) * (OUTPUT / SIZE);
          const draw_y = (SIZE / 2 + offset.y - s.h / 2) * (OUTPUT / SIZE);
          const draw_w = s.w * (OUTPUT / SIZE);
          const draw_h = s.h * (OUTPUT / SIZE);

          ctx.beginPath();
          ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img_ref.current, draw_x, draw_y, draw_w, draw_h);

          on_apply(canvas.toDataURL("image/png"));
        };

        return (
          <>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 20, alignSelf: "flex-start" }}>
              Adjust Photo
            </h2>

            <div
              onMouseDown={on_mouse_down}
              onWheel={on_wheel}
              style={{
                width: SIZE, height: SIZE,
                borderRadius: "50%",
                overflow: "hidden",
                border: `2px solid ${c.w15}`,
                cursor: dragging.current ? "grabbing" : "grab",
                position: "relative",
                flexShrink: 0,
              }}
            >
              <img
                src={src}
                draggable={false}
                style={{
                  position: "absolute",
                  width: scaled.w,
                  height: scaled.h,
                  left: SIZE / 2 + offset.x - scaled.w / 2,
                  top: SIZE / 2 + offset.y - scaled.h / 2,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />
            </div>

            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              marginTop: 20, width: "100%", maxWidth: SIZE,
            }}>
              <button
                onClick={() => nudge_zoom(-1)}
                style={{ display: "flex", padding: 4, borderRadius: 4, transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = c.w10)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <ZoomOut size={16} color={c.w40} />
              </button>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={e => set_zoom(parseFloat(e.target.value))}
                className="avatar-crop-slider"
                style={{ flex: 1, height: 4 }}
              />
              <button
                onClick={() => nudge_zoom(1)}
                style={{ display: "flex", padding: 4, borderRadius: 4, transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = c.w10)}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <ZoomIn size={16} color={c.w40} />
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", width: "100%", marginTop: 24 }}>
              <button onClick={close} style={{
                padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: c.w06, color: c.w50,
                transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = c.w10)}
                onMouseLeave={e => (e.currentTarget.style.background = c.w06)}
              >Cancel</button>
              <button onClick={render_crop} style={{
                padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                background: c.accent, color: c.white,
                transition: "opacity 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >Apply</button>
            </div>
          </>
        );
      }}
    </Modal>
  );
}
