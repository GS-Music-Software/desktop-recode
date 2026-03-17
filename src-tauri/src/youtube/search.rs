use super::types::YtSearchResult;

pub async fn search_yt(query: &str) -> Result<Vec<YtSearchResult>, String> {
    let rp = super::player::rp()?;
    let res = rp.query().music_search_tracks(query).await.map_err(|e| format!("search failed: {e}"))?;

    let results: Vec<YtSearchResult> = res.items.items.iter().map(|t| {
        let artist = t.artists.iter().map(|a| a.name.as_str()).collect::<Vec<_>>().join(", ");
        let thumbnail = t.cover.last().map(|c| c.url.to_string()).unwrap_or_default();

        YtSearchResult {
            video_id: t.id.clone(),
            title: t.name.clone(),
            artist,
            duration: t.duration.unwrap_or(0) as u64,
            thumbnail,
        }
    }).collect();

    Ok(results)
}
