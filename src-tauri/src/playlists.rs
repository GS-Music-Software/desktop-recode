use base64::{engine::general_purpose::STANDARD as B64, Engine};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone)]
pub struct Playlist {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub cover: Option<String>,
    pub tracks: Vec<String>,
}

pub(crate) fn pl_dir() -> PathBuf {
    let d = dirs::data_dir()
        .unwrap_or_else(|| dirs::home_dir().unwrap_or_default().join(".local/share"))
        .join("gs-music")
        .join("playlists");
    let _ = fs::create_dir_all(&d);
    d
}

pub(crate) fn pl_path(id: &str) -> PathBuf {
    pl_dir().join(format!("{id}.json"))
}

pub(crate) fn read_pl(id: &str) -> Result<Playlist, String> {
    let p = pl_path(id);
    let data = fs::read_to_string(&p).map_err(|e| format!("read: {e}"))?;
    serde_json::from_str(&data).map_err(|e| format!("parse: {e}"))
}

pub(crate) fn write_pl(pl: &Playlist) -> Result<(), String> {
    let p = pl_path(&pl.id);
    let data = serde_json::to_string_pretty(pl).map_err(|e| format!("json: {e}"))?;
    fs::write(&p, data).map_err(|e| format!("write: {e}"))
}

pub(crate) const FAVS_ID: &str = "__favorites";

pub(crate) fn ensure_favs() {
    let p = pl_path(FAVS_ID);
    if !p.exists() {
        let pl = Playlist {
            id: FAVS_ID.to_string(),
            name: "Favorite Songs".to_string(),
            description: String::new(),
            cover: None,
            tracks: Vec::new(),
        };
        let _ = write_pl(&pl);
    }
}

#[tauri::command]
pub async fn pl_favs() -> Result<Playlist, String> {
    ensure_favs();
    read_pl(FAVS_ID)
}

#[tauri::command]
pub async fn pl_fav_toggle(track_path: String) -> Result<bool, String> {
    ensure_favs();
    let mut pl = read_pl(FAVS_ID)?;
    let is_fav = pl.tracks.contains(&track_path);
    if is_fav {
        pl.tracks.retain(|t| t != &track_path);
    } else {
        pl.tracks.push(track_path);
    }
    write_pl(&pl)?;
    Ok(!is_fav)
}

#[tauri::command]
pub async fn pl_list() -> Result<Vec<Playlist>, String> {
    let dir = pl_dir();
    let mut out = Vec::new();
    let entries = fs::read_dir(&dir).map_err(|e| format!("readdir: {e}"))?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().map_or(false, |e| e == "json") {
            if let Ok(data) = fs::read_to_string(&path) {
                if let Ok(pl) = serde_json::from_str::<Playlist>(&data) {
                    if pl.id != FAVS_ID {
                        out.push(pl);
                    }
                }
            }
        }
    }
    let order_path = dir.join("_order.json");
    if let Ok(data) = fs::read_to_string(&order_path) {
        if let Ok(ids) = serde_json::from_str::<Vec<String>>(&data) {
            let mut map: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
            for (i, id) in ids.iter().enumerate() {
                map.insert(id.clone(), i);
            }
            out.sort_by_key(|pl| map.get(&pl.id).copied().unwrap_or(usize::MAX));
            return Ok(out);
        }
    }
    out.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(out)
}

#[tauri::command]
pub async fn pl_reorder(ids: Vec<String>) -> Result<(), String> {
    let path = pl_dir().join("_order.json");
    let data = serde_json::to_string(&ids).map_err(|e| format!("json: {e}"))?;
    fs::write(&path, data).map_err(|e| format!("write: {e}"))
}

#[tauri::command]
pub async fn pl_create(name: String, description: Option<String>, cover: Option<String>) -> Result<Playlist, String> {
    let id = format!("pl_{}", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis());
    let pl = Playlist {
        id,
        name,
        description: description.unwrap_or_default(),
        cover,
        tracks: Vec::new(),
    };
    write_pl(&pl)?;
    Ok(pl)
}

#[tauri::command]
pub async fn pl_rename(id: String, name: String) -> Result<(), String> {
    let mut pl = read_pl(&id)?;
    pl.name = name;
    write_pl(&pl)
}

#[tauri::command]
pub async fn pl_set_cover(id: String, cover: String) -> Result<(), String> {
    let mut pl = read_pl(&id)?;
    pl.cover = Some(cover);
    write_pl(&pl)
}

#[tauri::command]
pub async fn pl_delete(id: String) -> Result<(), String> {
    let p = pl_path(&id);
    if p.exists() {
        fs::remove_file(&p).map_err(|e| format!("delete: {e}"))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn pl_get(id: String) -> Result<Playlist, String> {
    read_pl(&id)
}

#[tauri::command]
pub async fn pl_add_track(id: String, track_path: String) -> Result<(), String> {
    let mut pl = read_pl(&id)?;
    if !pl.tracks.contains(&track_path) {
        pl.tracks.push(track_path);
        write_pl(&pl)?;
    }
    Ok(())
}

#[tauri::command]
pub async fn pl_remove_track(id: String, track_path: String) -> Result<(), String> {
    let mut pl = read_pl(&id)?;
    pl.tracks.retain(|t| t != &track_path);
    write_pl(&pl)
}

#[tauri::command]
pub async fn pl_reorder_tracks(id: String, tracks: Vec<String>) -> Result<(), String> {
    let mut pl = read_pl(&id)?;
    pl.tracks = tracks;
    write_pl(&pl)
}

#[tauri::command]
pub async fn pl_cover(path: String) -> Result<Option<String>, String> {
    let p = std::path::Path::new(&path);
    if !p.exists() {
        return Ok(None);
    }
    let data = fs::read(p).map_err(|e| format!("read: {e}"))?;
    let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("png").to_lowercase();
    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        _ => "image/png",
    };
    Ok(Some(format!("data:{};base64,{}", mime, B64.encode(&data))))
}
