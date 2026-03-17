import { useState, useRef, useEffect } from "react";
import { open as open_file_dialog } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { Modal } from "@/components/modal";
import { c } from "@/theme";
import type { YtTrack } from "@/components/youtube/types";

type MetaEditItem = { track: YtTrack; idx: number };
type ResolvedMeta = { title: string; artist: string; cover_url?: string } | null;

type Props = {
  item: MetaEditItem | null;
  on_resolve: (idx: number, updated: ResolvedMeta) => void;
};

export function MetaEditModal({ item, on_resolve }: Props) {
  const [title, set_title] = useState("");
  const [artist, set_artist] = useState("");
  const [cover_path, set_cover_path] = useState("");
  const [cover_preview, set_cover_preview] = useState("");
  const blob_ref = useRef("");

  function revoke_blob() {
    if (blob_ref.current) {
      URL.revokeObjectURL(blob_ref.current);
      blob_ref.current = "";
    }
  }

  useEffect(() => {
    if (item) {
      set_title(item.track.title);
      set_artist(item.track.artist);
      revoke_blob();
      set_cover_path(item.track.cover_url ?? "");
      set_cover_preview(item.track.cover_url ?? "");
    }
  }, [item?.idx]);

  useEffect(() => () => revoke_blob(), []);

  async function pick_cover() {
    const path = await open_file_dialog({ filters: [{ name: "Image", extensions: ["jpg", "jpeg", "png", "webp"] }] });
    if (!path || typeof path !== "string") return;
    try {
      const bytes = await readFile(path);
      revoke_blob();
      const blob = new Blob([bytes], { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      blob_ref.current = url;
      set_cover_path(path);
      set_cover_preview(url);
    } catch {}
  }

  function clear_cover() {
    revoke_blob();
    set_cover_path("");
    set_cover_preview("");
  }

  function skip() {
    on_resolve(item!.idx, null);
  }

  function save() {
    on_resolve(item!.idx, {
      title: title.trim() || item!.track.title,
      artist: artist.trim() || item!.track.artist,
      cover_url: cover_path || undefined,
    });
  }

  if (!item) return null;

  return (
    <Modal portal on_close={skip}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>
            Couldn't find song info
          </p>
          <p style={{ fontSize: 13, color: c.w40, lineHeight: 1.5 }}>
            No metadata was found for this video. Set the details manually, or skip to use defaults.
          </p>
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div
              onClick={pick_cover}
              style={{
                width: 80, height: 80, borderRadius: 8, cursor: "pointer",
                background: c.w06, border: `1px solid ${c.w10}`,
                overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {cover_preview ? (
                <img src={cover_preview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 11, color: c.w30, textAlign: "center", padding: "0 6px" }}>Add Cover</span>
              )}
            </div>
            {cover_path && (
              <button onClick={clear_cover} style={{ fontSize: 11, color: c.w30, background: "none" }}>
                Remove
              </button>
            )}
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: c.w40, fontWeight: 500 }}>Title</label>
              <input
                value={title}
                onChange={e => set_title(e.target.value)}
                style={{
                  background: c.w06, border: `1px solid ${c.w10}`,
                  borderRadius: 8, padding: "8px 12px",
                  fontSize: 13, color: c.text, outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: c.w40, fontWeight: 500 }}>Artist</label>
              <input
                value={artist}
                onChange={e => set_artist(e.target.value)}
                style={{
                  background: c.w06, border: `1px solid ${c.w10}`,
                  borderRadius: 8, padding: "8px 12px",
                  fontSize: 13, color: c.text, outline: "none",
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={skip}
            style={{
              padding: "8px 18px", borderRadius: 8, fontSize: 13,
              background: c.w06, color: c.w50, border: `1px solid ${c.w10}`,
            }}
          >
            Skip
          </button>
          <button
            onClick={save}
            style={{
              padding: "8px 18px", borderRadius: 8, fontSize: 13,
              background: c.accent, color: c.white, fontWeight: 600,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
