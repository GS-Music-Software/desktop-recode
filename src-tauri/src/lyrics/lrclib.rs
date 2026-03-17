use super::types::{LyricLine, mk_client, parse_lrc};

pub async fn lrclib_get(artist: &str, title: &str, duration: f64) -> Option<Vec<LyricLine>> {
    let client = match mk_client(5) {
        Some(c) => c,
        None => { println!("[lyrics/lrclib] failed to build http client"); return None; }
    };
    #[derive(serde::Deserialize)]
    struct Resp {
        #[serde(rename = "syncedLyrics")] synced_lyrics: Option<String>,
        #[serde(rename = "plainLyrics")]  plain_lyrics:  Option<String>,
    }
    let url = format!(
        "https://lrclib.net/api/get?artist_name={}&track_name={}&duration={}",
        urlencoding::encode(artist), urlencoding::encode(title), duration.round() as u64
    );
    println!("[lyrics/lrclib] fetching \"{}\" - \"{}\" dur={}", artist, title, duration.round() as u64);
    let resp = match client.get(&url).send().await {
        Ok(r) => r,
        Err(e) => { println!("[lyrics/lrclib] request failed: {e}"); return None; }
    };
    if !resp.status().is_success() {
        println!("[lyrics/lrclib] non-success status: {}", resp.status());
        return None;
    }
    let body: Resp = match resp.json().await {
        Ok(b) => b,
        Err(e) => { println!("[lyrics/lrclib] parse failed: {e}"); return None; }
    };
    if let Some(lrc) = body.synced_lyrics {
        let lines = parse_lrc(&lrc);
        if !lines.is_empty() {
            println!("[lyrics/lrclib] got {} synced lines", lines.len());
            return Some(lines);
        }
        println!("[lyrics/lrclib] synced lrc parsed to 0 lines");
    }
    if let Some(plain) = body.plain_lyrics {
        let lines: Vec<LyricLine> = plain.lines()
            .filter(|l| !l.trim().is_empty())
            .enumerate()
            .map(|(i, l)| LyricLine { time: i as f64 * 3.0, text: l.to_string() })
            .collect();
        if !lines.is_empty() {
            println!("[lyrics/lrclib] got {} plain lines", lines.len());
            return Some(lines);
        }
    }
    println!("[lyrics/lrclib] no lyrics found");
    None
}

pub async fn lyricsovh(artist: &str, title: &str) -> Option<Vec<LyricLine>> {
    let client = match mk_client(5) {
        Some(c) => c,
        None => { println!("[lyrics/ovh] failed to build http client"); return None; }
    };
    #[derive(serde::Deserialize)]
    struct Resp { lyrics: Option<String> }
    let url = format!(
        "https://api.lyrics.ovh/v1/{}/{}",
        urlencoding::encode(artist), urlencoding::encode(title)
    );
    println!("[lyrics/ovh] fetching \"{}\" - \"{}\"", artist, title);
    let resp = match client.get(&url).send().await {
        Ok(r) => r,
        Err(e) => { println!("[lyrics/ovh] request failed: {e}"); return None; }
    };
    if !resp.status().is_success() {
        println!("[lyrics/ovh] non-success status: {}", resp.status());
        return None;
    }
    let body: Resp = match resp.json().await {
        Ok(b) => b,
        Err(e) => { println!("[lyrics/ovh] parse failed: {e}"); return None; }
    };
    let plain = body.lyrics?;
    let lines: Vec<LyricLine> = plain.lines()
        .filter(|l| !l.trim().is_empty())
        .enumerate()
        .map(|(i, l)| LyricLine { time: i as f64 * 3.0, text: l.to_string() })
        .collect();
    if lines.is_empty() {
        println!("[lyrics/ovh] no lyrics found");
        return None;
    }
    println!("[lyrics/ovh] got {} plain lines", lines.len());
    Some(lines)
}
