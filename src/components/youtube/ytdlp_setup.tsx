import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { c } from "@/theme";

type Status =
  | "checking_ytdlp"
  | "ytdlp_missing"
  | "installing_ytdlp"
  | "ytdlp_outdated"
  | "updating_ytdlp"
  | "checking_ffmpeg"
  | "ffmpeg_missing"
  | "installing_ffmpeg"
  | "error"
  | "ready";

export function YtdlpSetup({ on_ready }: { on_ready: () => void }) {
  const [status, set_status] = useState<Status>("checking_ytdlp");
  const [remote_ver, set_remote_ver] = useState<string | null>(null);
  const [error, set_error] = useState<string | null>(null);

  async function check_ffmpeg_step() {
    set_status("checking_ffmpeg");
    try {
      const has = await invoke<boolean>("check_ffmpeg");
      if (!has) {
        set_status("ffmpeg_missing");
        return;
      }
      on_ready();
    } catch (e) {
      set_error(String(e));
      set_status("error");
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const has = await invoke<boolean>("check_ytdlp");
        if (!has) {
          set_status("ytdlp_missing");
          return;
        }
        try {
          const update = await invoke<string | null>("check_ytdlp_update");
          if (update) {
            set_remote_ver(update);
            set_status("ytdlp_outdated");
            return;
          }
        } catch {}
        await check_ffmpeg_step();
      } catch (e) {
        set_error(String(e));
        set_status("error");
      }
    })();
  }, []);

  async function handle_install_ytdlp() {
    set_status("installing_ytdlp");
    set_error(null);
    try {
      await invoke("install_ytdlp");
      await check_ffmpeg_step();
    } catch (e) {
      set_error(String(e));
      set_status("error");
    }
  }

  async function handle_update_ytdlp() {
    set_status("updating_ytdlp");
    set_error(null);
    try {
      await invoke("install_ytdlp");
      await check_ffmpeg_step();
    } catch (e) {
      set_error(String(e));
      set_status("error");
    }
  }

  async function handle_install_ffmpeg() {
    set_status("installing_ffmpeg");
    set_error(null);
    try {
      await invoke("install_ffmpeg");
      on_ready();
    } catch (e) {
      set_error(String(e));
      set_status("error");
    }
  }

  if (
    status === "checking_ytdlp" ||
    status === "checking_ffmpeg" ||
    status === "ready"
  )
    return null;

  let title = "";
  let body = "";
  let btn_label = "";
  let btn_action: (() => void) | null = null;
  let loading = false;

  if (status === "ytdlp_missing") {
    title = "yt-dlp Required";
    body =
      "yt-dlp is required for downloading and discovering music. It will be installed to your app data folder.";
    btn_label = "Install";
    btn_action = handle_install_ytdlp;
  } else if (status === "installing_ytdlp") {
    title = "Installing yt-dlp";
    body = "Downloading the latest version. This should only take a moment.";
    loading = true;
  } else if (status === "ytdlp_outdated") {
    title = "yt-dlp Update Required";
    body = `yt-dlp ${remote_ver} is available. You need to update before continuing.`;
    btn_label = "Update";
    btn_action = handle_update_ytdlp;
  } else if (status === "updating_ytdlp") {
    title = "Updating yt-dlp";
    body = "Downloading the latest version. This should only take a moment.";
    loading = true;
  } else if (status === "ffmpeg_missing") {
    title = "ffmpeg Required";
    body =
      "ffmpeg is required for audio processing and metadata embedding. It will be installed to your app data folder.";
    btn_label = "Install";
    btn_action = handle_install_ffmpeg;
  } else if (status === "installing_ffmpeg") {
    title = "Installing ffmpeg";
    body =
      "Downloading ffmpeg. This may take a minute as the download is larger.";
    loading = true;
  } else if (status === "error") {
    title = "Something went wrong";
    body = error ?? "Unknown error";
    btn_label = "Retry";
    btn_action = () => set_status("ytdlp_missing");
  }

  return (
    <div
      className="ytdlp-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        background: c.b35,
      }}
    >
      <div
        className="ytdlp-panel"
        style={{
          width: 440,
          padding: "32px 36px",
          borderRadius: 18,
          background: c.modal,
          border: `1px solid ${c.w08}`,
          boxShadow: `0 24px 80px ${c.b70}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 700, color: c.text }}>
            {title}
          </h2>
        </div>

        <p
          style={{
            fontSize: 14,
            color: c.w50,
            lineHeight: 1.6,
            ...(status === "error"
              ? { color: c.accent_70, wordBreak: "break-all" as const }
              : {}),
          }}
        >
          {body}
        </p>

        {loading && (
          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 24 }}
          >
            <div className="dot-bounce">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {btn_action && (
          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 24 }}
          >
            <button
              style={{
                padding: "10px 32px",
                borderRadius: 10,
                background: c.w10,
                color: c.text,
                fontSize: 14,
                fontWeight: 600,
                transition: "background 0.15s",
              }}
              onClick={btn_action}
              onMouseEnter={(e) => (e.currentTarget.style.background = c.w15)}
              onMouseLeave={(e) => (e.currentTarget.style.background = c.w10)}
            >
              {btn_label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
