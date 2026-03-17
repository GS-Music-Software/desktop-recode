#[derive(serde::Serialize, Clone)]
pub struct LyricLine {
    pub time: f64,
    pub text: String,
}

#[derive(serde::Serialize)]
pub struct RichSyncResult {
    pub source: String,
    pub data: String,
}

pub fn mk_client(timeout_secs: u64) -> Option<reqwest::Client> {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(timeout_secs))
        .user_agent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .ok()
}

pub fn is_credit(text: &str) -> bool {
    let t = text.trim();
    let prefixes = [
        "作词", "作曲", "编曲", "制作", "混音", "母带", "录音", "监制",
        "词：", "曲：", "词:", "曲:", "演唱", "原唱", "翻唱", "和声",
        "Lyricist", "Composer", "Arranger", "Producer", "Mixing",
        "Written by", "Produced by", "Mixed by", "Arranged by",
        "Mastered by", "Recording by",
    ];
    for p in prefixes {
        if t.starts_with(p) { return true; }
    }
    if t.contains("：") || t.contains(":") {
        let before = t.split(&['：', ':'][..]).next().unwrap_or("");
        let b = before.trim();
        if !b.is_empty() && b.len() <= 12 && !b.chars().any(|c| c == ' ' && b.len() > 6) {
            if b.chars().all(|c| c.is_alphabetic() || c == ' ' || c == '-') {
                return false;
            }
            let has_cjk = b.chars().any(|c| ('\u{4e00}'..='\u{9fff}').contains(&c));
            if has_cjk && b.chars().count() <= 4 { return true; }
        }
    }
    false
}

fn parse_lrc_line(raw: &str) -> Option<(f64, String)> {
    let raw = raw.trim();
    if !raw.starts_with('[') { return None; }
    let end = raw.find(']')?;
    let tag = &raw[1..end];
    let text = raw[end + 1..].trim();
    if text.is_empty() { return None; }
    let colon = tag.find(':')?;
    let mins: f64 = tag[..colon].parse().ok()?;
    let secs: f64 = tag[colon + 1..].parse().ok()?;
    Some((mins * 60.0 + secs, text.to_string()))
}

pub fn parse_lrc(lrc: &str) -> Vec<LyricLine> {
    let mut lines: Vec<LyricLine> = lrc
        .lines()
        .filter_map(|raw| {
            let (time, text) = parse_lrc_line(raw)?;
            if is_credit(&text) { return None; }
            Some(LyricLine { time, text })
        })
        .collect();
    lines.sort_by(|a, b| a.time.partial_cmp(&b.time).unwrap_or(std::cmp::Ordering::Equal));
    lines
}
