import { useState } from "react";
import { Download } from "lucide-react";
import { format_duration } from "@/lib";
import type { DzAlbum, DzTrack, DlState } from "../types";
import { DlButton } from "../components/dl_btn";
import { c } from "@/theme";

export function DrillTracks({
  album,
  tracks,
  loading,
  downloads,
  on_download,
  on_download_all,
}: {
  album: DzAlbum;
  tracks: DzTrack[] | null;
  loading: boolean;
  downloads: Map<number, DlState>;
  on_download: (t: DzTrack) => void;
  on_download_all: (tracks: DzTrack[], pl_name: string | null, cover_url?: string) => void;
}) {
  const [dialog, set_dialog] = useState(false);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 24px 8px",
        }}
      >
        <img
          src={album.cover_url}
          style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            objectFit: "cover",
            background: c.card,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: c.text }}>
            {album.title}
          </p>
          <p style={{ fontSize: 12, color: c.w40, marginTop: 2 }}>
            {album.artist}
          </p>
        </div>
        {tracks && tracks.length > 0 && (
          <button
            onClick={() => set_dialog(true)}
            style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent", color: c.w50,
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = c.w07)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Download size={18} />
          </button>
        )}
      </div>

      {dialog && tracks && (
        <div
          onClick={() => set_dialog(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: c.b35, backdropFilter: "blur(24px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: c.modal, border: `1px solid ${c.w08}`,
              borderRadius: 18, padding: "32px 36px",
              width: 420, boxShadow: `0 24px 80px ${c.b70}`,
              display: "flex", flexDirection: "column", gap: 16,
            }}
          >
            <p style={{ fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 4 }}>
              Download Album
            </p>
            <p style={{ fontSize: 13, color: c.w50 }}>
              How would you like to download <span style={{ fontWeight: 600, color: c.w70 }}>{album.title}</span>?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={() => { set_dialog(false); on_download_all(tracks, null); }}
                style={{
                  padding: "10px 12px", borderRadius: 8,
                  fontSize: 13, fontWeight: 500, color: c.text,
                  background: c.w06, border: `1px solid ${c.w10}`,
                  textAlign: "left", transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = c.w10)}
                onMouseLeave={(e) => (e.currentTarget.style.background = c.w06)}
              >
                Download album only
              </button>
              <button
                onClick={() => { set_dialog(false); on_download_all(tracks, `${album.artist} - ${album.title}`, album.cover_url); }}
                style={{
                  padding: "10px 12px", borderRadius: 8,
                  fontSize: 13, fontWeight: 500, color: c.text,
                  background: c.w06, border: `1px solid ${c.w10}`,
                  textAlign: "left", transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = c.w10)}
                onMouseLeave={(e) => (e.currentTarget.style.background = c.w06)}
              >
                Download album and create playlist
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <button
                onClick={() => set_dialog(false)}
                style={{
                  padding: "8px 20px", borderRadius: 8,
                  fontSize: 13, fontWeight: 500, color: c.w50,
                  background: c.w06, transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = c.w10)}
                onMouseLeave={(e) => (e.currentTarget.style.background = c.w06)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: 32 }} className="dot-bounce">
          <span /><span /><span />
        </div>
      )}
      {tracks &&
        tracks.map((t) => {
          const dl = downloads.get(t.id);
          return (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "7px 24px",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = c.w04)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 13, fontWeight: 500, color: c.text,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}
                >
                  {t.title}
                </p>
                <p style={{ fontSize: 12, color: c.w45, marginTop: 2 }}>
                  {t.artist}
                </p>
              </div>
              <span
                style={{
                  fontSize: 11, color: c.w30, flexShrink: 0,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {format_duration(t.duration)}
              </span>
              <DlButton
                dl={dl}
                on_click={() => on_download(t)}
                on_retry={() => on_download(t)}
              />
            </div>
          );
        })}
      {tracks && tracks.length === 0 && (
        <p style={{ fontSize: 13, color: c.w30, padding: "16px 24px" }}>
          No tracks found
        </p>
      )}
    </div>
  );
}
