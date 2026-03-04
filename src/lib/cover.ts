import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";

const cache = new Map<string, string | null>();

function to_cover_url(path: string): string | null {
  if (!path.startsWith("http://") && !path.startsWith("https://")) return null;
  const i = path.indexOf("/api/stream/");
  if (i === -1) return path;
  return path.substring(0, i) + "/api/cover/" + path.substring(i + "/api/stream/".length);
}

export function use_cover(path: string | null): string | null {
  const [src, set_src] = useState<string | null>(() => path ? (cache.get(path) ?? null) : null);
  const prev = useRef<string | null>(src);
  if (src) prev.current = src;

  useEffect(() => {
    if (!path) { set_src(null); return; }
    const url = to_cover_url(path);
    if (url !== null) {
      cache.set(path, url);
      set_src(url);
      return;
    }
    if (cache.has(path)) {
      set_src(cache.get(path) ?? null);
      return;
    }
    let stale = false;
    invoke<string | null>("get_cover", { path }).then((res) => {
      cache.set(path, res);
      if (!stale) set_src(res);
    }).catch(() => {
      cache.set(path, null);
      if (!stale) set_src(null);
    });
    return () => { stale = true; };
  }, [path]);

  return src ?? prev.current;
}
