use std::path::{Path, PathBuf};
use tokio::sync::OnceCell;
use tauri::{AppHandle, Emitter};
use lofty::file::AudioFile;

use super::download::DlProgress;

static SC_CLIENT_ID: OnceCell<String> = OnceCell::const_new();

fn http_client() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
        .build()
        .unwrap_or_else(|_| reqwest::Client::new())
}

async fn resolve_sc_client_id() -> Result<String, String> {
    println!("[soundcloud] resolving client_id...");

    let client = http_client();
    let html = client
        .get("https://soundcloud.com/")
        .send()
        .await
        .map_err(|e| format!("sc homepage fetch failed: {e}"))?
        .text()
        .await
        .map_err(|e| format!("sc homepage read failed: {e}"))?;

    let script_urls: Vec<String> = html
        .split("src=\"")
        .filter_map(|chunk| {
            let end = chunk.find('"')?;
            let url = &chunk[..end];
            if url.contains("sndcdn.com") && url.ends_with(".js") {
                Some(url.to_string())
            } else {
                None
            }
        })
        .collect();

    println!("[soundcloud] found {} script urls", script_urls.len());

    for url in script_urls.iter().rev().take(5) {
        println!("[soundcloud] checking script: {}", url);
        let js = match client.get(url).send().await {
            Ok(resp) => match resp.text().await {
                Ok(t) => t,
                Err(_) => continue,
            },
            Err(_) => continue,
        };

        if let Some(id) = extract_client_id(&js) {
            println!("[soundcloud] resolved client_id: {}", id);
            return Ok(id);
        }
    }

    Err("could not resolve soundcloud client_id".into())
}

fn extract_client_id(js: &str) -> Option<String> {
    for pattern in &["client_id:\"", "client_id=\"", "clientId:\"", "clientId=\""] {
        if let Some(pos) = js.find(pattern) {
            let start = pos + pattern.len();
            let rest = &js[start..];
            let end = rest.find('"')?;
            let id = &rest[..end];
            if id.len() > 10 && id.chars().all(|c| c.is_alphanumeric()) {
                return Some(id.to_string());
            }
        }
    }
    None
}

async fn get_sc_client_id() -> Result<&'static String, String> {
    SC_CLIENT_ID
        .get_or_try_init(|| async { resolve_sc_client_id().await })
        .await
}

struct ScTrackMatch {
    track_id: u64,
    permalink_url: String,
}

async fn search_soundcloud(artist: &str, title: &str) -> Result<Option<ScTrackMatch>, String> {
    let client_id = match get_sc_client_id().await {
        Ok(id) => id,
        Err(e) => {
            println!("[soundcloud] client_id resolution failed: {e}");
            return Ok(None);
        }
    };

    let query = format!("{} {}", artist, title);
    let url = format!(
        "https://api-v2.soundcloud.com/search/tracks?q={}&client_id={}&limit=5",
        super::util::enc(&query),
        client_id
    );

    println!("[soundcloud] searching: {}", query);

    let client = http_client();
    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("sc search failed: {e}"))?;

    if !resp.status().is_success() {
        println!("[soundcloud] search returned status {}", resp.status());
        return Ok(None);
    }

    let data: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("sc search parse failed: {e}"))?;

    let collection = match data["collection"].as_array() {
        Some(c) => c,
        None => {
            println!("[soundcloud] search returned no collection");
            return Ok(None);
        }
    };

    println!("[soundcloud] search returned {} results", collection.len());

    let artist_lower = artist.to_lowercase();
    let title_lower = title.to_lowercase();

    for track in collection {
        let sc_title = track["title"].as_str().unwrap_or("").to_lowercase();
        let sc_user = track["user"]["username"].as_str().unwrap_or("").to_lowercase();
        let permalink = track["permalink_url"].as_str().unwrap_or("");
        let track_id = track["id"].as_u64().unwrap_or(0);

        println!("[soundcloud] result: \"{}\" by \"{}\" (id={}) -> {}", sc_title, sc_user, track_id, permalink);

        let title_match = sc_title.contains(&title_lower) || title_lower.contains(&sc_title);
        let artist_match = sc_user.contains(&artist_lower)
            || artist_lower.contains(&sc_user)
            || sc_title.contains(&artist_lower);

        if title_match && artist_match && track_id > 0 {
            println!("[soundcloud] match found: id={} {}", track_id, permalink);
            return Ok(Some(ScTrackMatch { track_id, permalink_url: permalink.to_string() }));
        }
    }

    for track in collection {
        let sc_title = track["title"].as_str().unwrap_or("").to_lowercase();
        let track_id = track["id"].as_u64().unwrap_or(0);
        let permalink = track["permalink_url"].as_str().unwrap_or("");

        if sc_title.contains(&title_lower) && track_id > 0 {
            println!("[soundcloud] fuzzy match (title only): id={} {}", track_id, permalink);
            return Ok(Some(ScTrackMatch { track_id, permalink_url: permalink.to_string() }));
        }
    }

    println!("[soundcloud] no match found for \"{}\" - \"{}\"", artist, title);
    Ok(None)
}

enum StreamKind {
    Progressive,
    Hls,
}

struct ResolvedStream {
    url: String,
    kind: StreamKind,
}

async fn get_stream_url(track_id: u64) -> Result<ResolvedStream, String> {
    let client_id = get_sc_client_id().await?;

    let track_url = format!(
        "https://api-v2.soundcloud.com/tracks/{}?client_id={}",
        track_id, client_id
    );

    println!("[soundcloud] fetching track info for {}", track_id);

    let client = http_client();
    let resp = client
        .get(&track_url)
        .send()
        .await
        .map_err(|e| format!("sc track fetch failed: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("sc track info returned status {}", resp.status()));
    }

    let data: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("sc track parse failed: {e}"))?;

    let policy = data["policy"].as_str().unwrap_or("");
    let snipped = data["media"]["transcodings"]
        .as_array()
        .and_then(|arr| arr.first())
        .and_then(|t| t["snipped"].as_bool())
        .unwrap_or(false);
    let full_duration_ms = data["full_duration"].as_u64().unwrap_or(0);
    let duration_ms = data["duration"].as_u64().unwrap_or(0);

    println!("[soundcloud] track policy={} snipped={} duration={}ms full_duration={}ms", policy, snipped, duration_ms, full_duration_ms);

    if snipped {
        return Err("track is snipped (preview only, requires subscription)".into());
    }

    if policy == "SNIP" {
        return Err("track policy is SNIP (preview only, requires subscription)".into());
    }

    if full_duration_ms > 0 && duration_ms > 0 && duration_ms < full_duration_ms / 2 {
        return Err(format!("track appears to be a preview ({}ms vs {}ms full)", duration_ms, full_duration_ms));
    }

    let transcodings = data["media"]["transcodings"]
        .as_array()
        .ok_or("no transcodings found on track")?;

    println!("[soundcloud] found {} transcodings", transcodings.len());

    for t in transcodings {
        let preset = t["preset"].as_str().unwrap_or("");
        let protocol = t["format"]["protocol"].as_str().unwrap_or("");
        let tc_url = t["url"].as_str().unwrap_or("");
        let t_snipped = t["snipped"].as_bool().unwrap_or(false);
        println!("[soundcloud] transcoding: preset={} protocol={} snipped={}", preset, protocol, t_snipped);

        if t_snipped {
            continue;
        }

        if preset.starts_with("mp3") && protocol == "progressive" && !tc_url.is_empty() {
            println!("[soundcloud] found progressive mp3 transcoding ({})", preset);
            let stream = resolve_transcoding_url(tc_url, client_id).await?;
            return Ok(ResolvedStream { url: stream, kind: StreamKind::Progressive });
        }
    }

    for t in transcodings {
        let preset = t["preset"].as_str().unwrap_or("");
        let protocol = t["format"]["protocol"].as_str().unwrap_or("");
        let tc_url = t["url"].as_str().unwrap_or("");
        let t_snipped = t["snipped"].as_bool().unwrap_or(false);

        if t_snipped {
            continue;
        }

        if preset.starts_with("mp3") && protocol == "hls" && !tc_url.is_empty() {
            println!("[soundcloud] falling back to mp3 hls transcoding ({})", preset);
            let stream = resolve_transcoding_url(tc_url, client_id).await?;
            return Ok(ResolvedStream { url: stream, kind: StreamKind::Hls });
        }
    }

    for t in transcodings {
        let protocol = t["format"]["protocol"].as_str().unwrap_or("");
        let tc_url = t["url"].as_str().unwrap_or("");
        let t_snipped = t["snipped"].as_bool().unwrap_or(false);

        if t_snipped {
            continue;
        }

        if protocol == "hls" && !tc_url.is_empty() {
            println!("[soundcloud] falling back to any hls transcoding");
            let stream = resolve_transcoding_url(tc_url, client_id).await?;
            return Ok(ResolvedStream { url: stream, kind: StreamKind::Hls });
        }
    }

    Err(format!("no usable transcoding found for track {}", track_id))
}

async fn resolve_transcoding_url(tc_url: &str, client_id: &str) -> Result<String, String> {
    let url = format!("{}?client_id={}", tc_url, client_id);
    println!("[soundcloud] resolving transcoding: {}...", &tc_url[..tc_url.len().min(80)]);

    let client = http_client();
    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("sc transcoding resolve failed: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("sc transcoding resolve returned status {}", resp.status()));
    }

    let data: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("sc transcoding parse failed: {e}"))?;

    let stream_url = data["url"]
        .as_str()
        .ok_or("no url in transcoding response")?
        .to_string();

    println!("[soundcloud] resolved stream url: {}...", &stream_url[..stream_url.len().min(80)]);
    Ok(stream_url)
}

async fn dl_audio_from_url(url: &str, dest: &Path) -> Result<(), String> {
    println!("[soundcloud] downloading audio to: {}", dest.display());

    let client = http_client();
    let resp = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("audio download failed: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("audio download http {}", resp.status()));
    }

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("audio download read failed: {e}"))?;

    println!("[soundcloud] downloaded {} bytes", bytes.len());

    if bytes.len() < 1000 {
        return Err("downloaded file too small, likely not audio".into());
    }

    std::fs::write(dest, &bytes).map_err(|e| format!("write audio file failed: {e}"))
}

async fn dl_hls_stream(url: &str, dest: &Path) -> Result<(), String> {
    println!("[soundcloud] downloading hls stream...");

    let ffmpeg = crate::ytdlp_setup::ffmpeg_bin();

    let mut cmd = tokio::process::Command::new(&ffmpeg);
    cmd.args([
        "-y", "-i", url,
        "-c:a", "libmp3lame",
        "-q:a", "0",
        &dest.to_string_lossy(),
    ]);
    cmd.stdout(std::process::Stdio::null());
    cmd.stderr(std::process::Stdio::piped());

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(super::util::CREATE_NO_WINDOW);
    }

    let output = cmd.output().await.map_err(|e| format!("ffmpeg hls failed: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        println!("[soundcloud] ffmpeg hls error: {}", stderr);
        return Err(format!("ffmpeg hls conversion failed"));
    }

    let size = std::fs::metadata(dest).map(|m| m.len()).unwrap_or(0);
    println!("[soundcloud] hls download complete: {} bytes", size);

    if size < 1000 {
        return Err("hls output too small".into());
    }

    Ok(())
}

pub async fn dl_via_soundcloud(
    app: &AppHandle,
    id: u64,
    artist: &str,
    title: &str,
    album: &str,
    cover_url: &str,
    save_dir: &Path,
) -> Result<PathBuf, String> {
    println!("[soundcloud] starting download for \"{}\" - \"{}\"", artist, title);

    let out_dir = save_dir.join(format!("{} - {}", artist, album));
    std::fs::create_dir_all(&out_dir).map_err(|e| e.to_string())?;
    let final_path = out_dir.join(format!("{} - {}.mp3", artist, title));

    let _ = app.emit("dl_progress", DlProgress { id, pct: 5.0 });

    let sc_match = search_soundcloud(artist, title).await?;

    let sc_match = match sc_match {
        Some(m) => m,
        None => return Err("track not found on soundcloud".into()),
    };

    let _ = app.emit("dl_progress", DlProgress { id, pct: 20.0 });

    println!("[soundcloud] resolving stream for track {}", sc_match.track_id);
    let stream = get_stream_url(sc_match.track_id).await?;

    let _ = app.emit("dl_progress", DlProgress { id, pct: 35.0 });

    let tmp_path = out_dir.join(format!(".sc_tmp_{}.mp3", id));

    match stream.kind {
        StreamKind::Progressive => {
            println!("[soundcloud] downloading progressive mp3...");
            dl_audio_from_url(&stream.url, &tmp_path).await?;
        }
        StreamKind::Hls => {
            println!("[soundcloud] downloading hls stream via ffmpeg...");
            dl_hls_stream(&stream.url, &tmp_path).await?;
        }
    }

    let _ = app.emit("dl_progress", DlProgress { id, pct: 70.0 });

    if let Ok(tagged) = lofty::probe::Probe::open(&tmp_path).and_then(|p| p.read()) {
        let file_duration_secs = tagged.properties().duration().as_secs();
        println!("[soundcloud] downloaded audio duration: {}s", file_duration_secs);
        if file_duration_secs > 0 && file_duration_secs <= 30 {
            let _ = std::fs::remove_file(&tmp_path);
            return Err(format!("downloaded audio is only {}s, prob a preview", file_duration_secs));
        }
    }

    let _ = app.emit("dl_progress", DlProgress { id, pct: 75.0 });

    println!("[soundcloud] embedding metadata...");
    let cover_tmp = super::download::fetch_cover_tmp(cover_url).await;
    super::download::embed_meta(&tmp_path, artist, title, album, cover_tmp.as_deref()).await?;

    let _ = app.emit("dl_progress", DlProgress { id, pct: 92.0 });

    if final_path != tmp_path {
        std::fs::rename(&tmp_path, &final_path)
            .map_err(|e| format!("final rename failed: {e}"))?;
    }

    for _ in 0..10 {
        if let Ok(f) = std::fs::File::open(&final_path) {
            drop(f);
            if lofty::probe::Probe::open(&final_path).and_then(|p| p.read()).is_ok() {
                break;
            }
        }
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;
    }

    println!("[soundcloud] download complete: {}", final_path.display());
    Ok(final_path)
}
