import { ColorRow } from "./color_row";
import { c } from "@/theme";

type Props = {
  value: string;
  on_change: (hex: string) => void;
  open: boolean;
  on_toggle: () => void;
};

const card: React.CSSProperties = {
  borderRadius: 14,
  padding: "0 20px",
  background: c.w04,
  border: `1px solid ${c.w07}`,
};

export function FontPicker({ value, on_change, open, on_toggle }: Props) {
  return (
    <div style={card}>
      <ColorRow
        label="Font Color"
        description="Text and icon color"
        value={value}
        on_change={on_change}
        open={open}
        on_toggle={on_toggle}
      />
    </div>
  );
}
