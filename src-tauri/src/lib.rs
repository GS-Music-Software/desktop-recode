mod scan;
mod types;
mod discover;
mod rpc;
mod tray;
mod ytdlp_setup;
mod spotify;
mod playlists;
mod track_ops;
mod audio_device;
mod account;

use scan::{scan_dir, get_cover, stream_file, fetch_lyrics, fetch_ttml};
use discover::{search_tracks, search_albums, search_artists, get_album_tracks, get_artist_albums, download_track, yt_playlist_tracks, lookup_cover, get_recommendations};
use rpc::{rpc_on, rpc_off, rpc_set, rpc_clr, rpc_cover};
use tray::tray_set;
use ytdlp_setup::{check_ytdlp, install_ytdlp, check_ytdlp_update, check_ffmpeg, install_ffmpeg};
use spotify::{sp_save_client_id, sp_load_client_id, sp_authorize, sp_load_tokens, sp_disconnect, sp_fresh_token, sp_playlists, sp_playlist_tracks, sp_liked_tracks};
use playlists::{pl_list, pl_create, pl_rename, pl_delete, pl_get, pl_add_track, pl_remove_track, pl_cover, pl_set_cover, pl_favs, pl_fav_toggle, pl_reorder, pl_reorder_tracks};
use track_ops::delete_track;
use audio_device::get_audio_device;
use account::{export_account, import_account, import_fill_playlists};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(rpc::init())
        .manage(tray::init())
        .invoke_handler(tauri::generate_handler![scan_dir, get_cover, stream_file, fetch_lyrics, fetch_ttml, search_tracks, search_albums, search_artists, get_album_tracks, get_artist_albums, download_track, yt_playlist_tracks, rpc_on, rpc_off, rpc_set, rpc_clr, rpc_cover, tray_set, check_ytdlp, install_ytdlp, check_ytdlp_update, check_ffmpeg, install_ffmpeg, sp_save_client_id, sp_load_client_id, sp_authorize, sp_load_tokens, sp_disconnect, sp_fresh_token, sp_playlists, sp_playlist_tracks, sp_liked_tracks, pl_list, pl_create, pl_rename, pl_delete, pl_get, pl_add_track, pl_remove_track, pl_cover, pl_set_cover, pl_favs, pl_fav_toggle, pl_reorder, pl_reorder_tracks, delete_track, get_audio_device, export_account, import_account, import_fill_playlists, lookup_cover, get_recommendations])
        .setup(|app| {
            #[cfg(target_os = "linux")]
            {
                use gtk::prelude::GtkWindowExt;
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    if let Ok(gtk_window) = window.gtk_window() {
                        gtk_window.set_titlebar(None::<&gtk::Widget>);
                    }
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run app");
}
