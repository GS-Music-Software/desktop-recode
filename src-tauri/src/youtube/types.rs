use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamInfo {
    pub url: String,
    pub mime: String,
    pub bitrate: u64,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize)]
pub struct YtSearchResult {
    pub video_id: String,
    pub title: String,
    pub artist: String,
    pub duration: u64,
    pub thumbnail: String,
}
