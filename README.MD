# GS Music

A desktop music player built with Tauri, React, and Rust.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) (stable)
- [Tauri CLI prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS

### Linux

Install these with your package manager:

`libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`

### Windows

[Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) and [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

## Setup

```bash
git clone https://github.com/GS-Music-Software/desktop-recode.git
cd desktop-recode
npm install
```

## Development

```bash
npm run tauri dev
```

## Build

```bash
npm run tauri build
```

The compiled binary will be in `src-tauri/target/release/`.
