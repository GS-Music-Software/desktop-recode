use serde::Deserialize;
use std::fs;
use std::path::PathBuf;
use tokio::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

const RELEASE: &str = "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest";

#[derive(Deserialize)]
struct Release { tag_name: String, assets: Vec<Asset> }

#[derive(Deserialize)]
struct Asset { name: String, browser_download_url: String }

pub fn data_dir() -> PathBuf {
    dirs::data_dir()
        .unwrap_or_default()
        .join("music-downloader")
}

pub fn ytdlp_path() -> PathBuf {
    let name = if cfg!(target_os = "windows") { "yt-dlp.exe" } else { "yt-dlp" };
    data_dir().join(name)
}

pub fn ytdlp_bin() -> String {
    ytdlp_path().to_string_lossy().to_string()
}

pub fn ffmpeg_path() -> PathBuf {
    let name = if cfg!(target_os = "windows") { "ffmpeg.exe" } else { "ffmpeg" };
    data_dir().join(name)
}

pub fn ffmpeg_bin() -> String {
    let bundled = ffmpeg_path();
    if bundled.exists() {
        return bundled.to_string_lossy().to_string();
    }
    "ffmpeg".to_string()
}

#[tauri::command]
pub async fn check_ytdlp() -> bool {
    let path = ytdlp_path();
    if !path.exists() {
        return false;
    }
    let mut cmd = Command::new(ytdlp_bin());
    cmd.arg("--version");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd.output().await
        .map(|o| o.status.success())
        .unwrap_or(false)
}

#[tauri::command]
pub async fn install_ytdlp() -> Result<(), String> {
    let client = reqwest::Client::builder()
        .user_agent("gs-music")
        .build().map_err(|e| format!("client: {e}"))?;

    let rel: Release = client.get(RELEASE)
        .send().await.map_err(|e| format!("req: {e}"))?
        .json().await.map_err(|e| format!("parse: {e}"))?;

    let name = if cfg!(target_os = "windows") { "yt-dlp.exe" } else { "yt-dlp_linux" };
    let asset = rel.assets.iter().find(|a| a.name == name)
        .ok_or_else(|| format!("{name} not in release"))?;

    let bytes = client.get(&asset.browser_download_url)
        .send().await.map_err(|e| format!("dl: {e}"))?
        .bytes().await.map_err(|e| format!("read: {e}"))?;

    let path = ytdlp_path();
    fs::create_dir_all(data_dir()).map_err(|e| format!("mkdir: {e}"))?;
    fs::write(&path, &bytes).map_err(|e| format!("write: {e}"))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&path, fs::Permissions::from_mode(0o755))
            .map_err(|e| format!("chmod: {e}"))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn check_ytdlp_update() -> Result<Option<String>, String> {
    let path = ytdlp_path();
    if !path.exists() {
        return Ok(None);
    }

    let mut cmd = Command::new(ytdlp_bin());
    cmd.arg("--version");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    let out = cmd.output().await
        .map_err(|e| format!("version: {e}"))?;
    let local = String::from_utf8_lossy(&out.stdout).trim().to_string();
    if local.is_empty() {
        return Err("could not read local version".into());
    }

    let client = reqwest::Client::builder()
        .user_agent("gs-music")
        .build().map_err(|e| format!("client: {e}"))?;

    let rel: Release = client.get(RELEASE)
        .send().await.map_err(|e| format!("req: {e}"))?
        .json().await.map_err(|e| format!("parse: {e}"))?;

    let remote = rel.tag_name.trim().to_string();
    if remote != local {
        Ok(Some(remote))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub async fn check_ffmpeg() -> bool {
    let bundled = ffmpeg_path();
    if bundled.exists() {
        let mut cmd = Command::new(bundled);
        cmd.arg("-version");
        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);
        return cmd.output().await.map(|o| o.status.success()).unwrap_or(false);
    }
    let mut cmd = Command::new("ffmpeg");
    cmd.arg("-version");
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd.output().await.map(|o| o.status.success()).unwrap_or(false)
}

const FFMPEG_WIN_URL: &str = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip";

#[tauri::command]
pub async fn install_ffmpeg() -> Result<(), String> {
    if cfg!(not(target_os = "windows")) {
        return Err("auto-install only supported on Windows — install ffmpeg via your package manager".into());
    }

    let client = reqwest::Client::builder()
        .user_agent("gs-music")
        .build().map_err(|e| format!("client: {e}"))?;

    let bytes = client.get(FFMPEG_WIN_URL)
        .send().await.map_err(|e| format!("dl: {e}"))?
        .bytes().await.map_err(|e| format!("read: {e}"))?;

    let cursor = std::io::Cursor::new(&bytes);
    let mut archive = zip::ZipArchive::new(cursor).map_err(|e| format!("zip: {e}"))?;

    let ffmpeg_entry = archive.file_names()
        .find(|n| n.ends_with("bin/ffmpeg.exe"))
        .map(|s| s.to_string())
        .ok_or_else(|| "ffmpeg.exe not found in archive".to_string())?;

    let mut entry = archive.by_name(&ffmpeg_entry).map_err(|e| format!("entry: {e}"))?;
    let path = ffmpeg_path();
    fs::create_dir_all(data_dir()).map_err(|e| format!("mkdir: {e}"))?;
    let mut out = fs::File::create(&path).map_err(|e| format!("create: {e}"))?;
    std::io::copy(&mut entry, &mut out).map_err(|e| format!("extract: {e}"))?;

    Ok(())
}
