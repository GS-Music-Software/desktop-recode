use std::sync::OnceLock;
use tokio::sync::Mutex;
use super::types::{LyricLine, RichSyncResult, mk_client, parse_lrc};

static MXM_TOKEN: OnceLock<Mutex<Option<String>>> = OnceLock::new();

async fn mxm_get_token(client: &reqwest::Client) -> Option<String> {
    let lock = MXM_TOKEN.get_or_init(|| Mutex::new(None));
    let mut cached = lock.lock().await;
    if let Some(ref t) = *cached {
        println!("[lyrics/mxm] using cached token");
        return Some(t.clone());
    }
    #[derive(serde::Deserialize)]
    struct Token { body: TokenBody }
    #[derive(serde::Deserialize)]
    struct TokenBody { user_token: Option<String> }
    #[derive(serde::Deserialize)]
    struct TokenResp { message: Token }

    let url = "https://apic-desktop.musixmatch.com/ws/1.1/token.get?app_id=web-desktop-app-v1.0&user_language=en";
    println!("[lyrics/mxm] fetching guest token");
    let resp = match client.get(url).send().await {
        Ok(r) => r,
        Err(e) => { println!("[lyrics/mxm] token request failed: {e}"); return None; }
    };
    let data: TokenResp = match resp.json().await {
        Ok(d) => d,
        Err(e) => { println!("[lyrics/mxm] token parse failed: {e}"); return None; }
    };
    let token = match data.message.body.user_token {
        Some(t) => t,
        None => { println!("[lyrics/mxm] token field missing in response"); return None; }
    };
    if token.contains("UpgradeOnly") {
        println!("[lyrics/mxm] got UpgradeOnly token, musixmatch is blocking guest access");
        return None;
    }
    println!("[lyrics/mxm] got valid token");
    *cached = Some(token.clone());
    Some(token)
}

async fn mxm_match_track(client: &reqwest::Client, token: &str, artist: &str, title: &str) -> Option<(u64, bool, bool)> {
    #[derive(serde::Deserialize)]
    struct Track { track_id: u64, has_richsync: Option<u8>, has_subtitles: Option<u8> }
    #[derive(serde::Deserialize)]
    struct TrackBody { track: Option<Track> }
    #[derive(serde::Deserialize)]
    struct TrackMsg { body: Option<TrackBody> }
    #[derive(serde::Deserialize)]
    struct TrackResp { message: TrackMsg }

    let url = format!(
        "https://apic-desktop.musixmatch.com/ws/1.1/matcher.track.get?app_id=web-desktop-app-v1.0&usertoken={}&q_track={}&q_artist={}",
        urlencoding::encode(token), urlencoding::encode(title), urlencoding::encode(artist),
    );
    println!("[lyrics/mxm] matching track \"{}\" - \"{}\"", artist, title);
    let resp = match client.get(&url).send().await {
        Ok(r) => r,
        Err(e) => { println!("[lyrics/mxm] match request failed: {e}"); return None; }
    };
    let data: TrackResp = match resp.json().await {
        Ok(d) => d,
        Err(e) => { println!("[lyrics/mxm] match parse failed: {e}"); return None; }
    };
    let track = match data.message.body.and_then(|b| b.track) {
        Some(t) => t,
        None => { println!("[lyrics/mxm] track not found in match response"); return None; }
    };
    let has_richsync = track.has_richsync.unwrap_or(0) == 1;
    let has_subtitles = track.has_subtitles.unwrap_or(0) == 1;
    println!("[lyrics/mxm] matched track_id={} has_richsync={} has_subtitles={}", track.track_id, has_richsync, has_subtitles);
    Some((track.track_id, has_richsync, has_subtitles))
}

pub async fn mxm_subtitle(artist: &str, title: &str) -> Option<Vec<LyricLine>> {
    let client = match mk_client(8) {
        Some(c) => c,
        None => { println!("[lyrics/mxm] failed to build http client"); return None; }
    };
    let token = mxm_get_token(&client).await?;
    let (track_id, _, has_subtitles) = mxm_match_track(&client, &token, artist, title).await?;
    if !has_subtitles {
        println!("[lyrics/mxm] track has no subtitles");
        return None;
    }
    #[derive(serde::Deserialize)]
    struct SubBody { subtitle: Option<Sub> }
    #[derive(serde::Deserialize)]
    struct Sub { subtitle_body: Option<String> }
    #[derive(serde::Deserialize)]
    struct SubMsg { body: Option<SubBody> }
    #[derive(serde::Deserialize)]
    struct SubResp { message: SubMsg }

    let url = format!(
        "https://apic-desktop.musixmatch.com/ws/1.1/track.subtitle.get?app_id=web-desktop-app-v1.0&usertoken={}&track_id={}&subtitle_format=lrc",
        urlencoding::encode(&token), track_id,
    );
    println!("[lyrics/mxm] fetching subtitle for track_id={}", track_id);
    let resp = match client.get(&url).send().await {
        Ok(r) => r,
        Err(e) => { println!("[lyrics/mxm] subtitle request failed: {e}"); return None; }
    };
    let data: SubResp = match resp.json().await {
        Ok(d) => d,
        Err(e) => { println!("[lyrics/mxm] subtitle parse failed: {e}"); return None; }
    };
    let body = match data.message.body.and_then(|b| b.subtitle).and_then(|s| s.subtitle_body) {
        Some(b) => b,
        None => { println!("[lyrics/mxm] subtitle body missing"); return None; }
    };
    if body.is_empty() {
        println!("[lyrics/mxm] subtitle body is empty");
        return None;
    }
    let lines = parse_lrc(&body);
    if lines.is_empty() {
        println!("[lyrics/mxm] subtitle lrc parsed to 0 lines");
        return None;
    }
    println!("[lyrics/mxm] got {} subtitle lines", lines.len());
    Some(lines)
}

pub async fn mxm_richsync(artist: &str, title: &str) -> Option<RichSyncResult> {
    let client = match mk_client(8) {
        Some(c) => c,
        None => { println!("[lyrics/mxm] failed to build http client"); return None; }
    };
    let token = mxm_get_token(&client).await?;
    let (track_id, has_richsync, _) = mxm_match_track(&client, &token, artist, title).await?;
    if !has_richsync {
        println!("[lyrics/mxm] track has no richsync");
        return None;
    }
    #[derive(serde::Deserialize)]
    struct RichBody { richsync: Option<RichSync> }
    #[derive(serde::Deserialize)]
    struct RichSync { richsync_body: Option<String> }
    #[derive(serde::Deserialize)]
    struct RichMsg { body: Option<RichBody> }
    #[derive(serde::Deserialize)]
    struct RichResp { message: RichMsg }

    let url = format!(
        "https://apic-desktop.musixmatch.com/ws/1.1/track.richsync.get?app_id=web-desktop-app-v1.0&usertoken={}&track_id={}",
        urlencoding::encode(&token), track_id,
    );
    println!("[lyrics/mxm] fetching richsync for track_id={}", track_id);
    let resp = match client.get(&url).send().await {
        Ok(r) => r,
        Err(e) => { println!("[lyrics/mxm] richsync request failed: {e}"); return None; }
    };
    let data: RichResp = match resp.json().await {
        Ok(d) => d,
        Err(e) => { println!("[lyrics/mxm] richsync parse failed: {e}"); return None; }
    };
    let body = match data.message.body.and_then(|b| b.richsync).and_then(|r| r.richsync_body) {
        Some(b) => b,
        None => { println!("[lyrics/mxm] richsync body missing"); return None; }
    };
    if body.is_empty() {
        println!("[lyrics/mxm] richsync body is empty");
        return None;
    }
    println!("[lyrics/mxm] got richsync ({} bytes)", body.len());
    Some(RichSyncResult { source: "richsync".into(), data: body })
}
