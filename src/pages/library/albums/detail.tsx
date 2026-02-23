import { use_lib } from "@/ctx";
import { Art } from "@/components/shared/art";
import { TrackRow } from "@/components/shared/track_row";
import { format_count } from "@/lib";
import { ChevronLeft } from "lucide-react";
import { c } from "@/theme";

export function AlbumDetail() {
  const { selected_album, set_view } = use_lib();
  if (!selected_album) return null;
  const a = selected_album;
  const mins = Math.ceil(a.tracks.reduce((s, t) => s + t.duration, 0) / 60);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ height: 52, display: "flex", alignItems: "center", padding: "0 20px", flexShrink: 0, borderBottom: `1px solid ${c.w07}` }}>
        <button onClick={() => set_view("albums")} style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 14, fontWeight: 500, color: c.accent }}>
          <ChevronLeft size={18} /> Albums
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ display: "flex", gap: 28, padding: 28 }}>
          <Art path={a.cover_path} w={200} h={200} radius={16} eager />
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 6, minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: c.w35 }}>Album</p>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>{a.name}</h1>
            <p style={{ fontSize: 15, color: c.w50 }}>{a.artist}</p>
            <p style={{ fontSize: 13, color: c.w35, marginTop: 4 }}>{a.year && `${a.year} · `}{format_count(a.tracks.length, "song")} · {mins} min</p>
          </div>
        </div>
        <div style={{ padding: "0 20px 32px" }}>
          {a.tracks.map((t, i) => <TrackRow key={t.path} track={t} idx={i} queue={a.tracks} />)}
        </div>
      </div>
    </div>
  );
}
