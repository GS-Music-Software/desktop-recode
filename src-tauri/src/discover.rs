use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use tauri::{AppHandle, Emitter};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x08000000;

static COVER_CTR: AtomicU64 = AtomicU64::new(0);

fn enc(s: &str) -> String {
    s.chars().map(|c| match c {
        ' ' => '+'.to_string(),
        c if c.is_alphanumeric() || "-_.~".contains(c) => c.to_string(),
        c => format!("%{:02X}", c as u32),
    }).collect()
}

async fn dz_get<T: serde::de::DeserializeOwned>(url: &str) -> Result<T, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .user_agent("gs-music/1.0")
        .build()
        .map_err(|e| e.to_string())?;
    client.get(url).send().await
        .map_err(|e| e.to_string())?
        .json().await
        .map_err(|e| e.to_string())
}

#[derive(Serialize, Deserialize, Clone)]
pub struct DzTrack {
    pub id: u64,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub cover_url: String,
    pub duration: u64,
}

#[derive(Deserialize)]
struct RawArtistName { name: String }
#[derive(Deserialize)]
struct RawAlbumInfo { title: String, cover_medium: String }
#[derive(Deserialize)]
struct RawTrack { id: u64, title: String, artist: RawArtistName, album: RawAlbumInfo, duration: u64 }
#[derive(Deserialize)]
struct TrackSearchRes { data: Vec<RawTrack> }

#[tauri::command]
pub async fn search_tracks(q: String) -> Result<Vec<DzTrack>, String> {
    let url = format!("https://api.deezer.com/search/track?q={}&limit=25", enc(&q));
    let res: TrackSearchRes = dz_get(&url).await?;
    Ok(res.data.into_iter().map(|t| DzTrack {
        id: t.id,
        title: t.title,
        artist: t.artist.name,
        album: t.album.title,
        cover_url: t.album.cover_medium,
        duration: t.duration,
    }).collect())
}

#[derive(Serialize, Deserialize, Clone)]
pub struct DzAlbumResult {
    pub id: u64,
    pub title: String,
    pub artist: String,
    pub cover_url: String,
    pub nb_tracks: u32,
}

#[derive(Deserialize)]
struct RawAlbum {
    id: u64,
    title: String,
    #[serde(default)]
    cover_medium: String,
    #[serde(default)]
    nb_tracks: u32,
    #[serde(default)]
    artist: Option<RawArtistName>,
}
#[derive(Deserialize)]
struct AlbumSearchRes { data: Vec<RawAlbum> }

#[tauri::command]
pub async fn search_albums(q: String) -> Result<Vec<DzAlbumResult>, String> {
    let url = format!("https://api.deezer.com/search/album?q={}&limit=25", enc(&q));
    let res: AlbumSearchRes = dz_get(&url).await?;
    Ok(res.data.into_iter().map(|a| DzAlbumResult {
        id: a.id,
        title: a.title,
        artist: a.artist.map_or(String::new(), |ar| ar.name),
        cover_url: a.cover_medium,
        nb_tracks: a.nb_tracks,
    }).collect())
}

#[derive(Serialize, Deserialize, Clone)]
pub struct DzArtistResult {
    pub id: u64,
    pub name: String,
    pub nb_album: u32,
    pub picture_url: String,
}

#[derive(Deserialize)]
struct RawArtist {
    id: u64,
    name: String,
    #[serde(default)]
    nb_album: u32,
    #[serde(default)]
    picture_medium: String,
}
#[derive(Deserialize)]
struct ArtistSearchRes { data: Vec<RawArtist> }

#[tauri::command]
pub async fn search_artists(q: String) -> Result<Vec<DzArtistResult>, String> {
    let url = format!("https://api.deezer.com/search/artist?q={}&limit=25", enc(&q));
    let res: ArtistSearchRes = dz_get(&url).await?;
    Ok(res.data.into_iter().map(|a| DzArtistResult {
        id: a.id,
        name: a.name,
        nb_album: a.nb_album,
        picture_url: a.picture_medium,
    }).collect())
}

#[derive(Deserialize)]
struct RawAlbumTrack { id: u64, title: String, artist: RawArtistName, duration: u64 }
#[derive(Deserialize)]
struct AlbumTracksRes { data: Vec<RawAlbumTrack> }

#[tauri::command]
pub async fn get_album_tracks(album_id: u64, album_title: String, album_artist: String, cover_url: String) -> Result<Vec<DzTrack>, String> {
    let url = format!("https://api.deezer.com/album/{}/tracks?limit=100", album_id);
    let res: AlbumTracksRes = dz_get(&url).await?;
    Ok(res.data.into_iter().map(|t| DzTrack {
        id: t.id,
        title: t.title,
        artist: t.artist.name,
        album: album_title.clone(),
        cover_url: cover_url.clone(),
        duration: t.duration,
    }).collect())
}

#[tauri::command]
pub async fn get_artist_albums(artist_id: u64) -> Result<Vec<DzAlbumResult>, String> {
    let url = format!("https://api.deezer.com/artist/{}/albums?limit=100", artist_id);
    let res: AlbumSearchRes = dz_get(&url).await?;
    Ok(res.data.into_iter().map(|a| DzAlbumResult {
        id: a.id,
        title: a.title,
        artist: a.artist.map_or(String::new(), |ar| ar.name),
        cover_url: a.cover_medium,
        nb_tracks: a.nb_tracks,
    }).collect())
}

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

    // attempt #1 to try to fix this shit....
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

#[derive(Serialize, Clone)]
pub struct YtTrack {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration: f64,
    pub cover_url: String,
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
            return Some((t.album.cover_medium, t.album.title));
        }
    }
    let q2 = format!("{} {}", parsed_artist, song);
    let url2 = format!("https://api.deezer.com/search/track?q={}&limit=3", enc(&q2));
    if let Ok(res) = dz_get::<TrackSearchRes>(&url2).await {
        if let Some(t) = res.data.into_iter().next() {
            return Some((t.album.cover_medium, t.album.title));
        }
    }
    let q3 = format!("{}", song);
    let url3 = format!("https://api.deezer.com/search/track?q={}&limit=3", enc(&q3));
    if let Ok(res) = dz_get::<TrackSearchRes>(&url3).await {
        if let Some(t) = res.data.into_iter().next() {
            return Some((t.album.cover_medium, t.album.title));
        }
    }
    None
}

#[derive(Serialize, Clone)]
pub struct YtImportProgress {
    pub phase: String,
    pub done: usize,
    pub total: usize,
    pub title: String,
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
        let (cover_url, album) = match dz_lookup(&artist, &raw_title).await {
            Some((c, a)) => (c, a),
            None => (yt_thumb, String::new()),
        };
        tracks.push(YtTrack {
            title: display_title,
            artist,
            album,
            duration: json.duration.unwrap_or(0.0),
            cover_url,
        });
    }

    let name = if pl_name.is_empty() { fallback_name } else { pl_name };
    Ok(YtPlaylistResult { name, tracks })
}
