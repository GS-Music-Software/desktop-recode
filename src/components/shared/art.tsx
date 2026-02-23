import { Music } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { use_cover } from "@/lib";
import { c } from "@/theme";

type Props = {
  path?: string | null;
  w?: number | string;
  h?: number | string;
  radius?: number | string;
  style?: CSSProperties;
  eager?: boolean;
};

function Placeholder({ w, h, radius, style }: Pick<Props, "w" | "h" | "radius" | "style">) {
  const sz = typeof w === "number" ? Math.floor(w * 0.38) : 20;
  return (
    <div style={{ width: w, height: h, borderRadius: radius, display: "flex", alignItems: "center", justifyContent: "center", background: c.card_alt, flexShrink: 0, ...style }}>
      <Music size={sz} color={c.w30} />
    </div>
  );
}

function LoadedArt({ path, w, h, radius, style }: Props) {
  const src = use_cover(path ?? null);
  if (src) return <img src={src} style={{ width: w, height: h, borderRadius: radius, objectFit: "cover", display: "block", flexShrink: 0, ...style }} />;
  return <Placeholder w={w} h={h} radius={radius} style={style} />;
}

export function Art({ path, w = 48, h = 48, radius = 8, style, eager = false }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, set_visible] = useState(eager);

  useEffect(() => {
    if (eager || visible) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { set_visible(true); obs.disconnect(); } },
      { rootMargin: "300px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [eager]);

  if (visible) return <LoadedArt path={path} w={w} h={h} radius={radius} style={style} />;

  return <div ref={ref}><Placeholder w={w} h={h} radius={radius} style={style} /></div>;
}
