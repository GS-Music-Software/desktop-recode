import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Heart, ListMusic } from "lucide-react";
import { c } from "@/theme";

export function PlCover({ cover, is_favs }: { cover: string | null; is_favs?: boolean }) {
  const [src, set_src] = useState<string | null>(null);

  useEffect(() => {
    if (!cover) { set_src(null); return; }
    invoke<string | null>("pl_cover", { path: cover }).then(set_src).catch(() => set_src(null));
  }, [cover]);

  if (src) {
    return (
      <img
        src={src}
        style={{ width: 200, height: 200, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
      />
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
    <div style={{
      width: 200, height: 200, borderRadius: 12, flexShrink: 0,
      background: c.w06,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <ListMusic size={64} strokeWidth={1} color={c.w15} />
    </div>
  );
}
