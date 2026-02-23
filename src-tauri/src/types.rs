use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct TrackMeta {
    pub path: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration: f64,
    pub track_no: u32,
    pub year: Option<u32>,
    pub cover: Option<String>,
}
