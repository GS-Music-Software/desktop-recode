import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Heart, ListMusic, ImagePlus } from "lucide-react";
import { c } from "@/theme";

export function PlCover({ cover, is_favs, pl_id, on_cover_change }: {
  cover: string | null;
  is_favs?: boolean;
  pl_id?: string;
  on_cover_change?: (cover: string) => void;
}) {
  const [src, set_src] = useState<string | null>(null);
  const [hov, set_hov] = useState(false);
  const editable = !!pl_id && !is_favs && !!on_cover_change;

  useEffect(() => {
    if (!cover) { set_src(null); return; }
    if (cover.startsWith("data:")) { set_src(cover); return; }
    invoke<string | null>("pl_cover", { path: cover }).then(set_src).catch(() => set_src(null));
  }, [cover]);

  async function pick_cover() {
    if (!editable) return;
    const path = await open({
      title: "Select Playlist Cover",
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }],
    });
    if (!path) return;
    const data_uri = await invoke<string | null>("pl_cover", { path });
    if (!data_uri) return;
    await invoke("pl_set_cover", { id: pl_id, cover: data_uri });
    set_src(data_uri);
    on_cover_change?.(data_uri);
  }

  const overlay = editable && hov ? (
    <div
      style={{
        position: "absolute", inset: 0, borderRadius: 12,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <ImagePlus size={32} color={c.white} strokeWidth={1.5} />
    </div>
  ) : null;

  if (src) {
    return (
      <div
        style={{ position: "relative", width: 200, height: 200, flexShrink: 0 }}
        onMouseEnter={() => set_hov(true)}
        onMouseLeave={() => set_hov(false)}
        onClick={pick_cover}
      >
        <img
          src={src}
          style={{ width: 200, height: 200, borderRadius: 12, objectFit: "cover" }}
        />
        {overlay}
      </div>
    );
  }

  if (is_favs) {
    return (
      <div style={{
        width: 200, height: 200, borderRadius: 12, flexShrink: 0,
        background: c.accent_gradient,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Heart size={80} fill={c.white} color={c.white} />
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative", width: 200, height: 200, borderRadius: 12, flexShrink: 0,
        background: c.w06,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: editable ? "pointer" : "default",
      }}
      onMouseEnter={() => set_hov(true)}
      onMouseLeave={() => set_hov(false)}
      onClick={pick_cover}
    >
      <ListMusic size={64} strokeWidth={1} color={c.w15} />
      {overlay}
    </div>
  );
}
