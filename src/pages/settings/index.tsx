import { useState } from "react";
import { use_lib, use_settings, use_profile } from "@/ctx";
import { open } from "@tauri-apps/plugin-dialog";
import {
  FolderOpen,
  Wallpaper,
  RotateCcw,
  Info,
  ChevronRight,
  AppWindow,
  Volume2,
  Palette,
  Keyboard,
  Download,
  Upload,
  Server,
  CloudDownload,
  X,
} from "lucide-react";
import { SpotifySetup } from "@/components/spotify/setup";
import { SpotifyConnect } from "@/components/spotify/connect";
import { Modal } from "@/components/modal";
import { Toggle } from "./toggle";
import { Btn } from "./btn";
import { Select } from "./select";
import { RpcSettings } from "./rpc_settings";
import { use_account_export, ImportOverlay } from "./account_export";
import { c } from "@/theme";

type Tab = "general" | "appearance" | "music" | "connections";

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "14px 0",
};

const sep: React.CSSProperties = { height: 1, background: c.w06 };

const card: React.CSSProperties = {
  borderRadius: 14,
  padding: "0 20px",
  background: c.w04,
  border: `1px solid ${c.w07}`,
};

const section_lbl: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: c.w30,
  marginBottom: 10,
};

function RowIcon({ icon: Icon }: { icon: typeof FolderOpen }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 8, background: c.w06,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <Icon size={16} color={c.w45} />
    </div>
  );
}

function SvgIcon({ d }: { d: string }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 8, background: c.w06,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill={c.w45}><path d={d} /></svg>
    </div>
  );
}

const DISCORD_D = "M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z";
const SPOTIFY_D = "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z";

const TABS: { key: Tab; label: string }[] = [
  { key: "general", label: "General" },
  { key: "appearance", label: "Appearance" },
  { key: "music", label: "Music" },
  { key: "connections", label: "Connections" },
];

export function Settings() {
  const { music_dir, load_library, set_view, library_mode, server_url, connect_server, disconnect_server } = use_lib();
  const {
    immersive_bg, set_immersive_bg,
    exp_volume, set_exp_volume,
    discord_rpc, set_discord_rpc,
    rpc_opts, set_rpc_opts,
    tray_enabled, set_tray_enabled,
    sp_client_id, set_sp_client_id,
    sp_tokens, sp_connect, sp_disconnect, sp_loading,
    soundcloud_dl, set_soundcloud_dl,
    lyrics_source, set_lyrics_source,
    lyric_offset, set_lyric_offset,
  } = use_settings();
  const { reset } = use_profile();
  const { export_account, import_account, import_state } = use_account_export();
  const [tab, set_tab] = useState<Tab>("general");
  const [sp_setup_open, set_sp_setup_open] = useState(false);
  const [srv_input, set_srv_input] = useState("");
  const [srv_connecting, set_srv_connecting] = useState(false);
  const [srv_err, set_srv_err] = useState<string | null>(null);
  const [srv_editing, set_srv_editing] = useState(false);
  const [sc_info_open, set_sc_info_open] = useState(false);

  const try_connect = async () => {
    const trimmed = srv_input.trim().replace(/\/+$/, "");
    if (!trimmed) return;
    set_srv_connecting(true);
    set_srv_err(null);
    try {
      await connect_server(trimmed);
      set_srv_editing(false);
    } catch {
      set_srv_err("Couldn't connect to server");
    } finally {
      set_srv_connecting(false);
    }
  };

  const pick_dir = async () => {
    const dir = await open({ directory: true, title: "Select Music Folder" });
    if (dir) await load_library(dir);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        className="page-header"
        style={{
          display: "flex", flexDirection: "column", flexShrink: 0,
          borderBottom: `1px solid ${c.w07}`,
        }}
        data-tauri-drag-region
      >
        <div style={{ height: 52, display: "flex", alignItems: "center", padding: "0 24px" }} data-tauri-drag-region>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: c.text }}>Settings</h1>
        </div>
        <div style={{ display: "flex", gap: 0, padding: "0 24px" }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => set_tab(t.key)}
              style={{
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? c.text : c.w40,
                borderBottom: `2px solid ${tab === t.key ? c.accent : "transparent"}`,
                transition: "color 0.15s, border-color 0.15s",
                marginBottom: -1,
              }}
              onMouseEnter={e => { if (tab !== t.key) e.currentTarget.style.color = c.w60; }}
              onMouseLeave={e => { if (tab !== t.key) e.currentTarget.style.color = c.w40; }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

          {tab === "general" && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <p style={section_lbl}>Library</p>
                  <div style={card}>
                    <div style={row}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <RowIcon icon={FolderOpen} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Library Path</p>
                          <p style={{ fontSize: 11, color: c.w40, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {music_dir ?? "No folder selected"}
                          </p>
                        </div>
                      </div>
                      <Btn label="Browse" on_click={pick_dir} />
                    </div>

                    <div style={sep} />

                    <div style={row}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <RowIcon icon={Server} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Server</p>
                          <p style={{ fontSize: 11, color: c.w40, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {library_mode === "server" ? server_url : "Not connected"}
                          </p>
                        </div>
                      </div>
                      {library_mode === "server" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <Btn label="Change" on_click={() => { set_srv_input(server_url ?? ""); set_srv_editing(true); }} />
                          <Btn label="Disconnect" danger on_click={disconnect_server} />
                        </div>
                      ) : (
                        <Btn label="Connect" on_click={() => set_srv_editing(true)} />
                      )}
                    </div>

                    {srv_editing && (
                      <div style={{ padding: "0 0 14px" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input
                            type="text"
                            value={srv_input}
                            onChange={e => set_srv_input(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") try_connect(); }}
                            placeholder="http://192.168.1.100:7700"
                            style={{
                              flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13,
                              background: c.w04, border: `1px solid ${srv_err ? "rgba(239,68,68,0.5)" : c.w10}`,
                              color: c.text, outline: "none",
                            }}
                          />
                          <Btn label={srv_connecting ? "..." : "Go"} on_click={try_connect} />
                          <Btn label="Cancel" on_click={() => { set_srv_editing(false); set_srv_err(null); }} />
                        </div>
                        {srv_err && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 6 }}>{srv_err}</p>}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p style={section_lbl}>Account</p>
                  <div style={card}>
                    <div style={row}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <RowIcon icon={Download} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Export Account</p>
                          <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>Save tracks, playlists & favorites as JSON</p>
                        </div>
                      </div>
                      <Btn label="Export" on_click={export_account} />
                    </div>

                    <div style={sep} />

                    <div style={row}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <RowIcon icon={Upload} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Import Account</p>
                          <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>Restore from export</p>
                        </div>
                      </div>
                      <Btn label="Import" on_click={import_account} />
                    </div>
                  </div>
                </div>
                <div>
                  <p style={section_lbl}>About & Data</p>
                  <div style={card}>
                    <div style={{ ...row, cursor: "pointer" }} onClick={() => set_view("about")}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <RowIcon icon={Info} />
                        <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>About GS Music</p>
                      </div>
                      <ChevronRight size={14} color={c.w20} />
                    </div>

                    <div style={sep} />

                    <div style={row}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <RowIcon icon={RotateCcw} />
                        <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Reset GS Music</p>
                      </div>
                      <Btn label="Reset" danger on_click={reset} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p style={section_lbl}>Controls</p>
                <div style={card}>
                  <div style={{ ...row, cursor: "pointer" }} onClick={() => set_view("keybinds")}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <RowIcon icon={Keyboard} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Keybinds</p>
                        <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>Keyboard shortcuts</p>
                      </div>
                    </div>
                    <ChevronRight size={14} color={c.w20} />
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "appearance" && (
            <>
              <div>
                <p style={section_lbl}>Player</p>
                <div style={card}>
                  <div style={row}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <RowIcon icon={Wallpaper} />
                      <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Immersive Background</p>
                    </div>
                    <Toggle on={immersive_bg} set_on={set_immersive_bg} />
                  </div>

                  <div style={sep} />

                  <div style={row}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <RowIcon icon={Volume2} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Exponential Volume</p>
                        <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>More control at lower volumes</p>
                      </div>
                    </div>
                    <Toggle on={exp_volume} set_on={set_exp_volume} />
                  </div>
                </div>
              </div>

              <div>
                <p style={section_lbl}>Theme</p>
                <div style={card}>
                  <div style={{ ...row, cursor: "pointer" }} onClick={() => set_view("theme_editor")}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <RowIcon icon={Palette} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Theme</p>
                        <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>Customize colors</p>
                      </div>
                    </div>
                    <ChevronRight size={14} color={c.w20} />
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "music" && (
            <>
              <div>
                <p style={section_lbl}>Download Source</p>
                <div style={card}>
                  <div style={row}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <RowIcon icon={CloudDownload} />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>SoundCloud Downloads</p>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 6,
                            background: "rgba(255,120,0,0.15)", color: "#ff8c00",
                          }}>
                            Beta
                          </span>
                          <button
                            onClick={() => set_sc_info_open(true)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "center",
                              width: 18, height: 18, borderRadius: "50%",
                              background: "transparent", cursor: "pointer",
                            }}
                          >
                            <Info size={13} color={c.w30} />
                          </button>
                        </div>
                        <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>Try SoundCloud before YouTube</p>
                      </div>
                    </div>
                    <Toggle on={soundcloud_dl} set_on={set_soundcloud_dl} />
                  </div>
                </div>
              </div>

              <div>
                <p style={section_lbl}>Lyrics</p>
                <div style={card}>
                  <div style={row}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <RowIcon icon={Info} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Lyrics Source</p>
                        <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>Where to fetch lyrics from</p>
                      </div>
                    </div>
                    <Select
                      value={lyrics_source}
                      on_change={set_lyrics_source}
                      options={[
                        { value: "musixmatch", label: "Musixmatch" },
                        { value: "netease", label: "Netease" },
                        { value: "lrclib", label: "LRCLib" },
                      ]}
                    />
                  </div>

                  <div style={sep} />

                  <div style={row}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <RowIcon icon={Info} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Sync Offset</p>
                        <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>Delay lyrics to match audio (ms)</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        onClick={() => set_lyric_offset(lyric_offset - 100)}
                        style={{ width: 28, height: 28, borderRadius: 7, background: c.w08, fontSize: 16, color: c.w60, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        onMouseEnter={e => e.currentTarget.style.background = c.w12}
                        onMouseLeave={e => e.currentTarget.style.background = c.w08}
                      >−</button>
                      <span style={{ fontSize: 13, fontWeight: 600, color: c.text, minWidth: 48, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{lyric_offset}ms</span>
                      <button
                        onClick={() => set_lyric_offset(lyric_offset + 100)}
                        style={{ width: 28, height: 28, borderRadius: 7, background: c.w08, fontSize: 16, color: c.w60, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        onMouseEnter={e => e.currentTarget.style.background = c.w12}
                        onMouseLeave={e => e.currentTarget.style.background = c.w08}
                      >+</button>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}

          {tab === "connections" && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <p style={section_lbl}>Discord</p>
                  <div style={card}>
                    <div style={row}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <SvgIcon d={DISCORD_D} />
                        <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Rich Presence</p>
                      </div>
                      <Toggle on={discord_rpc} set_on={set_discord_rpc} />
                    </div>
                  </div>
                </div>

                {discord_rpc && <RpcSettings opts={rpc_opts} set_opts={set_rpc_opts} />}

                <div>
                  <p style={section_lbl}>System</p>
                  <div style={card}>
                    <div style={row}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <RowIcon icon={AppWindow} />
                        <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>System Tray</p>
                      </div>
                      <Toggle on={tray_enabled} set_on={set_tray_enabled} />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p style={section_lbl}>Spotify</p>
                <div style={card}>
                  <div style={row}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <SvgIcon d={SPOTIFY_D} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Spotify</p>
                        {sp_tokens && (
                          <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>{sp_tokens.display_name}</p>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {!sp_tokens && !sp_client_id && <Btn label="Setup" on_click={() => set_sp_setup_open(true)} />}
                      {!sp_tokens && sp_client_id && <Btn label="Connect" on_click={() => sp_connect()} />}
                      {sp_tokens && <Btn label="Disconnect" danger on_click={sp_disconnect} />}
                      {sp_client_id && !sp_tokens && <Btn label="Edit" on_click={() => set_sp_setup_open(true)} />}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {sc_info_open && (
        <Modal on_close={() => set_sc_info_open(false)}>
          {(close) => (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CloudDownload size={18} color="#ff8c00" />
                  <p style={{ fontSize: 15, fontWeight: 600, color: c.text }}>SoundCloud Downloads</p>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 6,
                    background: "rgba(255,120,0,0.15)", color: "#ff8c00",
                  }}>
                    Beta
                  </span>
                </div>
                <button
                  onClick={close}
                  style={{
                    width: 28, height: 28, borderRadius: 8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: c.w06, cursor: "pointer",
                  }}
                >
                  <X size={14} color={c.w40} />
                </button>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: c.w60 }}>
                This is a reverse-engineered SoundCloud download system that tries to fetch songs directly from SoundCloud before falling back to YouTube.
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: c.w60, marginTop: 12 }}>
                It's still getting improvements. Some songs may be incorrect, missing, or lower quality. If it's too buggy for you, turn it off to go back to YouTube downloads only.
              </p>
              <button
                onClick={close}
                style={{
                  marginTop: 20, width: "100%", padding: "10px 0", borderRadius: 10,
                  fontSize: 13, fontWeight: 500, background: c.w08, color: c.text,
                  cursor: "pointer", transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = c.w12}
                onMouseLeave={e => e.currentTarget.style.background = c.w08}
              >
                Got it
              </button>
            </>
          )}
        </Modal>
      )}

      {sp_setup_open && (
        <SpotifySetup
          initial_id={sp_client_id ?? ""}
          on_save={(id) => { set_sp_client_id(id); set_sp_setup_open(false); sp_connect(id); }}
          on_close={() => set_sp_setup_open(false)}
        />
      )}

      {sp_loading && <SpotifyConnect />}

      {import_state && <ImportOverlay state={import_state} />}
    </div>
  );
}
