mod types;
mod netease;
mod lrclib;
mod musixmatch;

pub use types::{LyricLine, RichSyncResult};

use netease::netease_search;
use lrclib::{lrclib_get, lyricsovh};
use musixmatch::{mxm_subtitle, mxm_richsync};

#[tauri::command]
pub async fn fetch_lyrics(
    artist: String,
    title: String,
    _album: String,
    duration: f64,
    source: String,
) -> Option<Vec<LyricLine>> {
    println!("[lyrics] fetch_lyrics artist=\"{}\" title=\"{}\" duration={} source={}", artist, title, duration, source);
    match source.as_str() {
        "musixmatch" => {
            println!("[lyrics] using musixmatch path");
            let a1 = artist.clone(); let t1 = title.clone();
            let a2 = artist.clone(); let t2 = title.clone();
            let a3 = artist.clone(); let t3 = title.clone();
            let (mxm, lrc, ovh) = tokio::join!(
                tokio::spawn(async move { mxm_subtitle(&a1, &t1).await }),
                tokio::spawn(async move { lrclib_get(&a2, &t2, duration).await }),
                tokio::spawn(async move { lyricsovh(&a3, &t3).await }),
            );
            match mxm {
                Ok(Some(lines)) => { println!("[lyrics] returning {} lines from musixmatch", lines.len()); return Some(lines); }
                Ok(None) => println!("[lyrics] musixmatch returned no lines"),
                Err(e) => println!("[lyrics] musixmatch task failed: {e}"),
            }
            match lrc {
                Ok(Some(lines)) => { println!("[lyrics] returning {} lines from lrclib", lines.len()); return Some(lines); }
                Ok(None) => println!("[lyrics] lrclib returned no lines"),
                Err(e) => println!("[lyrics] lrclib task failed: {e}"),
            }
            match ovh {
                Ok(Some(lines)) => { println!("[lyrics] returning {} lines from lyrics.ovh", lines.len()); return Some(lines); }
                Ok(None) => println!("[lyrics] lyrics.ovh returned no lines"),
                Err(e) => println!("[lyrics] lyrics.ovh task failed: {e}"),
            }
        }
        "netease" => {
            println!("[lyrics] using netease path");
            let a1 = artist.clone(); let t1 = title.clone();
            let a2 = artist.clone(); let t2 = title.clone();
            let a3 = artist.clone(); let t3 = title.clone();
            let (ne, lrc, ovh) = tokio::join!(
                tokio::spawn(async move { netease_search(&a1, &t1).await }),
                tokio::spawn(async move { lrclib_get(&a2, &t2, duration).await }),
                tokio::spawn(async move { lyricsovh(&a3, &t3).await }),
            );
            match ne {
                Ok(Some(lines)) => { println!("[lyrics] returning {} lines from netease", lines.len()); return Some(lines); }
                Ok(None) => println!("[lyrics] netease returned no lines"),
                Err(e) => println!("[lyrics] netease task failed: {e}"),
            }
            match lrc {
                Ok(Some(lines)) => { println!("[lyrics] returning {} lines from lrclib", lines.len()); return Some(lines); }
                Ok(None) => println!("[lyrics] lrclib returned no lines"),
                Err(e) => println!("[lyrics] lrclib task failed: {e}"),
            }
            match ovh {
                Ok(Some(lines)) => { println!("[lyrics] returning {} lines from lyrics.ovh", lines.len()); return Some(lines); }
                Ok(None) => println!("[lyrics] lyrics.ovh returned no lines"),
                Err(e) => println!("[lyrics] lyrics.ovh task failed: {e}"),
            }
        }
        _ => {
            println!("[lyrics] using lrclib path");
            let a1 = artist.clone(); let t1 = title.clone();
            let a2 = artist.clone(); let t2 = title.clone();
            let (lrc, ovh) = tokio::join!(
                tokio::spawn(async move { lrclib_get(&a1, &t1, duration).await }),
                tokio::spawn(async move { lyricsovh(&a2, &t2).await }),
            );
            match lrc {
                Ok(Some(lines)) => { println!("[lyrics] returning {} lines from lrclib", lines.len()); return Some(lines); }
                Ok(None) => println!("[lyrics] lrclib returned no lines"),
                Err(e) => println!("[lyrics] lrclib task failed: {e}"),
            }
            match ovh {
                Ok(Some(lines)) => { println!("[lyrics] returning {} lines from lyrics.ovh", lines.len()); return Some(lines); }
                Ok(None) => println!("[lyrics] lyrics.ovh returned no lines"),
                Err(e) => println!("[lyrics] lyrics.ovh task failed: {e}"),
            }
        }
    }
    println!("[lyrics] all sources failed for \"{}\" - \"{}\"", artist, title);
    None
}

#[tauri::command]
pub async fn fetch_ttml(artist: String, title: String) -> Option<RichSyncResult> {
    use netease::netease_id;
    use types::mk_client;

    println!("[lyrics/ttml] fetch_ttml artist=\"{}\" title=\"{}\"", artist, title);

    let a1 = artist.clone(); let t1 = title.clone();
    let a2 = artist.clone(); let t2 = title.clone();

    let (mxm, ttml) = tokio::join!(
        tokio::spawn(async move { mxm_richsync(&a1, &t1).await }),
        tokio::spawn(async move {
            let client = match mk_client(8) {
                Some(c) => c,
                None => { println!("[lyrics/ttml] failed to build http client"); return None; }
            };
            let id = match netease_id(&client, &a2, &t2).await {
                Some(id) => id,
                None => { println!("[lyrics/ttml] netease id not found"); return None; }
            };
            println!("[lyrics/ttml] fetching ttml for netease id {}", id);
            let url = format!(
                "https://raw.githubusercontent.com/amll-dev/amll-ttml-db/main/ncm-lyrics/{}.ttml",
                id
            );
            let resp = match client.get(&url).send().await {
                Ok(r) => r,
                Err(e) => { println!("[lyrics/ttml] request failed: {e}"); return None; }
            };
            if !resp.status().is_success() {
                println!("[lyrics/ttml] non-success status: {}", resp.status());
                return None;
            }
            let text = match resp.text().await {
                Ok(t) => t,
                Err(e) => { println!("[lyrics/ttml] text read failed: {e}"); return None; }
            };
            println!("[lyrics/ttml] got ttml ({} bytes)", text.len());
            Some(RichSyncResult { source: "ttml".into(), data: text })
        }),
    );

    match mxm {
        Ok(Some(result)) => { println!("[lyrics/ttml] returning richsync result"); return Some(result); }
        Ok(None) => println!("[lyrics/ttml] mxm richsync returned nothing"),
        Err(e) => println!("[lyrics/ttml] mxm richsync task failed: {e}"),
    }
    match ttml {
        Ok(Some(result)) => { println!("[lyrics/ttml] returning ttml result"); return Some(result); }
        Ok(None) => println!("[lyrics/ttml] ttml db returned nothing"),
        Err(e) => println!("[lyrics/ttml] ttml db task failed: {e}"),
    }
    println!("[lyrics/ttml] all sources failed for \"{}\" - \"{}\"", artist, title);
    None
}
