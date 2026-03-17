pub(crate) mod player;
pub(crate) mod search;
pub mod types;

use types::{StreamInfo, YtSearchResult};

#[tauri::command]
pub async fn yt_get_stream(video_id: String, high_quality: bool) -> Result<StreamInfo, String> {
    player::get_stream(&video_id, high_quality).await
}

#[tauri::command]
pub async fn yt_search(query: String) -> Result<Vec<YtSearchResult>, String> {
    search::search_yt(&query).await
}
