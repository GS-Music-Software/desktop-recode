import { useState } from "react";
import { use_pl, use_lib } from "@/ctx";
import { Art } from "@/components/shared/art";
import { TrackCtxMenu } from "@/components/shared/track_ctx_menu";
import { MicVocal, Radio, Heart } from "lucide-react";
import { c } from "@/theme";

type Props = { on_expand?: () => void };

export function PlInfo({ on_expand }: Props) {
  const { current, current_station } = use_pl();
  const { is_fav, toggle_fav, albums, artists, set_album, set_artist, set_view } = use_lib();
  const [hov, set_hov] = useState(false);
  const [hov_heart, set_hov_heart] = useState(false);
  const [hov_title, set_hov_title] = useState(false);
  const [hov_artist, set_hov_artist] = useState(false);
  const [ctx, set_ctx] = useState<{ x: number; y: number } | null>(null);
  const fav = current ? is_fav(current.path) : false;

  const go_album = () => {
    if (!current) return;
    const al = albums.find(a => a.name === current.album && a.artist === current.artist);
    if (al) { set_album(al); set_view("album_detail"); }
  };

  const go_artist = () => {
    if (!current) return;
    const ar = artists.find(a => a.name === current.artist);
    if (ar) { set_artist(ar); set_view("artist_detail"); }
  };

  const on_ctx = (e: React.MouseEvent) => {
    if (!current) return;
    e.preventDefault();
    e.stopPropagation();
    set_ctx({ x: e.clientX, y: e.clientY });
  };

  if (current_station) {
    return (
      <div style={{ width: 280, minWidth: 280, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 52, height: 52, borderRadius: 6, flexShrink: 0, background: c.w07, border: `1px solid ${c.w10}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Radio size={20} color={c.w50} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{current_station.name}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: c.accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>Live</span>
            <span style={{ fontSize: 12, color: c.w40, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{current_station.genre}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!current) return <div style={{ width: 280, minWidth: 280 }} />;

  return (
    <>
      <div onContextMenu={on_ctx} style={{ width: 280, minWidth: 280, display: "flex", alignItems: "center", gap: 10 }}>
        <Art path={current.path} w={52} h={52} radius={6} eager />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            onClick={go_album}
            onMouseEnter={() => set_hov_title(true)}
            onMouseLeave={() => set_hov_title(false)}
            style={{ fontSize: 13, fontWeight: 500, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer", textDecoration: hov_title ? "underline" : "none" }}
          >{current.title}</p>
          <p
            onClick={go_artist}
            onMouseEnter={() => set_hov_artist(true)}
            onMouseLeave={() => set_hov_artist(false)}
            style={{ fontSize: 12, color: c.w50, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2, cursor: "pointer", textDecoration: hov_artist ? "underline" : "none" }}
          >{current.artist}</p>
        </div>
        <button
          onClick={() => current && toggle_fav(current.path)}
          onMouseEnter={() => set_hov_heart(true)}
          onMouseLeave={() => set_hov_heart(false)}
          title={fav ? "Remove from Favorites" : "Add to Favorites"}
          style={{ flexShrink: 0, color: fav ? c.accent : hov_heart ? c.white : c.w35, transition: "color 0.15s", padding: 4 }}
        >
          <Heart size={16} fill={fav ? c.accent : "none"} />
        </button>
        {on_expand && (
          <button
            onClick={on_expand}
            onMouseEnter={() => set_hov(true)}
            onMouseLeave={() => set_hov(false)}
            title="Lyrics"
            style={{ flexShrink: 0, color: hov ? c.white : c.w35, transition: "color 0.15s", padding: 4 }}
          >
            <MicVocal size={16} />
          </button>
        )}
      </div>
      {ctx && current && <TrackCtxMenu x={ctx.x} y={ctx.y} track={current} on_close={() => set_ctx(null)} />}
    </>
  );
}
