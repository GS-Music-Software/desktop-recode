import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

const cache = new Map<string, string | null>();

export function use_cover(path: string | null): string | null {
  const [src, set_src] = useState<string | null>(() => path ? (cache.get(path) ?? null) : null);

  useEffect(() => {
    if (!path) { set_src(null); return; }
    if (cache.has(path)) {
      set_src(cache.get(path) ?? null);
      return;
    }
    set_src(null);
    invoke<string | null>("get_cover", { path }).then((res) => {
      cache.set(path, res);
      set_src(res);
    }).catch(() => {
      cache.set(path, null);
      set_src(null);
    });
  }, [path]);

  return src;
}
