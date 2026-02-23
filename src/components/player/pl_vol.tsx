import { useState, useRef } from "react";
import { use_pl, use_settings } from "@/ctx";
import { Volume2, VolumeX, ListMusic } from "lucide-react";
import { c } from "@/theme";

function TaperBar({ vol, set_vol, w, h, fill, bg_fill }: { vol: number; set_vol: (v: number) => void; w: number; h: number; fill: string; bg_fill: string }) {
  const ref = useRef<SVGSVGElement>(null);

  function from_x(clientX: number) {
    const r = ref.current!.getBoundingClientRect();
    set_vol(Math.max(0, Math.min(1, (clientX - r.left) / r.width)));
  }

  function on_down(e: React.MouseEvent) {
    e.preventDefault();
    from_x(e.clientX);
    function on_move(ev: MouseEvent) { from_x(ev.clientX); }
    function on_up() { window.removeEventListener("mousemove", on_move); window.removeEventListener("mouseup", on_up); }
    window.addEventListener("mousemove", on_move);
    window.addEventListener("mouseup", on_up);
  }

  const mid = h / 2;
  const shape = `M0,${mid - 0.5} L${w},0 L${w},${h} L0,${mid + 0.5} Z`;

  return (
    <svg ref={ref} width={w} height={h} style={{ cursor: "pointer", display: "block", flexShrink: 0 }} onMouseDown={on_down}>
      <defs><clipPath id="pl-vol-clip"><rect x={0} y={0} width={vol * w} height={h} /></clipPath></defs>
      <path d={shape} fill={bg_fill} />
      <path d={shape} fill={fill} clipPath="url(#pl-vol-clip)" />
    </svg>
  );
}

export function PlVol({ on_queue }: { on_queue: () => void }) {
  const { volume, set_volume, queue } = use_pl();
  const { exp_volume } = use_settings();
  const [q_hov, set_q_hov] = useState(false);

  return (
    <div
      onWheel={(e) => { e.preventDefault(); set_volume(volume + (e.deltaY < 0 ? 0.05 : -0.05)); }}
      style={{ width: 280, minWidth: 280, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
      <button onClick={() => set_volume(volume > 0 ? 0 : 1)} style={{ color: c.w50 }}>
        {volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>
      {exp_volume ? (
        <TaperBar vol={volume} set_vol={set_volume} w={96} h={12} fill={c.white} bg_fill={c.w10} />
      ) : (
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => set_volume(Number(e.target.value))}
          style={{ width: 96, background: `linear-gradient(to right, ${c.white} ${volume * 100}%, ${c.card_alt_hover} ${volume * 100}%)`, borderRadius: 2 }}
        />
      )}
      <button
        onClick={on_queue}
        onMouseEnter={() => set_q_hov(true)}
        onMouseLeave={() => set_q_hov(false)}
        style={{ color: q_hov ? c.white : queue.length > 0 ? c.w50 : c.w20, transition: "color 0.15s", padding: 4 }}
      >
        <ListMusic size={16} />
      </button>
    </div>
  );
}
