import { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { c } from "@/theme";

type Props = {
  name: string;
  on_change: (name: string) => void;
};

export function PlaylistTitleEditor({ name, on_change }: Props) {
  const [editing, set_editing] = useState(false);
  const [value, set_value] = useState(name);
  const [hovering, set_hovering] = useState(false);
  const input_ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    set_value(name);
  }, [name]);

  useEffect(() => {
    if (editing && input_ref.current) {
      input_ref.current.focus();
      input_ref.current.select();
    }
  }, [editing]);

  const handle_save = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== name) {
      on_change(trimmed);
    }
    set_editing(false);
    set_value(name);
  };

  const handle_cancel = () => {
    set_editing(false);
    set_value(name);
  };

  const handle_key = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handle_save();
    if (e.key === "Escape") handle_cancel();
  };

  if (editing) {
    return (
      <input
        ref={input_ref}
        value={value}
        onChange={e => set_value(e.target.value)}
        onBlur={handle_save}
        onKeyDown={handle_key}
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: c.text,
          letterSpacing: "-0.5px",
          borderBottom: `2px solid ${c.accent}`,
          border: "none",
          background: "transparent",
          outline: "none",
          padding: "0 0 2px 0",
          width: "100%",
          maxWidth: "600px",
        }}
      />
    );
  }

  return (
    <div
      onMouseEnter={() => set_hovering(true)}
      onMouseLeave={() => set_hovering(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: hovering ? 8 : 0,
        cursor: "pointer",
        transition: "gap 0.15s",
      }}
      onClick={() => set_editing(true)}
      onDoubleClick={() => set_editing(true)}
    >
      <h1
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: c.text,
          letterSpacing: "-0.5px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          margin: 0,
          borderBottom: hovering ? `2px solid ${c.w20}` : "2px solid transparent",
          paddingBottom: "2px",
          transition: "border-color 0.15s",
        }}
      >
        {name}
      </h1>
      {hovering && (
        <Pencil size={20} color={c.w50} strokeWidth={2} />
      )}
    </div>
  );
}
