import { use_lib } from "@/ctx";
import { Art } from "@/components/shared/art";
import { GridCard } from "@/components/shared/grid_card";
import { format_count } from "@/lib";
import { ChevronLeft } from "lucide-react";
import { c } from "@/theme";

export function ArtistDetail() {
  const { selected_artist, set_view, set_album } = use_lib();
  if (!selected_artist) return null;
  const a = selected_artist;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ height: 52, display: "flex", alignItems: "center", padding: "0 20px", flexShrink: 0, borderBottom: `1px solid ${c.w07}` }}>
        <button onClick={() => set_view("artists")} style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 14, fontWeight: 500, color: c.accent }}>
          <ChevronLeft size={18} /> Artists
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, padding: 28 }}>
          <Art path={a.cover_path} w={160} h={160} radius="50%" eager />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: c.w35 }}>Artist</p>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>{a.name}</h1>
            <p style={{ fontSize: 13, color: c.w35, marginTop: 4 }}>{format_count(a.albums.length, "album")} · {format_count(a.tracks.length, "song")}</p>
          </div>
        </div>
        <div style={{ padding: "0 28px 32px" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 16 }}>Albums</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 4 }}>
            {a.albums.map((al, i) => (
              <GridCard key={al.name} title={al.name} sub={`${al.year ?? ""} · ${format_count(al.tracks.length, "song")}`} cover_path={al.cover_path} on_click={() => { set_album(a.albums[i]); set_view("album_detail"); }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
