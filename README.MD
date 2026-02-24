# GS Music

a desktop music player built with tauri, react, and rust.

## prerequisites

- [node.js](https://nodejs.org/) (v18+)
- [rust](https://rustup.rs/) (stable)
- [tauri cli prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform

### linux

install these with your package manager:

`libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`

### windows

[microsoft c++ build tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) and [webview2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

## setup

```bash
git clone https://github.com/GS-Music-Software/desktop-recode.git
cd desktop-recode
npm install
```

## development

```bash
npm run tauri dev
```

## build

```bash
npm run tauri build
```
