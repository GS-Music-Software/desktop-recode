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
  Type,
  Keyboard,
  Download,
  Upload,
  Server,
} from "lucide-react";
import { SpotifySetup } from "@/components/spotify/setup";
import { SpotifyConnect } from "@/components/spotify/connect";
import { Toggle } from "./toggle";
import { Btn } from "./btn";
import { RpcSettings } from "./rpc_settings";
import { use_account_export, ImportOverlay } from "./account_export";
import { c } from "@/theme";

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  padding: "14px 0",
};

const sep: React.CSSProperties = {
  height: 1,
  background: c.w06,
};

const card: React.CSSProperties = {
  borderRadius: 14,
  padding: "0 20px",
  background: c.w04,
  border: `1px solid ${c.w07}`,
};

const lbl: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: c.w30,
  marginBottom: 10,
};

function RowIcon({ icon: Icon }: { icon: typeof FolderOpen }) {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: c.w06,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={16} color={c.w45} />
    </div>
  );
}

export function Settings() {
  const { music_dir, load_library, set_view, library_mode, server_url, connect_server, disconnect_server } = use_lib();
  const {
    immersive_bg,
    set_immersive_bg,
    exp_volume,
    set_exp_volume,
    amll_lyrics,
    set_amll_lyrics,
    amll_word_sync,
    set_amll_word_sync,
    discord_rpc,
    set_discord_rpc,
    rpc_opts,
    set_rpc_opts,
    tray_enabled,
    set_tray_enabled,
    sp_client_id,
    set_sp_client_id,
    sp_tokens,
    sp_connect,
    sp_disconnect,
    sp_loading,
  } = use_settings();
  const { reset } = use_profile();
  const { export_account, import_account, import_state } =
    use_account_export();
  const [sp_setup_open, set_sp_setup_open] = useState(false);
  const [srv_input, set_srv_input] = useState("");
  const [srv_connecting, set_srv_connecting] = useState(false);
  const [srv_err, set_srv_err] = useState<string | null>(null);
  const [srv_editing, set_srv_editing] = useState(false);

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
          height: 52,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          flexShrink: 0,
          borderBottom: `1px solid ${c.w07}`,
        }}
        data-tauri-drag-region
      >
        <h1 style={{ fontSize: 20, fontWeight: 700, color: c.text }}>
          Settings
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px 48px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <p style={lbl}>Library</p>
              <div style={card}>
                <div style={row}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      minWidth: 0,
                    }}
                  >
                    <RowIcon icon={FolderOpen} />
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{ fontSize: 13, fontWeight: 500, color: c.text }}
                      >
                        Library Path
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: c.w40,
                          marginTop: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
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

                <div style={sep} />

                <div style={row}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <RowIcon icon={Download} />
                    <div>
                      <p
                        style={{ fontSize: 13, fontWeight: 500, color: c.text }}
                      >
                        Export Account
                      </p>
                      <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>
                        Save tracks, playlists & favorites as JSON
                      </p>
                    </div>
                  </div>
                  <Btn label="Export" on_click={export_account} />
                </div>

                <div style={sep} />

                <div style={row}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <RowIcon icon={Upload} />
                    <div>
                      <p
                        style={{ fontSize: 13, fontWeight: 500, color: c.text }}
                      >
                        Import Account
                      </p>
                      <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>
                        Restore from export
                      </p>
                    </div>
                  </div>
                  <Btn label="Import" on_click={import_account} />
                </div>
              </div>
            </div>

            <div>
              <p style={lbl}>Integrations</p>
              <div style={card}>
                <div style={row}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: c.w06,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={c.w45}
                      >
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                      </svg>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>
                      Discord Rich Presence
                    </p>
                  </div>
                  <Toggle on={discord_rpc} set_on={set_discord_rpc} />
                </div>

                <div style={sep} />

                <div style={row}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <RowIcon icon={AppWindow} />
                    <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>
                      System Tray
                    </p>
                  </div>
                  <Toggle on={tray_enabled} set_on={set_tray_enabled} />
                </div>

                <div style={sep} />

                <div style={row}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: c.w06,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={c.w45}
                      >
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                      </svg>
                    </div>
                    <div>
                      <p
                        style={{ fontSize: 13, fontWeight: 500, color: c.text }}
                      >
                        Spotify
                      </p>
                      {sp_tokens && (
                        <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>
                          {sp_tokens.display_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    {!sp_tokens && !sp_client_id && (
                      <Btn
                        label="Setup"
                        on_click={() => set_sp_setup_open(true)}
                      />
                    )}
                    {!sp_tokens && sp_client_id && (
                      <Btn label="Connect" on_click={() => sp_connect()} />
                    )}
                    {sp_tokens && (
                      <Btn label="Disconnect" danger on_click={sp_disconnect} />
                    )}
                    {sp_client_id && !sp_tokens && (
                      <Btn
                        label="Edit"
                        on_click={() => set_sp_setup_open(true)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {discord_rpc && (
              <RpcSettings opts={rpc_opts} set_opts={set_rpc_opts} />
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <p style={lbl}>Appearance</p>
              <div style={card}>
                <div style={row}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <RowIcon icon={Wallpaper} />
                    <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>
                      Immersive Background
                    </p>
                  </div>
                  <Toggle on={immersive_bg} set_on={set_immersive_bg} />
                </div>

                <div style={sep} />

                <div style={row}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <RowIcon icon={Volume2} />
                    <div>
                      <p
                        style={{ fontSize: 13, fontWeight: 500, color: c.text }}
                      >
                        Exponential Volume
                      </p>
                      <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>
                        More control at lower volumes
                      </p>
                    </div>
                  </div>
                  <Toggle on={exp_volume} set_on={set_exp_volume} />
                </div>

                <div style={sep} />

                <div style={row}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <RowIcon icon={Type} />
                    <div>
                      <p
                        style={{ fontSize: 13, fontWeight: 500, color: c.text }}
                      >
                        New Lyrics
                      </p>
                      <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>
                        Try out the new immersive lyrics screen
                      </p>
                    </div>
                  </div>
                  <Toggle on={amll_lyrics} set_on={set_amll_lyrics} />
                </div>

                {amll_lyrics && (
                  <>
                    <div style={sep} />
                    <div style={{ ...row, paddingLeft: 42 }}>
                      <div>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: c.text,
                          }}
                        >
                          Word-Level Sync{" "}
                          <span style={{ color: c.w35, fontWeight: 400 }}>
                            (Buggy)
                          </span>
                        </p>
                        <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>
                          Animate lyrics word-by-word instead of line-by-line
                        </p>
                      </div>
                      <Toggle on={amll_word_sync} set_on={set_amll_word_sync} />
                    </div>
                  </>
                )}

                <div style={sep} />

                <div
                  style={{ ...row, cursor: "pointer" }}
                  onClick={() => set_view("theme_editor")}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <RowIcon icon={Palette} />
                    <div>
                      <p
                        style={{ fontSize: 13, fontWeight: 500, color: c.text }}
                      >
                        Theme
                      </p>
                      <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>
                        Customize colors
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} color={c.w20} />
                </div>
              </div>
            </div>

            <div>
              <p style={lbl}>Controls</p>
              <div style={card}>
                <div
                  style={{ ...row, cursor: "pointer" }}
                  onClick={() => set_view("keybinds")}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <RowIcon icon={Keyboard} />
                    <div>
                      <p
                        style={{ fontSize: 13, fontWeight: 500, color: c.text }}
                      >
                        Keybinds
                      </p>
                      <p style={{ fontSize: 11, color: c.w35, marginTop: 1 }}>
                        Keyboard shortcuts
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} color={c.w20} />
                </div>
              </div>
            </div>

            <div>
              <p style={lbl}>About & Data</p>
              <div style={card}>
                <div
                  style={{ ...row, cursor: "pointer" }}
                  onClick={() => set_view("about")}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <RowIcon icon={Info} />
                    <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>
                      About GS Music
                    </p>
                  </div>
                  <ChevronRight size={14} color={c.w20} />
                </div>

                <div style={sep} />

                <div style={row}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <RowIcon icon={RotateCcw} />
                    <p style={{ fontSize: 13, fontWeight: 500, color: c.text }}>
                      Reset GS Music
                    </p>
                  </div>
                  <Btn label="Reset" danger on_click={reset} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {sp_setup_open && (
        <SpotifySetup
          initial_id={sp_client_id ?? ""}
          on_save={(id) => {
            set_sp_client_id(id);
            set_sp_setup_open(false);
            sp_connect(id);
          }}
          on_close={() => set_sp_setup_open(false)}
        />
      )}

      {sp_loading && <SpotifyConnect />}

      {import_state && <ImportOverlay state={import_state} />}
    </div>
  );
}
