use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use super::util::{enc, dz_get};
use super::types::TrackSearchRes;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
#[cfg(target_os = "windows")]
use super::util::CREATE_NO_WINDOW;

#[derive(Serialize, Clone)]
pub struct YtTrack {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration: f64,
    pub cover_url: String,
    pub url: Option<String>,
    pub metadata_found: bool,
}

#[derive(Serialize, Clone)]
pub struct YtPlaylistResult {
    pub name: String,
    pub tracks: Vec<YtTrack>,
}

#[derive(Deserialize)]
struct YtJson {
    #[serde(default)]
    title: Option<String>,
    #[serde(default)]
    uploader: Option<String>,
    #[serde(default)]
    channel: Option<String>,
    #[serde(default)]
    duration: Option<f64>,
    #[serde(default)]
    thumbnail: Option<String>,
    #[serde(default)]
    thumbnails: Option<Vec<YtThumb>>,
    #[serde(default)]
    playlist_title: Option<String>,
}

#[derive(Deserialize)]
struct YtThumb {
    #[serde(default)]
    url: String,
}

#[derive(Serialize, Clone)]
pub struct YtImportProgress {
    pub phase: String,
    pub done: usize,
    pub total: usize,
    pub title: String,
}

fn ytdlp_bin() -> String {
    crate::ytdlp_setup::ytdlp_bin()
}

fn clean_artist(raw: &str) -> String {
    let s = raw.trim();
    let s = s.strip_suffix(" - Topic").unwrap_or(s);
    s.trim().to_string()
}

fn best_thumb(json: &YtJson) -> String {
    if let Some(t) = &json.thumbnail {
        if !t.is_empty() { return t.clone(); }
    }
    if let Some(thumbs) = &json.thumbnails {
        if let Some(last) = thumbs.last() {
            return last.url.clone();
        }
    }
    String::new()
}

fn strip_brackets(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut depth_sq = 0i32;
    let mut depth_rn = 0i32;
    for c in s.chars() {
        match c {
            '[' => depth_sq += 1,
            ']' => { depth_sq = (depth_sq - 1).max(0); continue; }
            '(' => depth_rn += 1,
            ')' => { depth_rn = (depth_rn - 1).max(0); continue; }
            _ if depth_sq > 0 || depth_rn > 0 => continue,
            _ => out.push(c),
        }
    }
    out.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn parse_yt_title(raw: &str, yt_artist: &str) -> (String, String) {
    let stripped = strip_brackets(raw);
    let parts: Vec<&str> = if stripped.contains(" - ") {
        stripped.splitn(2, " - ").collect()
    } else if stripped.contains(" – ") {
        stripped.splitn(2, " – ").collect()
    } else {
        return (stripped.trim().to_string(), yt_artist.to_string());
    };
    let left = parts[0].trim().to_string();
    let right = parts[1].trim().to_string();
    let right_clean = right
        .replace("ft.", "").replace("feat.", "")
        .replace("Ft.", "").replace("Feat.", "")
        .split_whitespace().collect::<Vec<_>>().join(" ");
    (right_clean, left)
}

async fn dz_lookup(artist: &str, title: &str) -> Option<(String, String)> {
    let (song, parsed_artist) = parse_yt_title(title, artist);
    let q1 = format!("artist:\"{}\" track:\"{}\"", parsed_artist, song);
    let url1 = format!("https://api.deezer.com/search/track?q={}&limit=3", enc(&q1));
    if let Ok(res) = dz_get::<TrackSearchRes>(&url1).await {
        if let Some(t) = res.data.into_iter().next() {
            let cover = if t.album.cover_xl.is_empty() { t.album.cover_medium } else { t.album.cover_xl };
            return Some((cover, t.album.title));
        }
    }
    let q2 = format!("{} {}", parsed_artist, song);
    let url2 = format!("https://api.deezer.com/search/track?q={}&limit=3", enc(&q2));
    if let Ok(res) = dz_get::<TrackSearchRes>(&url2).await {
        if let Some(t) = res.data.into_iter().next() {
            let cover = if t.album.cover_xl.is_empty() { t.album.cover_medium } else { t.album.cover_xl };
            return Some((cover, t.album.title));
        }
    }
    let q3 = song.to_string();
    let url3 = format!("https://api.deezer.com/search/track?q={}&limit=3", enc(&q3));
    if let Ok(res) = dz_get::<TrackSearchRes>(&url3).await {
        if let Some(t) = res.data.into_iter().next() {
            let cover = if t.album.cover_xl.is_empty() { t.album.cover_medium } else { t.album.cover_xl };
            return Some((cover, t.album.title));
        }
    }
    None
}

#[tauri::command]
pub async fn lookup_cover(artist: String, title: String) -> Option<String> {
    dz_lookup(&artist, &title).await.map(|(cover, _)| cover)
}

#[tauri::command]
pub async fn yt_playlist_tracks(app: AppHandle, url: String) -> Result<YtPlaylistResult, String> {
    let _ = app.emit("yt_import_progress", YtImportProgress {
        phase: "fetching".into(), done: 0, total: 0, title: String::new(),
    });

    let mut cmd = tokio::process::Command::new(ytdlp_bin());
    cmd.args(["--flat-playlist", "--dump-single-json", "--no-warnings"])
        .arg(&url);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    let pl_out = cmd.output().await
        .map_err(|e| format!("yt-dlp: {e}"))?;

    let pl_name = if pl_out.status.success() {
        let pl_json: serde_json::Value = serde_json::from_slice(&pl_out.stdout).unwrap_or_default();
        pl_json.get("title")
            .or_else(|| pl_json.get("playlist_title"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string()
    } else {
        String::new()
    };

    let mut cmd2 = tokio::process::Command::new(ytdlp_bin());
    cmd2.args(["--flat-playlist", "--dump-json", "--no-warnings"])
        .arg(&url);
    #[cfg(target_os = "windows")]
    cmd2.creation_flags(CREATE_NO_WINDOW);
    let out = cmd2.output().await
        .map_err(|e| format!("yt-dlp: {e}"))?;

    if !out.status.success() {
        let err = String::from_utf8_lossy(&out.stderr);
        return Err(format!("yt-dlp failed: {err}"));
    }

    let stdout = String::from_utf8_lossy(&out.stdout);
    let raw_lines: Vec<&str> = stdout.lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty())
        .collect();
    let total = raw_lines.len();

    let _ = app.emit("yt_import_progress", YtImportProgress {
        phase: "covers".into(), done: 0, total, title: String::new(),
    });

    let mut tracks = Vec::new();
    let mut fallback_name = String::new();

    for (i, line) in raw_lines.iter().enumerate() {
        let json: YtJson = match serde_json::from_str(line) {
            Ok(j) => j,
            Err(_) => continue,
        };
        if fallback_name.is_empty() {
            if let Some(ref pt) = json.playlist_title {
                fallback_name = pt.clone();
            }
        }
        let raw_title = json.title.clone().unwrap_or_default();
        if raw_title.is_empty() { continue; }
        let yt_artist = json.uploader.as_deref()
            .or(json.channel.as_deref())
            .map(clean_artist)
            .unwrap_or_default();
        let (song, parsed_artist) = parse_yt_title(&raw_title, &yt_artist);
        let display_title = if song.is_empty() { strip_brackets(&raw_title) } else { song.clone() };
        let artist = if parsed_artist.is_empty() { yt_artist } else { parsed_artist };

        let _ = app.emit("yt_import_progress", YtImportProgress {
            phase: "covers".into(), done: i + 1, total, title: display_title.clone(),
        });

        let yt_thumb = best_thumb(&json);
        let dz = dz_lookup(&artist, &raw_title).await;
        let metadata_found = dz.is_some();
        let (cover_url, album) = dz.unwrap_or_else(|| (yt_thumb, String::new()));
        tracks.push(YtTrack {
            title: display_title,
            artist,
            album,
            duration: json.duration.unwrap_or(0.0),
            cover_url,
            url: None,
            metadata_found,
        });
    }

    let name = if pl_name.is_empty() { fallback_name } else { pl_name };
    Ok(YtPlaylistResult { name, tracks })
}

#[tauri::command]
pub async fn yt_link_tracks(app: AppHandle, urls: Vec<String>) -> Result<YtPlaylistResult, String> {
    let total = urls.len();
    let _ = app.emit("yt_import_progress", YtImportProgress {
        phase: "fetching".into(), done: 0, total, title: String::new(),
    });

    let mut tracks = Vec::new();
    let bin = ytdlp_bin();

    for (i, url) in urls.iter().enumerate() {
        let trimmed = url.trim();
        if trimmed.is_empty() { continue; }

        let mut cmd = tokio::process::Command::new(&bin);
        cmd.args(["--dump-json", "--no-warnings", "--no-playlist"])
            .arg(trimmed);
        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);
        let out = cmd.output().await;

        let out = match out {
            Ok(o) if o.status.success() => o,
            _ => {
                let _ = app.emit("yt_import_progress", YtImportProgress {
                    phase: "covers".into(), done: i + 1, total, title: format!("Failed: {}", trimmed),
                });
                continue;
            }
        };

        let stdout = String::from_utf8_lossy(&out.stdout);
        let json: YtJson = match serde_json::from_str(stdout.trim()) {
            Ok(j) => j,
            Err(_) => continue,
        };

        let raw_title = json.title.clone().unwrap_or_default();
        if raw_title.is_empty() { continue; }
        let yt_artist = json.uploader.as_deref()
            .or(json.channel.as_deref())
            .map(clean_artist)
            .unwrap_or_default();
        let (song, parsed_artist) = parse_yt_title(&raw_title, &yt_artist);
        let display_title = if song.is_empty() { strip_brackets(&raw_title) } else { song.clone() };
        let artist = if parsed_artist.is_empty() { yt_artist } else { parsed_artist };

        let _ = app.emit("yt_import_progress", YtImportProgress {
            phase: "covers".into(), done: i + 1, total, title: display_title.clone(),
        });

        let yt_thumb = best_thumb(&json);
        let dz = dz_lookup(&artist, &raw_title).await;
        let metadata_found = dz.is_some();
        let (cover_url, album) = dz.unwrap_or_else(|| (yt_thumb, String::new()));
        tracks.push(YtTrack {
            title: display_title,
            artist,
            album,
            duration: json.duration.unwrap_or(0.0),
            cover_url,
            url: Some(trimmed.to_string()),
            metadata_found,
        });
    }

    Ok(YtPlaylistResult { name: String::new(), tracks })
}
