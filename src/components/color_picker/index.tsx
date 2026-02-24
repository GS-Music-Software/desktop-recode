import { useState, useEffect } from "react";
import { hex_to_hsv, hsv_to_hex } from "./helpers";
import { SatCanvas } from "./sat_canvas";
import { HueStrip } from "./hue_strip";
import { HexInput } from "./hex_input";

type Props = {
  value: string;
  on_change: (hex: string) => void;
};

export function ColorPicker({ value, on_change }: Props) {
  const [hsv, set_hsv] = useState<[number, number, number]>(() => hex_to_hsv(value));

  useEffect(() => {
    set_hsv(hex_to_hsv(value));
  }, [value]);

  const handle_sv = (s: number, v: number) => {
    const next: [number, number, number] = [hsv[0], s, v];
    set_hsv(next);
    on_change(hsv_to_hex(next[0], next[1], next[2]));
  };

  const handle_hue = (h: number) => {
    const next: [number, number, number] = [h, hsv[1], hsv[2]];
    set_hsv(next);
    on_change(hsv_to_hex(next[0], next[1], next[2]));
  };

  const handle_hex = (hex: string) => {
    on_change(hex);
    set_hsv(hex_to_hsv(hex));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "16px 0 4px" }}>
      <SatCanvas hue={hsv[0]} sat={hsv[1]} val={hsv[2]} on_change={handle_sv} />
      <HueStrip hue={hsv[0]} on_change={handle_hue} />
      <HexInput value={value} on_change={handle_hex} />
    </div>
  );
}
