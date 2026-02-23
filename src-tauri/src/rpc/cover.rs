use std::collections::HashMap;
use std::sync::Mutex;

static CACHE: std::sync::LazyLock<Mutex<HashMap<String, Option<String>>>> =
    std::sync::LazyLock::new(|| Mutex::new(HashMap::new()));

fn enc(s: &str) -> String {
    s.chars().map(|c| match c {
        ' ' => '+'.to_string(),
        c if c.is_alphanumeric() || "-_.~".contains(c) => c.to_string(),
        c => format!("%{:02X}", c as u32),
    }).collect()
}

#[derive(serde::Deserialize)]
struct RawAlbum { cover_big: Option<String> }
#[derive(serde::Deserialize)]
struct RawTrack { album: RawAlbum }
#[derive(serde::Deserialize)]
struct SearchRes { data: Vec<RawTrack> }

pub async fn fetch(artist: &str, title: &str) -> Option<String> {
    let key = format!("{}::{}", artist, title);
    {
        let cache = CACHE.lock().unwrap();
        if let Some(val) = cache.get(&key) {
            return val.clone();
        }
    }

    let q = format!("artist:\"{}\" track:\"{}\"", artist, title);
    let url = format!("https://api.deezer.com/search/track?q={}&limit=1", enc(&q));

    let result = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .user_agent("gs-music/1.0")
        .build().ok()?
        .get(&url).send().await.ok()?
        .json::<SearchRes>().await.ok()?
        .data.into_iter().next()
        .and_then(|t| t.album.cover_big);

    CACHE.lock().unwrap().insert(key, result.clone());
    result
}
