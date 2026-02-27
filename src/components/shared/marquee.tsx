import { useRef, useEffect, useState } from "react";

const GAP = 60;

type Props = {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

export function Marquee({ children, style }: Props) {
  const outer = useRef<HTMLDivElement>(null);
  const measure_ref = useRef<HTMLSpanElement>(null);
  const [overflow, set_overflow] = useState(false);
  const [text_w, set_text_w] = useState(0);

  useEffect(() => {
    function measure() {
      if (!outer.current || !measure_ref.current) return;
      const tw = measure_ref.current.offsetWidth;
      const cw = outer.current.clientWidth;
      set_text_w(tw);
      set_overflow(tw > cw + 2);
    }
    measure();
    const obs = new ResizeObserver(measure);
    if (outer.current) obs.observe(outer.current);
    return () => obs.disconnect();
  }, [children]);

  const cycle = text_w + GAP;
  const dur = Math.max(4, cycle * 0.035);

  return (
    <div
      ref={outer}
      style={{
        overflow: "hidden",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      <span
        className={overflow ? "marquee-scroll" : undefined}
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          ...(overflow
            ? {
                "--marquee-dist": `${-cycle}px`,
                "--marquee-dur": `${dur}s`,
              } as React.CSSProperties
            : {}),
        }}
      >
        <span ref={measure_ref}>{children}</span>
        {overflow && (
          <span style={{ paddingLeft: GAP }}>{children}</span>
        )}
      </span>
    </div>
  );
}
