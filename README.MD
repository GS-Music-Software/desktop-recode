<p align="center">
  <br>
  <img src="https://cdn.discordapp.com/attachments/1482469823488458813/1482470291002101991/icon_final_.png?ex=69b7118c&is=69b5c00c&hm=20e63bc9e3f5a2ba87df904a456f964941e3c05fbc6d1bd822571eb8344e3a44&" alt="GS Music Logo" width="160px">
</p>

<h1 align="center">GS Music</h1>

<p align="center">
  Desktop music player built with Tauri, React, and Rust.
</p>

<p align="center">
  <a href="https://music.strikes.cloud">Website</a> |
  <a href="https://github.com/GS-Music-Software/desktop-recode/issues">Issues</a> |
  <a href="#installation">Installation</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/GS-Music-Software/desktop-recode?style=flat-square&color=66c2cd" alt="Stars">
  <img src="https://img.shields.io/github/v/release/GS-Music-Software/desktop-recode?style=flat-square&color=2588c7" alt="Release">
  <img src="https://img.shields.io/github/actions/workflow/status/GS-Music-Software/desktop-recode/build.yml?style=flat-square" alt="Build">
  <img src="https://img.shields.io/github/license/GS-Music-Software/desktop-recode?style=flat-square&color=df7e4d" alt="License">
  <img src="https://img.shields.io/github/issues/GS-Music-Software/desktop-recode?style=flat-square&color=d6b23a" alt="Issues">
</p>

***

## Features
- **Lyric View:** Immersive, beautiful lyric display.
- **Discover Tab:** Download music directly within the app using `yt-dlp`.
- **Server Integration:** Integration is available for [gs-music-server](https://github.com/GS-Music-Software/gs-music-server) to allow remote library access.
- **Local Playback:** Support for local directory scanning and audio playback.

***

## Prerequisites

Building from source requires:

- **Node.js** (v18+)
- **Rust** (stable)

### Linux
`libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`

### Windows
[C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) and [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

***

## Installation

### Binary
Download the installer from [music.strikes.cloud](https://music.strikes.cloud).

### Build from source
```bash
git clone [https://github.com/GS-Music-Software/desktop-recode.git](https://github.com/GS-Music-Software/desktop-recode.git)
cd desktop-recode
npm install
