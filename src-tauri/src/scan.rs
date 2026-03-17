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
        "webm" => "audio/webm",
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


#[tauri::command]
pub fn get_cover(path: String) -> Option<String> {
    let p = Path::new(&path);
    let tagged = Probe::open(p).ok()?.read().ok()?;
    let tag = tagged.primary_tag().or_else(|| tagged.first_tag())?;
    let pic = tag.pictures().first()?;
    let mime = pic.mime_type().map(|m| m.to_string()).unwrap_or_else(|| "image/jpeg".into());
    Some(format!("data:{};base64,{}", mime, B64.encode(pic.data())))
}
