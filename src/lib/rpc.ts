import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { use_pl } from "@/ctx";
import type { RpcOpts, RpcField } from "@/ctx";
import { get_time } from "./audio";

function rpc_on() { return invoke<boolean>("rpc_on"); }
function rpc_off() { return invoke("rpc_off"); }
function rpc_clr() { return invoke("rpc_clr"); }

function rpc_set(detail: string, state: string, large_txt: string, cover_url: string | null, playing: boolean, show_ts: boolean, elapsed: number, duration: number) {
  return invoke("rpc_set", { detail, state, largeTxt: large_txt, coverUrl: cover_url, playing, showTs: show_ts, elapsed, duration });
}

function rpc_cover(artist: string, title: string) {
  return invoke<string | null>("rpc_cover", { artist, title });
}

function resolve(field: RpcField, title: string, artist: string, album: string, playing: boolean): string {
  switch (field) {
    case "title": return title;
    case "artist": return playing ? `by ${artist}` : `by ${artist} (Paused)`;
    case "album": return album;
    case "title_artist": return `${title} - ${artist}`;
    case "artist_album": return `${artist} - ${album}`;
    case "none": return "";
  }
}

const art_cache = new Map<string, string | null>();

export function use_rpc(enabled: boolean, opts?: RpcOpts) {
  const { current, playing } = use_pl();
  const iv = useRef<ReturnType<typeof setInterval> | null>(null);
  const art_ref = useRef<string | null>(null);
  const cur_ref = useRef(current);
  const playing_ref = useRef(playing);
  const opts_ref = useRef(opts);
  cur_ref.current = current;
  playing_ref.current = playing;
  opts_ref.current = opts;

  function clr_iv() { if (iv.current) { clearInterval(iv.current); iv.current = null; } }

  function send() {
    const c = cur_ref.current;
    const p = playing_ref.current;
    const o = opts_ref.current ?? { detail: "title" as RpcField, state: "artist" as RpcField, show_ts: true, show_art: true };
    if (!c) return;
    const detail = resolve(o.detail, c.title, c.artist, c.album, p);
    const state = resolve(o.state, c.title, c.artist, c.album, p);
    const large_txt = c.album || c.title;
    rpc_set(detail, state, large_txt, o.show_art ? art_ref.current : null, p, o.show_ts, get_time(), c.duration).catch(e => console.error("rpc:", e));
  }

  useEffect(() => {
    if (!enabled) {
      rpc_off().catch(e => console.error("rpc:", e));
      clr_iv();
      return;
    }
    rpc_on().catch(e => console.error("rpc:", e));
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !current) {
      if (enabled) rpc_clr().catch(e => console.error("rpc:", e));
      clr_iv();
      return;
    }

    const o = opts ?? { detail: "title" as RpcField, state: "artist" as RpcField, show_ts: true, show_art: true };

    const ck = `${current.artist}::${current.title}`;
    if (o.show_art && art_cache.has(ck)) {
      art_ref.current = art_cache.get(ck) ?? null;
      send();
    } else if (o.show_art) {
      art_ref.current = null;
      rpc_cover(current.artist, current.title).then(url => {
        art_cache.set(ck, url);
        art_ref.current = url;
        send();
      }).catch(e => console.error("rpc:", e));
    } else {
      art_ref.current = null;
      send();
    }

    clr_iv();
    iv.current = setInterval(send, 15000);

    return clr_iv;
  }, [enabled, current?.path, playing, opts]);
}
