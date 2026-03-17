import { useState } from "react";
import { Download } from "lucide-react";
import { format_duration } from "@/lib";
import type { DzAlbum, DzTrack, DlState } from "../types";
import { DlButton } from "../components/dl_btn";
import { Modal } from "@/components/modal";
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
          gap: 14,
          padding: "16px 24px 12px",
        }}
      >
        <img
          src={album.cover_url}
          style={{
            width: 60,
            height: 60,
            borderRadius: 10,
            objectFit: "cover",
            background: c.card,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: c.text }}>
            {album.title}
          </p>
          <p style={{ fontSize: 12, color: c.w35, marginTop: 3 }}>
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
        <Modal on_close={() => set_dialog(false)} panel_style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(close) => (
            <>
              <p style={{ fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 4 }}>
                Download Album
              </p>
              <p style={{ fontSize: 13, color: c.w50 }}>
                How would you like to download <span style={{ fontWeight: 600, color: c.w70 }}>{album.title}</span>?
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={() => { close(); on_download_all(tracks, null); }}
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
                  onClick={() => { close(); on_download_all(tracks, `${album.artist} - ${album.title}`, album.cover_url); }}
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
                  onClick={close}
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
            </>
          )}
        </Modal>
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
                gap: 14,
                padding: "6px 24px",
                borderRadius: 8,
                margin: "0 8px",
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
