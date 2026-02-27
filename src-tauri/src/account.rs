use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;

use crate::playlists::{self, Playlist};
use crate::scan::scan_dir;

#[derive(Serialize, Deserialize, Clone)]
pub struct ExportTrack {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration: f64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ExportPlaylist {
    pub name: String,
    pub tracks: Vec<ExportTrack>,
}

#[derive(Serialize, Deserialize)]
pub struct AccountExport {
    pub version: u32,
    pub tracks: Vec<ExportTrack>,
    pub playlists: Vec<ExportPlaylist>,
    pub favorites: Vec<ExportTrack>,
}

#[derive(Serialize)]
pub struct ImportResult {
    pub playlists_created: usize,
    pub favorites_restored: usize,
    pub tracks_already_present: usize,
    pub tracks_to_download: Vec<ExportTrack>,
}

fn norm_key(title: &str, artist: &str) -> String {
    format!(
        "{}::{}",
        title.trim().to_lowercase(),
        artist.trim().to_lowercase()
    )
}

#[tauri::command]
pub async fn export_account(dir: String) -> Result<String, String> {
    let lib = scan_dir(dir);
    let path_to_meta: HashMap<String, ExportTrack> = lib
        .iter()
        .map(|t| {
            (
                t.path.clone(),
                ExportTrack {
                    title: t.title.clone(),
                    artist: t.artist.clone(),
                    album: t.album.clone(),
                    duration: t.duration,
                },
            )
        })
        .collect();

    let tracks: Vec<ExportTrack> = lib
        .iter()
        .map(|t| ExportTrack {
            title: t.title.clone(),
            artist: t.artist.clone(),
            album: t.album.clone(),
            duration: t.duration,
        })
        .collect();

    let pl_dir = playlists::pl_dir();
    let mut pls = Vec::new();
    let entries = fs::read_dir(&pl_dir).map_err(|e| format!("readdir: {e}"))?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().map_or(false, |e| e == "json") {
            if let Ok(data) = fs::read_to_string(&path) {
                if let Ok(pl) = serde_json::from_str::<Playlist>(&data) {
                    if pl.id != playlists::FAVS_ID {
                        let pl_tracks: Vec<ExportTrack> = pl
                            .tracks
                            .iter()
                            .filter_map(|p| path_to_meta.get(p).cloned())
                            .collect();
                        pls.push(ExportPlaylist {
                            name: pl.name,
                            tracks: pl_tracks,
                        });
                    }
                }
            }
        }
    }

    playlists::ensure_favs();
    let favs_pl = playlists::read_pl(playlists::FAVS_ID)?;
    let favorites: Vec<ExportTrack> = favs_pl
        .tracks
        .iter()
        .filter_map(|p| path_to_meta.get(p).cloned())
        .collect();

    let export = AccountExport {
        version: 1,
        tracks,
        playlists: pls,
        favorites,
    };

    serde_json::to_string_pretty(&export).map_err(|e| format!("json: {e}"))
}

#[tauri::command]
pub async fn import_account(data: String, dir: String) -> Result<ImportResult, String> {
    let export: AccountExport =
        serde_json::from_str(&data).map_err(|e| format!("parse: {e}"))?;

    let lib = scan_dir(dir.clone());
    let lib_keys: HashMap<String, String> = lib
        .iter()
        .map(|t| (norm_key(&t.title, &t.artist), t.path.clone()))
        .collect();

    let mut present = 0usize;
    let mut missing: Vec<ExportTrack> = Vec::new();

    for t in &export.tracks {
        let key = norm_key(&t.title, &t.artist);
        if lib_keys.contains_key(&key) {
            present += 1;
        } else {
            missing.push(t.clone());
        }
    }

    let mut pl_count = 0usize;
    for ep in &export.playlists {
        let id = format!(
            "pl_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis()
        );
        std::thread::sleep(std::time::Duration::from_millis(1));

        let track_paths: Vec<String> = ep
            .tracks
            .iter()
            .filter_map(|t| lib_keys.get(&norm_key(&t.title, &t.artist)).cloned())
            .collect();

        let pl = Playlist {
            id,
            name: ep.name.clone(),
            description: String::new(),
            cover: None,
            tracks: track_paths,
        };
        playlists::write_pl(&pl)?;
        pl_count += 1;
    }

    playlists::ensure_favs();
    let mut favs = playlists::read_pl(playlists::FAVS_ID)?;
    let mut fav_count = 0usize;
    for ft in &export.favorites {
        let key = norm_key(&ft.title, &ft.artist);
        if let Some(path) = lib_keys.get(&key) {
            if !favs.tracks.contains(path) {
                favs.tracks.push(path.clone());
                fav_count += 1;
            }
        }
    }
    playlists::write_pl(&favs)?;

    Ok(ImportResult {
        playlists_created: pl_count,
        favorites_restored: fav_count,
        tracks_already_present: present,
        tracks_to_download: missing,
    })
}

#[tauri::command]
pub async fn import_fill_playlists(data: String, dir: String) -> Result<(), String> {
    let export: AccountExport =
        serde_json::from_str(&data).map_err(|e| format!("parse: {e}"))?;

    let lib = scan_dir(dir);
    let lib_keys: HashMap<String, String> = lib
        .iter()
        .map(|t| (norm_key(&t.title, &t.artist), t.path.clone()))
        .collect();

    let pl_dir = playlists::pl_dir();
    let entries = fs::read_dir(&pl_dir).map_err(|e| format!("readdir: {e}"))?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().map_or(false, |e| e == "json") {
            if let Ok(file_data) = fs::read_to_string(&path) {
                if let Ok(mut pl) = serde_json::from_str::<Playlist>(&file_data) {
                    if pl.id == playlists::FAVS_ID {
                        continue;
                    }
                    if let Some(ep) = export.playlists.iter().find(|e| e.name == pl.name) {
                        for et in &ep.tracks {
                            let key = norm_key(&et.title, &et.artist);
                            if let Some(track_path) = lib_keys.get(&key) {
                                if !pl.tracks.contains(track_path) {
                                    pl.tracks.push(track_path.clone());
                                }
                            }
                        }
                        playlists::write_pl(&pl)?;
                    }
                }
            }
        }
    }

    playlists::ensure_favs();
    let mut favs = playlists::read_pl(playlists::FAVS_ID)?;
    for ft in &export.favorites {
        let key = norm_key(&ft.title, &ft.artist);
        if let Some(path) = lib_keys.get(&key) {
            if !favs.tracks.contains(path) {
                favs.tracks.push(path.clone());
            }
        }
    }
    playlists::write_pl(&favs)?;

    Ok(())
}
