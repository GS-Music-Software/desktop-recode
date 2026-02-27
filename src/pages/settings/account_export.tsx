import { useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { save, open, message } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { use_lib, use_toast } from "@/ctx";
import { invoke_download } from "@/pages/discover/hooks/dl_invoke";
import { c } from "@/theme";

type ExportTrack = {
  title: string;
  artist: string;
  album: string;
  duration: number;
};

type ImportResult = {
  playlists_created: number;
  favorites_restored: number;
  tracks_already_present: number;
  tracks_to_download: ExportTrack[];
};

export type ImportState = {
  phase: "scanning" | "downloading" | "rebuilding";
  done: number;
  failed: number;
  total: number;
  current_track: string;
  eta_seconds: number | null;
};

export function use_account_export() {
  const { music_dir, load_library, load_playlists } = use_lib();
  const { push } = use_toast();
  const dl_id = useRef(0);
  const [import_state, set_import_state] = useState<ImportState | null>(null);

  async function export_account() {
    if (!music_dir) return;
    const json = await invoke<string>("export_account", { dir: music_dir });
    const path = await save({
      title: "Save Account Export",
      defaultPath: "gs-music-export.json",
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!path) return;
    await writeTextFile(path, json);
    push({ type: "success", title: "Export complete", sub: path });
  }

  async function import_account(silent = false) {
    if (!music_dir) return;
    const path = await open({
      title: "Select Account Export",
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!path) return;

    try {
      set_import_state({ phase: "scanning", done: 0, failed: 0, total: 0, current_track: "", eta_seconds: null });

      const data = await readTextFile(path);
      const result = await invoke<ImportResult>("import_account", { data, dir: music_dir });

      if (result.tracks_to_download.length === 0) {
        set_import_state(null);
        await load_library(music_dir);
        load_playlists();
        const parts = [`${result.tracks_already_present} tracks already present`];
        if (result.playlists_created > 0) parts.push(`${result.playlists_created} playlists restored`);
        if (result.favorites_restored > 0) parts.push(`${result.favorites_restored} favorites restored`);
        if (!silent) await message(parts.join("\n"), { title: "Import Complete", kind: "info" });
        return;
      }

      const total = result.tracks_to_download.length;
      let done = 0;
      let failed = 0;
      const start_time = Date.now();
      const active_ids = new Set<number>();

      set_import_state({ phase: "downloading", done: 0, failed: 0, total, current_track: result.tracks_to_download[0].title, eta_seconds: null });

      const tick = () => {
        const elapsed = (Date.now() - start_time) / 1000;
        const completed = done + failed;
        const per_track = completed > 0 ? elapsed / completed : 0;
        const remaining = completed > 0 ? Math.round(per_track * (total - completed)) : null;
        set_import_state(prev => prev ? { ...prev, done, failed, eta_seconds: remaining } : prev);
      };

      const unlisten_done = await listen<{ id: number; path: string | null; err: string | null }>("dl_done", ({ payload }) => {
        if (!active_ids.has(payload.id)) return;
        active_ids.delete(payload.id);
        if (payload.err) failed++;
        else done++;
        tick();
      });

      for (let i = 0; i < total; i++) {
        const t = result.tracks_to_download[i];
        const id = dl_id.current++;
        active_ids.add(id);
        set_import_state(prev => prev ? { ...prev, current_track: t.title } : prev);
        const cover = await invoke<string | null>("lookup_cover", { artist: t.artist, title: t.title }).catch(() => null);
        invoke_download(id, t.artist, t.title, t.album, cover ?? "", Math.round(t.duration), music_dir).catch(() => {
          active_ids.delete(id);
          failed++;
          tick();
        });
        await new Promise(r => setTimeout(r, 300));
      }

      while (done + failed < total) {
        await new Promise(r => setTimeout(r, 500));
      }

      unlisten_done();

      set_import_state(prev => prev ? { ...prev, phase: "rebuilding", current_track: "", eta_seconds: null } : prev);
      await invoke("import_fill_playlists", { data, dir: music_dir });
      await load_library(music_dir);
      load_playlists();

      set_import_state(null);
      const parts = [`${done} tracks downloaded`];
      if (failed > 0) parts.push(`${failed} tracks failed`);
      if (result.playlists_created > 0) parts.push(`${result.playlists_created} playlists restored`);
      if (result.favorites_restored > 0) parts.push(`${result.favorites_restored} favorites restored`);
      if (!silent) await message(parts.join("\n"), { title: "Import Complete", kind: "info" });
    } catch (e) {
      set_import_state(null);
      if (!silent) await message(String(e), { title: "Import Failed", kind: "error" });
    }
  }

  return { export_account, import_account, import_state };
}

function fmt_eta(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function Dots() {
  return (
    <>
      <span style={{ fontSize: 28, color: c.accent, letterSpacing: 4 }}>
        <span style={{ animation: "dot 1.4s infinite", animationDelay: "0s", opacity: 0 }}>.</span>
        <span style={{ animation: "dot 1.4s infinite", animationDelay: "0.2s", opacity: 0 }}>.</span>
        <span style={{ animation: "dot 1.4s infinite", animationDelay: "0.4s", opacity: 0 }}>.</span>
      </span>
      <style>{`@keyframes dot { 0%,80%,100% { opacity: 0 } 40% { opacity: 1 } }`}</style>
    </>
  );
}

export function ImportOverlay({ state }: { state: ImportState }) {
  const completed = state.done + state.failed;
  const pct = state.total > 0 ? Math.round((completed / state.total) * 100) : 0;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: 420, padding: "40px 36px", borderRadius: 20,
        background: c.w04, border: `1px solid ${c.w07}`,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
      }}>
        <Dots />

        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: c.text }}>
            {state.phase === "scanning" && "Scanning Library"}
            {state.phase === "downloading" && "Downloading Tracks"}
            {state.phase === "rebuilding" && "Rebuilding Playlists"}
          </p>

          {state.phase === "downloading" && (
            <p style={{ fontSize: 13, color: c.w40, marginTop: 6 }}>
              {completed} / {state.total} tracks
            </p>
          )}

          <p style={{ fontSize: 11, color: c.w25, marginTop: 4 }}>
            This may take a while
          </p>
        </div>

        {state.phase === "downloading" && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ width: "100%", height: 6, borderRadius: 3, background: c.w06, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3, background: c.accent,
                width: `${pct}%`, transition: "width 0.3s ease",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 11, color: c.w30, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {state.current_track}
              </p>
              {state.eta_seconds !== null && (
                <p style={{ fontSize: 11, color: c.w30, flexShrink: 0 }}>
                  ~{fmt_eta(state.eta_seconds)} remaining
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
