use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use discord_rich_presence::{DiscordIpc, DiscordIpcClient, activity};

const APP_ID: &str = "997573826181337258";

pub struct Rpc {
    client: Option<DiscordIpcClient>,
    alive: bool,
    wanted: bool,
}

impl Rpc {
    pub fn new() -> Self {
        Self { client: None, alive: false, wanted: false }
    }

    pub fn on(&mut self) -> bool {
        self.wanted = true;
        if self.alive { return true; }
        self.try_connect()
    }

    fn try_connect(&mut self) -> bool {
        if self.alive { return true; }
        let mut c = DiscordIpcClient::new(APP_ID);
        if c.connect().is_err() { return false; }
        self.client = Some(c);
        self.alive = true;
        true
    }

    pub fn off(&mut self) {
        self.wanted = false;
        if let Some(ref mut c) = self.client {
            let _ = c.clear_activity();
            let _ = c.close();
        }
        self.client = None;
        self.alive = false;
    }

    pub fn set(
        &mut self,
        detail: &str,
        state: &str,
        large_txt: &str,
        cover_url: Option<&str>,
        playing: bool,
        show_ts: bool,
        elapsed: f64,
        duration: f64,
    ) {
        if !self.wanted { return; }
        if !self.alive {
            self.try_connect();
        }
        let c = match self.client.as_mut() {
            Some(c) => c,
            None => return,
        };

        let img = cover_url.unwrap_or("icon");

        let assets = activity::Assets::new()
            .large_image(img)
            .large_text(large_txt)
            .small_image(if playing { "play" } else { "pause" })
            .small_text(if playing { "Playing" } else { "Paused" });

        let mut act = activity::Activity::new()
            .details(detail)
            .state(state)
            .assets(assets)
            .activity_type(activity::ActivityType::Listening);

        if show_ts && playing && duration > 0.0 {
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() as i64;
            let start = now - elapsed as i64;
            let end = start + duration as i64;
            act = act.timestamps(activity::Timestamps::new().start(start).end(end));
        }

        if c.set_activity(act).is_err() {
            self.alive = false;
            self.client = None;
        }
    }

    pub fn clr(&mut self) {
        if let Some(ref mut c) = self.client {
            let _ = c.clear_activity();
        }
    }
}

pub type RpcState = Mutex<Rpc>;

pub fn init() -> RpcState {
    Mutex::new(Rpc::new())
}
