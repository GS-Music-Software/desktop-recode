use super::types::{LyricLine, mk_client, parse_lrc};

pub async fn netease_id(client: &reqwest::Client, artist: &str, title: &str) -> Option<u64> {
    #[derive(serde::Deserialize)]
    struct Song { id: u64 }
    #[derive(serde::Deserialize)]
    struct Res { songs: Option<Vec<Song>> }
    #[derive(serde::Deserialize)]
    struct Body { result: Option<Res> }

    let q = format!("{} {}", artist, title);
    let url = format!(
        "http://music.163.com/api/search/get?s={}&type=1&limit=5&offset=0",
        urlencoding::encode(&q)
    );
    println!("[lyrics/netease] searching id for \"{}\" - \"{}\"", artist, title);
    let resp = match client.get(&url).header("Referer", "http://music.163.com/").send().await {
        Ok(r) => r,
        Err(e) => { println!("[lyrics/netease] search request failed: {e}"); return None; }
    };
    let body: Body = match resp.json().await {
        Ok(b) => b,
        Err(e) => { println!("[lyrics/netease] search parse failed: {e}"); return None; }
    };
    let id = body.result?.songs?.into_iter().next()?.id;
    println!("[lyrics/netease] found id {id}");
    Some(id)
}

async fn netease_lrc(client: &reqwest::Client, id: u64) -> Option<Vec<LyricLine>> {
    #[derive(serde::Deserialize)]
    struct Lrc { lyric: Option<String> }
    #[derive(serde::Deserialize)]
    struct Body { lrc: Option<Lrc> }

    let url = format!("http://music.163.com/api/song/lyric?id={}&lv=1&kv=1&tv=-1", id);
    println!("[lyrics/netease] fetching lrc for id {id}");
    let resp = match client.get(&url).header("Referer", "http://music.163.com/").send().await {
        Ok(r) => r,
        Err(e) => { println!("[lyrics/netease] lrc request failed: {e}"); return None; }
    };
    let body: Body = match resp.json().await {
        Ok(b) => b,
        Err(e) => { println!("[lyrics/netease] lrc parse failed: {e}"); return None; }
    };
    let lrc = body.lrc?.lyric?;
    let lines = parse_lrc(&lrc);
    if lines.is_empty() {
        println!("[lyrics/netease] lrc parsed but got 0 lines");
        return None;
    }
    println!("[lyrics/netease] got {} lines", lines.len());
    Some(lines)
}

pub async fn netease_search(artist: &str, title: &str) -> Option<Vec<LyricLine>> {
    let client = match mk_client(5) {
        Some(c) => c,
        None => { println!("[lyrics/netease] failed to build http client"); return None; }
    };
    let id = netease_id(&client, artist, title).await?;
    netease_lrc(&client, id).await
}
