use crate::types::TrackMeta;
use base64::{Engine as _, engine::general_purpose::STANDARD as B64};
use lofty::file::AudioFile;
use lofty::prelude::*;
use lofty::probe::Probe;
use std::path::Path;
use walkdir::WalkDir;

#[tauri::command]
pub fn stream_file(path: String) -> Result<String, String> {
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    let ext = Path::new(&path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("mp3")
        .to_lowercase();
    let mime = match ext.as_str() {
        "mp3" => "audio/mpeg",
        "flac" => "audio/flac",
        "ogg" | "opus" => "audio/ogg",
        "m4a" | "aac" => "audio/mp4",
        "wav" => "audio/wav",
        _ => "audio/mpeg",
    };
    Ok(format!("data:{};base64,{}", mime, B64.encode(&bytes)))
}

const EXTS: &[&str] = &["mp3", "flac", "ogg", "m4a", "wav", "opus", "aac", "wma"];

fn is_audio(p: &Path) -> bool {
    p.extension()
        .and_then(|e| e.to_str())
        .map(|e| EXTS.contains(&e.to_lowercase().as_str()))
        .unwrap_or(false)
}

fn rd_meta(p: &Path) -> Option<TrackMeta> {
    let tagged = Probe::open(p).ok()?.read().ok()?;
    let tag = tagged.primary_tag().or_else(|| tagged.first_tag())?;
    let dur = tagged.properties().duration().as_secs_f64();
    let fname = p.file_stem()?.to_string_lossy().to_string();

    Some(TrackMeta {
        path: p.to_string_lossy().to_string(),
        title: tag.title().map(|s| s.to_string()).unwrap_or(fname),
        artist: tag.artist().map(|s| s.to_string()).unwrap_or_else(|| "Unknown".into()),
        album: tag.album().map(|s| s.to_string()).unwrap_or_else(|| "Unknown".into()),
        duration: dur,
        track_no: tag.track().unwrap_or(0),
        year: tag.year(),
        cover: None,
    })
}

#[tauri::command]
pub fn scan_dir(path: String) -> Vec<TrackMeta> {
    let mut tracks: Vec<TrackMeta> = WalkDir::new(&path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file() && is_audio(e.path()))
        .filter_map(|e| rd_meta(e.path()))
        .collect();

    tracks.sort_by(|a, b| {
        a.artist
            .cmp(&b.artist)
            .then(a.album.cmp(&b.album))
            .then(a.track_no.cmp(&b.track_no))
    });

    tracks
}

#[derive(serde::Serialize)]
pub struct LyricLine {
    pub time: f64,
    pub text: String,
}

fn is_credit(text: &str) -> bool {
    let t = text.trim();
    let prefixes = ["作词", "作曲", "编曲", "制作", "混音", "母带", "录音", "监制",
                    "词：", "曲：", "词:", "曲:", "演唱", "原唱", "翻唱", "和声",
                    "Lyricist", "Composer", "Arranger", "Producer", "Mixing",
                    "Written by", "Produced by", "Mixed by", "Arranged by",
                    "Mastered by", "Recording by"];
    for p in prefixes {
        if t.starts_with(p) { return true; }
    }
    if t.contains("：") || t.contains(":") {
        let before = t.split(&['：', ':'][..]).next().unwrap_or("");
        let b = before.trim();
        if !b.is_empty() && b.len() <= 12 && !b.chars().any(|c| c == ' ' && b.len() > 6) {
            if b.chars().all(|c| c.is_alphabetic() || c == ' ' || c == '-') {
                return false;
            }
            let has_cjk = b.chars().any(|c| ('\u{4e00}'..='\u{9fff}').contains(&c));
            if has_cjk && b.chars().count() <= 4 { return true; }
        }
    }
    false
}

fn parse_lrc(lrc: &str) -> Vec<LyricLine> {
    let mut lines: Vec<LyricLine> = lrc
        .lines()
        .filter_map(|raw| {
            let m = regex_lrc(raw)?;
            if is_credit(&m.1) { return None; }
            Some(LyricLine { time: m.0, text: m.1 })
        })
        .collect();
    lines.sort_by(|a, b| a.time.partial_cmp(&b.time).unwrap_or(std::cmp::Ordering::Equal));
    lines
}

fn regex_lrc(raw: &str) -> Option<(f64, String)> {
    let raw = raw.trim();
    if !raw.starts_with('[') { return None; }
    let end = raw.find(']')?;
    let tag = &raw[1..end];
    let text = raw[end + 1..].trim();
    if text.is_empty() { return None; }
    let colon = tag.find(':')?;
    let mins: f64 = tag[..colon].parse().ok()?;
    let secs: f64 = tag[colon + 1..].parse().ok()?;
    Some((mins * 60.0 + secs, text.to_string()))
}

fn clean(s: &str) -> String {
    s.to_lowercase()
        .chars()
        .filter(|c| c.is_alphanumeric() || c.is_whitespace())
        .collect::<String>()
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn mk_client(timeout_secs: u64) -> Option<reqwest::Client> {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(timeout_secs))
        .user_agent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .ok()
}


async fn netease_search(client: &reqwest::Client, artist: &str, title: &str) -> Option<Vec<LyricLine>> {
    #[derive(serde::Deserialize)]
    struct NeSong { id: u64 }
    #[derive(serde::Deserialize)]
    struct NeResult { songs: Option<Vec<NeSong>> }
    #[derive(serde::Deserialize)]
    struct NeResp { result: Option<NeResult> }

    let q = format!("{} {}", artist, title);
    let search_url = format!(
        "http://music.163.com/api/search/get?s={}&type=1&limit=5&offset=0",
        urlencoding::encode(&q)
    );
    let resp = client.get(&search_url)
        .header("Referer", "http://music.163.com/")
        .send().await.ok()?;
    let body: NeResp = resp.json().await.ok()?;
    let id = body.result?.songs?.into_iter().next()?.id;

    #[derive(serde::Deserialize)]
    struct NeLyric { lyric: Option<String> }
    #[derive(serde::Deserialize)]
    struct NeLyricResp { lrc: Option<NeLyric> }

    let lyric_url = format!("http://music.163.com/api/song/lyric?id={}&lv=1&kv=1&tv=-1", id);
    let lresp = client.get(&lyric_url)
        .header("Referer", "http://music.163.com/")
        .send().await.ok()?;
    let lbody: NeLyricResp = lresp.json().await.ok()?;
    let lrc = lbody.lrc?.lyric?;
    let lines = parse_lrc(&lrc);
    if lines.is_empty() { return None; }
    Some(lines)
}


async fn lrclib_get(client: &reqwest::Client, artist: &str, title: &str, duration: f64) -> Option<Vec<LyricLine>> {
    #[derive(serde::Deserialize)]
    struct Resp {
        #[serde(rename = "syncedLyrics")] synced_lyrics: Option<String>,
        #[serde(rename = "plainLyrics")]  plain_lyrics:  Option<String>,
    }
    let url = format!(
        "https://lrclib.net/api/get?artist_name={}&track_name={}&duration={}",
        urlencoding::encode(artist), urlencoding::encode(title), duration.round() as u64
    );
    let resp = client.get(&url).send().await.ok()?;
    if !resp.status().is_success() { return None; }
    let body: Resp = resp.json().await.ok()?;
    if let Some(lrc) = body.synced_lyrics {
        let lines = parse_lrc(&lrc);
        if !lines.is_empty() { return Some(lines); }
    }
    if let Some(plain) = body.plain_lyrics {
        let lines: Vec<LyricLine> = plain.lines()
            .filter(|l| !l.trim().is_empty())
            .enumerate()
            .map(|(i, l)| LyricLine { time: i as f64 * 3.0, text: l.to_string() })
            .collect();
        if !lines.is_empty() { return Some(lines); }
    }
    None
}


async fn lyricsovh(client: &reqwest::Client, artist: &str, title: &str) -> Option<Vec<LyricLine>> {
    #[derive(serde::Deserialize)]
    struct Resp { lyrics: Option<String> }
    let url = format!("https://api.lyrics.ovh/v1/{}/{}", urlencoding::encode(artist), urlencoding::encode(title));
    let resp = client.get(&url).send().await.ok()?;
    if !resp.status().is_success() { return None; }
    let body: Resp = resp.json().await.ok()?;
    let plain = body.lyrics?;
    let lines: Vec<LyricLine> = plain.lines()
        .filter(|l| !l.trim().is_empty())
        .enumerate()
        .map(|(i, l)| LyricLine { time: i as f64 * 3.0, text: l.to_string() })
        .collect();
    if lines.is_empty() { return None; }
    Some(lines)
}

#[tauri::command]
pub async fn fetch_lyrics(artist: String, title: String, _album: String, duration: f64) -> Option<Vec<LyricLine>> {
    let c = mk_client(5)?;

    let a1 = artist.clone(); let t1 = title.clone(); let c1 = c.clone();
    let a2 = artist.clone(); let t2 = title.clone(); let c2 = c.clone();
    let a3 = artist.clone(); let t3 = title.clone(); let c3 = c.clone();

    let (ne, lrc, ovh) = tokio::join!(
        tokio::spawn(async move { netease_search(&c1, &a1, &t1).await }),
        tokio::spawn(async move { lrclib_get(&c2, &a2, &t2, duration).await }),
        tokio::spawn(async move { lyricsovh(&c3, &a3, &t3).await }),
    );


    if let Ok(Some(lines)) = ne  { return Some(lines); }
    if let Ok(Some(lines)) = lrc { return Some(lines); }
    if let Ok(Some(lines)) = ovh { return Some(lines); }
    None
}

#[tauri::command]
pub fn get_cover(path: String) -> Option<String> {
    let p = Path::new(&path);
    let tagged = Probe::open(p).ok()?.read().ok()?;
    let tag = tagged.primary_tag().or_else(|| tagged.first_tag())?;
    let pic = tag.pictures().first()?;
    let mime = pic.mime_type().map(|m| m.to_string()).unwrap_or_else(|| "image/jpeg".into());
    Some(format!("data:{};base64,{}", mime, B64.encode(pic.data())))
}
