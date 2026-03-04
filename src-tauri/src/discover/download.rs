use serde::Serialize;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use tauri::{AppHandle, Emitter};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
#[cfg(target_os = "windows")]
use super::util::CREATE_NO_WINDOW;

static COVER_CTR: AtomicU64 = AtomicU64::new(0);

#[derive(Serialize, Clone)]
pub struct DlProgress { pub id: u64, pub pct: f64 }

#[derive(Serialize, Clone)]
pub struct DlDone { pub id: u64, pub path: Option<String>, pub err: Option<String> }

fn ytdlp_bin() -> String {
    crate::ytdlp_setup::ytdlp_bin()
}

fn ffmpeg_bin() -> String {
    crate::ytdlp_setup::ffmpeg_bin()
}

#[tauri::command]
pub async fn download_track(app: AppHandle, id: u64, artist: String, title: String, album: String, cover_url: String, duration: u64, save_dir: Option<String>) -> Result<(), String> {
    let query = format!("ytsearch5:{} - {} audio", artist, title);
    let base = save_dir
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|| dirs::audio_dir()
            .unwrap_or_else(|| dirs::home_dir().unwrap_or_default().join("Music")));
    let out_dir = base.join(format!("{} - {}", artist, album));
    std::fs::create_dir_all(&out_dir).map_err(|e| e.to_string())?;
    let tpl = out_dir.join("%(title)s.%(ext)s").to_string_lossy().to_string();

    let mut cmd = tokio::process::Command::new(ytdlp_bin());
    cmd.args([
            "-x",
            "--audio-format", "mp3",
            "--audio-quality", "0",
            "--no-embed-metadata",
            "--no-embed-thumbnail",
            "--no-warnings",
            "--no-playlist",
            "--playlist-items", "1",
            "--newline",
            "--progress",
            "--print", "after_move:filepath",
            "-o", &tpl,
        ]);
    if duration > 0 {
        let min = (duration as f64 * 0.7) as u64;
        let max = duration + 30;
        cmd.args(["--match-filter", &format!("duration>={} & duration<={}", min, max)]);
    }
    cmd.arg(&query)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null());
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    let mut child = cmd.spawn()
        .map_err(|e| format!("yt-dlp not found: {}", e))?;

    use tokio::io::{AsyncBufReadExt, BufReader};
    let stdout = child.stdout.take().unwrap();
    let mut lines = BufReader::new(stdout).lines();
    let mut mp3_path: Option<PathBuf> = None;

    while let Ok(Some(line)) = lines.next_line().await {
        if line.contains("[download]") {
            if let Some(pct) = parse_pct(&line) {
                let _ = app.emit("dl_progress", DlProgress { id, pct: pct * 0.9 });
            }
        } else {
            let trimmed = line.trim();
            if trimmed.ends_with(".mp3") && Path::new(trimmed).exists() {
                mp3_path = Some(PathBuf::from(trimmed));
            }
        }
    }

    let status = child.wait().await.map_err(|e| e.to_string())?;
    if !status.success() {
        let _ = app.emit("dl_done", DlDone { id, path: None, err: Some("yt-dlp failed".into()) });
        return Ok(());
    }

    let mp3 = match mp3_path {
        Some(p) => p,
        None => {
            let _ = app.emit("dl_done", DlDone { id, path: None, err: Some("mp3 not found".into()) });
            return Ok(());
        }
    };

    let _ = app.emit("dl_progress", DlProgress { id, pct: 92.0 });

    let cover_tmp = fetch_cover_tmp(&cover_url).await;
    embed_meta(&mp3, &artist, &title, &album, cover_tmp.as_deref()).await?;

    let final_path = out_dir.join(format!("{} - {}.mp3", artist, title));
    if final_path != mp3 {
        std::fs::rename(&mp3, &final_path).map_err(|e| format!("final rename: {e}"))?;
    }

    for _ in 0..10 {
        if let Ok(f) = std::fs::File::open(&final_path) {
            drop(f);
            if lofty::probe::Probe::open(&final_path).and_then(|p| p.read()).is_ok() {
                break;
            }
        }
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    }

    let _ = app.emit("dl_progress", DlProgress { id, pct: 100.0 });
    let _ = app.emit("dl_done", DlDone { id, path: Some(final_path.to_string_lossy().to_string()), err: None });
    Ok(())
}

async fn fetch_cover_tmp(url: &str) -> Option<PathBuf> {
    if url.is_empty() { return None; }
    let data = reqwest::get(url).await.ok()?.bytes().await.ok()?;
    let n = COVER_CTR.fetch_add(1, Ordering::Relaxed);
    let path = std::env::temp_dir().join(format!("gs_cover_{}_{n}.jpg", std::process::id()));
    std::fs::write(&path, &data).ok()?;
    Some(path)
}

async fn embed_meta(mp3: &Path, artist: &str, title: &str, album: &str, cover: Option<&Path>) -> Result<(), String> {
    let tmp = mp3.with_extension("tmp.mp3");

    let mut args: Vec<String> = vec![
        "-y".into(), "-i".into(), mp3.to_string_lossy().into(),
    ];

    if let Some(c) = cover {
        args.extend(["-i".into(), c.to_string_lossy().into()]);
        args.extend(["-map".into(), "0:a".into(), "-map".into(), "1:0".into()]);
    } else {
        args.extend(["-map".into(), "0:a".into()]);
    }

    args.extend(["-c".into(), "copy".into(), "-id3v2_version".into(), "3".into()]);
    args.extend(["-metadata".into(), format!("title={}", title)]);
    args.extend(["-metadata".into(), format!("artist={}", artist)]);
    args.extend(["-metadata".into(), format!("album={}", album)]);

    if cover.is_some() {
        args.extend(["-metadata:s:v".into(), "title=Album cover".into()]);
        args.extend(["-metadata:s:v".into(), "comment=Cover (front)".into()]);
    }

    args.push(tmp.to_string_lossy().into());

    let mut cmd = tokio::process::Command::new(ffmpeg_bin());
    cmd.args(&args);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    let out = match cmd.output().await {
        Ok(o) => o,
        Err(_) => {
            if let Some(c) = cover { let _ = std::fs::remove_file(c); }
            return Ok(());
        }
    };

    if let Some(c) = cover { let _ = std::fs::remove_file(c); }

    if !out.status.success() {
        let _ = std::fs::remove_file(&tmp);
        return Ok(());
    }

    std::fs::rename(&tmp, mp3).map_err(|e| format!("rename: {e}"))
}

fn parse_pct(line: &str) -> Option<f64> {
    let s = line.find('%')?;
    let chunk = &line[..s];
    let start = chunk.rfind(|c: char| c == ' ' || c == '[').unwrap_or(0) + 1;
    chunk[start..].trim().parse().ok()
}
