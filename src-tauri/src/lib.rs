mod scan;
mod types;
mod discover;
mod rpc;
mod tray;
mod ytdlp_setup;
mod spotify;
mod playlists;
mod track_ops;

use scan::{scan_dir, get_cover, stream_file, fetch_lyrics};
use discover::{search_tracks, search_albums, search_artists, get_album_tracks, get_artist_albums, download_track, yt_playlist_tracks};
use rpc::{rpc_on, rpc_off, rpc_set, rpc_clr, rpc_cover};
use tray::tray_set;
use ytdlp_setup::{check_ytdlp, install_ytdlp, check_ytdlp_update, check_ffmpeg, install_ffmpeg};
use spotify::{sp_save_client_id, sp_load_client_id, sp_authorize, sp_load_tokens, sp_disconnect, sp_fresh_token, sp_playlists, sp_playlist_tracks, sp_liked_tracks};
use playlists::{pl_list, pl_create, pl_rename, pl_delete, pl_get, pl_add_track, pl_remove_track, pl_cover, pl_favs, pl_fav_toggle};
use track_ops::delete_track;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(rpc::init())
        .manage(tray::init())
        .invoke_handler(tauri::generate_handler![scan_dir, get_cover, stream_file, fetch_lyrics, search_tracks, search_albums, search_artists, get_album_tracks, get_artist_albums, download_track, yt_playlist_tracks, rpc_on, rpc_off, rpc_set, rpc_clr, rpc_cover, tray_set, check_ytdlp, install_ytdlp, check_ytdlp_update, check_ffmpeg, install_ffmpeg, sp_save_client_id, sp_load_client_id, sp_authorize, sp_load_tokens, sp_disconnect, sp_fresh_token, sp_playlists, sp_playlist_tracks, sp_liked_tracks, pl_list, pl_create, pl_rename, pl_delete, pl_get, pl_add_track, pl_remove_track, pl_cover, pl_favs, pl_fav_toggle, delete_track])
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
