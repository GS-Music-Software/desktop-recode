import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { ImagePlus, X } from "lucide-react";
import { c } from "@/theme";

type Props = {
  on_create: (name: string, description: string, cover: string | null) => void;
  on_close: () => void;
};

export function PlCreateModal({ on_create, on_close }: Props) {
  const [name, set_name] = useState("");
  const [desc, set_desc] = useState("");
  const [cover, set_cover] = useState<string | null>(null);
  const [cover_src, set_cover_src] = useState<string | null>(null);

  useEffect(() => {
    if (!cover) { set_cover_src(null); return; }
    invoke<string | null>("pl_cover", { path: cover }).then(set_cover_src).catch(() => set_cover_src(null));
  }, [cover]);

  const pick_cover = async () => {
    const path = await open({
      title: "Select Playlist Cover",
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }],
    });
    if (path) set_cover(path);
  };

  const handle_create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    on_create(trimmed, desc.trim(), cover);
  };

  return (
    <div onClick={on_close} style={{
      position: "fixed", inset: 0, zIndex: 10000,
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      background: c.b35,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 420, padding: "32px 36px",
        borderRadius: 18,
        background: c.modal,
        border: `1px solid ${c.w08}`,
        boxShadow: `0 24px 80px ${c.b70}`,
      }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 20 }}>New Playlist</h2>

        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={pick_cover}
              style={{
                width: 80, height: 80, borderRadius: 12,
                background: cover ? "transparent" : c.w06,
                border: `1px solid ${c.w10}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = c.w25)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = c.w10)}
            >
              {cover_src ? (
                <img src={cover_src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <ImagePlus size={24} color={c.w30} />
              )}
            </button>
            {cover && (
              <button
                onClick={() => set_cover(null)}
                style={{
                  position: "absolute", top: -6, right: -6,
                  width: 20, height: 20, borderRadius: "50%",
                  background: c.b85, border: `1px solid ${c.w15}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X size={10} color={c.white} />
              </button>
            )}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              value={name}
              onChange={e => set_name(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handle_create()}
              placeholder="Playlist name"
              autoFocus
              style={{
                width: "100%", padding: "10px 12px",
                borderRadius: 8, fontSize: 13,
                background: c.w06,
                border: `1px solid ${c.w10}`,
                color: c.text, outline: "none",
              }}
            />
            <textarea
              value={desc}
              onChange={e => set_desc(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              style={{
                width: "100%", padding: "10px 12px",
                borderRadius: 8, fontSize: 13,
                background: c.w06,
                border: `1px solid ${c.w10}`,
                color: c.text, outline: "none",
                resize: "none", fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={on_close} style={{
            padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: c.w06, color: c.w50,
            transition: "background 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = c.w10)}
            onMouseLeave={e => (e.currentTarget.style.background = c.w06)}
          >Cancel</button>
          <button onClick={handle_create} style={{
            padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: c.accent, color: c.white,
            transition: "opacity 0.15s", opacity: name.trim() ? 1 : 0.5,
          }}
            onMouseEnter={e => { if (name.trim()) e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={e => (e.currentTarget.style.opacity = name.trim() ? "1" : "0.5")}
          >Create</button>
        </div>
      </div>
    </div>
  );
}
