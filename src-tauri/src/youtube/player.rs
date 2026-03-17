use rustypipe::client::RustyPipe;
use super::types::StreamInfo;

pub fn rp() -> Result<RustyPipe, String> {
    let cache = dirs::cache_dir()
        .unwrap_or_else(std::env::temp_dir)
        .join("gs-music")
        .join("rustypipe");
    std::fs::create_dir_all(&cache).ok();
    RustyPipe::builder()
        .storage_dir(&cache)
        .build()
        .map_err(|e| format!("rustypipe init failed: {e}"))
}

pub async fn get_stream(video_id: &str, _high_quality: bool) -> Result<StreamInfo, String> {
    let start = std::time::Instant::now();

    let body = serde_json::json!({
        "context": {
            "client": {
                "clientName": "ANDROID",
                "clientVersion": "20.10.38",
                "userAgent": "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip",
                "hl": "en",
                "timeZone": "UTC",
                "utcOffsetMinutes": 0,
                "osName": "Android",
                "osVersion": "11"
            }
        },
        "videoId": video_id
    });

    let client = reqwest::Client::new();
    let resp = client
        .post("https://www.youtube.com/youtubei/v1/player?prettyPrint=false")
        .header("User-Agent", "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip")
        .header("X-Youtube-Client-Name", "ANDROID")
        .header("X-Youtube-Client-Version", "20.10.38")
        .header("Origin", "https://www.youtube.com")
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("innertube request failed: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("innertube error: {}", resp.status()));
    }

    let data: serde_json::Value = resp.json().await.map_err(|e| format!("json parse failed: {e}"))?;

    let status = data["playabilityStatus"]["status"].as_str().unwrap_or("");
    if status != "OK" {
        let reason = data["playabilityStatus"]["reason"].as_str().unwrap_or("unknown");
        return Err(format!("not playable: {reason}"));
    }

    let formats = data["streamingData"]["adaptiveFormats"]
        .as_array()
        .ok_or("no adaptive formats")?;

    let audio = formats
        .iter()
        .filter(|f| {
            f["mimeType"].as_str().unwrap_or("").starts_with("audio/")
                && f["url"].as_str().is_some()
        })
        .max_by_key(|f| f["bitrate"].as_u64().unwrap_or(0))
        .ok_or("no audio streams found")?;

    let stream_url = audio["url"].as_str().unwrap().to_string();
    let mime = audio["mimeType"]
        .as_str()
        .unwrap_or("audio/webm")
        .split(';')
        .next()
        .unwrap_or("audio/webm")
        .to_string();
    let bitrate = audio["bitrate"].as_u64().unwrap_or(0);
    let duration_ms = audio["approxDurationMs"]
        .as_str()
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(0);

    println!("[yt] ready in {}ms ({}kbps {})", start.elapsed().as_millis(), bitrate / 1000, mime);

    Ok(StreamInfo {
        url: stream_url,
        mime,
        bitrate,
        duration_ms,
    })
}
