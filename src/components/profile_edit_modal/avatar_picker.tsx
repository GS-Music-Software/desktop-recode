import { open } from "@tauri-apps/plugin-dialog";
import { ImagePlus, X } from "lucide-react";
import { c } from "@/theme";

type Props = {
  src: string | null;
  on_pick: (path: string) => void;
  on_clear: () => void;
};

export function AvatarPicker({ src, on_pick, on_clear }: Props) {
  const pick = async () => {
    const path = await open({
      title: "Select Profile Picture",
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }],
    });
    if (path) on_pick(path);
  };

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={pick}
        style={{
          width: 80, height: 80, borderRadius: "50%",
          background: src ? "transparent" : c.w06,
          border: `1px solid ${c.w10}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = c.w25)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = c.w10)}
      >
        {src ? (
          <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <ImagePlus size={24} color={c.w30} />
        )}
      </button>
      {src && (
        <button
          onClick={on_clear}
          style={{
            position: "absolute", top: -4, right: -4,
            width: 20, height: 20, borderRadius: "50%",
            background: c.b85, border: `1px solid ${c.w15}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={10} color={c.white} />
        </button>
      )}
    </div>
  );
}
