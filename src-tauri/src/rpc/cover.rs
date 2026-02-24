use std::collections::HashMap;
use std::sync::Mutex;

static CACHE: std::sync::LazyLock<Mutex<HashMap<String, Option<String>>>> =
    std::sync::LazyLock::new(|| Mutex::new(HashMap::new()));

fn enc(s: &str) -> String {
    let mut out = String::new();
    for b in s.bytes() {
        match b {
            b' ' => out.push('+'),
            b if b.is_ascii_alphanumeric() || b"-_.~".contains(&b) => out.push(b as char),
            _ => { out.push_str(&format!("%{:02X}", b)); }
        }
    }
    out
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

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .user_agent("gs-music/1.0")
        .build().ok()?;

    let mut result: Option<String> = None;
    for _ in 0..3 {
        if let Ok(resp) = client.get(&url).send().await {
            if let Ok(search) = resp.json::<SearchRes>().await {
                result = search.data.into_iter().next().and_then(|t| t.album.cover_big);
                break;
            }
        }
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
    }

    if result.is_none() {
        let q_simple = format!("{} {}", artist, title);
        let url_simple = format!("https://api.deezer.com/search/track?q={}&limit=1", enc(&q_simple));
        if let Ok(resp) = client.get(&url_simple).send().await {
            if let Ok(search) = resp.json::<SearchRes>().await {
                result = search.data.into_iter().next().and_then(|t| t.album.cover_big);
            }
        }
    }

    CACHE.lock().unwrap().insert(key, result.clone());
    result
}
