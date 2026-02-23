mod api;
mod auth;
mod tokens;
pub mod types;

use types::{Tokens, Playlist, SpTrack};

#[tauri::command]
pub async fn sp_save_client_id(id: String) -> Result<(), String> {
    tokens::save_client_id(&id);
    Ok(())
}

#[tauri::command]
pub async fn sp_load_client_id() -> Result<Option<String>, String> {
    Ok(tokens::load_client_id())
}

#[tauri::command]
pub async fn sp_authorize(client_id: String) -> Result<Tokens, String> {
    let t = auth::authorize(&client_id).await?;
    tokens::save_tokens(&t);
    Ok(t)
}

#[tauri::command]
pub async fn sp_load_tokens() -> Result<Option<Tokens>, String> {
    Ok(tokens::load_tokens())
}

#[tauri::command]
pub async fn sp_disconnect() -> Result<(), String> {
    tokens::clear_tokens();
    Ok(())
}

#[tauri::command]
pub async fn sp_playlists(access_token: String) -> Result<Vec<Playlist>, String> {
    api::playlists(&access_token).await
}

#[tauri::command]
pub async fn sp_playlist_tracks(access_token: String, id: String) -> Result<Vec<SpTrack>, String> {
    api::playlist_tracks(&access_token, &id).await
}

#[tauri::command]
pub async fn sp_liked_tracks(access_token: String) -> Result<Vec<SpTrack>, String> {
    api::liked_tracks(&access_token).await
}
