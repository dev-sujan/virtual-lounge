# 📖 Virtual Social Lounge — Complete User Manual & Feature Documentation

Welcome to the **Virtual Social Lounge** documentation! This manual provides a comprehensive guide to all features, mobile touch gestures, audio controls, WebRTC video calling, chat tools, theme customization, and deployment workflows.

---

## 🌟 1. Overview & Key Capabilities

The **Virtual Social Lounge** is a real-time, peer-to-peer virtual hangout web app designed for seamless communication, media sharing, and social interaction on desktop and mobile touch devices.

- **Live URL**: [https://dev-sujan.github.io/virtual-lounge/](https://dev-sujan.github.io/virtual-lounge/)
- **Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, WebRTC, PeerJS, GitHub Actions.

---

## 📱 2. Mobile UI & Touch Architecture

The application is built for maximum touch-screen fluidity:

- **Touch Viewport Protection**: All modals, popovers, and dropdown menus automatically adapt to mobile screens (`max-sm:fixed max-sm:inset-x-3 max-sm:max-h-[80dvh]`).
- **Touch-Outside Backdrop Dismissal**: Tap anywhere outside active dropdowns (Notifications, Themes, Ambient Sounds, Audio Equalizer, Emoji Pickers) to dismiss them instantly.
- **Enlarged Touch Targets**: Buttons and close controls maintain minimum touch bounds (`44x44px`) for effortless navigation.
- **Scroll Containment**: Horizontal tabs support smooth touch drag without ugly browser scrollbars (`no-scrollbar`).

---

## 💬 3. Mobile Chat & Touch Gestures Manual

### 👆 Touch Gestures
| Gesture | Action | Description |
| :--- | :--- | :--- |
| **Swipe Right** (`Left → Right`) | **Swipe to Reply** | Drag any message bubble right. A `<Reply />` icon slides into view with haptic vibration, attaching the message to the input bar. |
| **Press & Hold** (450ms) | **Quick Menu & Haptics** | Hold down on a message bubble for 450ms. Triggers a haptic pulse and opens the reaction picker & toolbar. |
| **Double Tap** | **Heart Reaction Burst** | Tap a message twice in `< 300ms`. Triggers a dual haptic vibration, reacts with `❤️`, and renders an animated heart burst. |

### 🛠️ Action Toolbar & Top Message Safety
- **Top Message Positioning**: For messages at the top of the feed (index 0–1), the action toolbar dynamically positions **below** the message bubble (`top-full mt-1.5`) so options are never cut off by the header.
- **Copy Text**: Copy raw message content directly to clipboard with haptic confirmation.
- **Text-to-Speech (TTS) Reader**: Tap the speaker icon (`Volume2`) on any message bubble to read text aloud using native Web Speech Synthesis.
- **Starred / Saved Bookmarks**: Tap the star icon (`Star`) to save important messages or links. Access all bookmarked items anytime via the **`Saved`** tab filter.

### 🎙️ Voice Notes & Audio Playback
- **Voice Recorder**: Hold or tap the mic icon to record voice notes with real-time animated equalizer waveform feedback.
- **Playback Speed Toggle**: While listening to a voice note, tap the speed pill (`1x`, `1.5x`, `2x`) to adjust playback rate.

### 📊 Polls, Commands & Vanish Mode
- **Interactive Polls**: Create live voting polls with real-time percentage progress bars via the attachment menu or `/poll "Question" "Option A" "Option B"`.
- **Slash Commands**:
  - `/poll "Question" "OptA" "OptB"` — Launch an interactive poll
  - `/8ball "Question"` — Consult the Magic 8-Ball
  - `/dice` — Roll a 6-sided die
  - `/coin` — Flip a coin (Heads/Tails)
  - `/shrug` — Append `¯\_(ツ)_/¯`
  - `/tableflip` — Append `(╯°□°）╯︵ ┻━┻`
  - `/unflip` — Append `┬─┬ノ( º _ ºノ)`
- **Vanish Mode**: Self-destructing messages with a burning flame visual theme (`Flame`).
- **Centered Latest Messages Button**: Centered glassmorphic floating button (`bottom-16 left-1/2 -translate-x-1/2`) to instantly scroll to the latest messages.

---

## 🎵 4. Synchronized YouTube Music Player & Audio Suite

- **Shared Queue Sync**: Host and peers listen to YouTube music synchronously. Adding track URLs syncs playlist state across all peers.
- **10-Band Graphic Audio Equalizer**: Custom frequency adjustments (Bass Boost, Vocal Booster, Treble Boost, Acoustic, Electronic, Rock, Flat) powered by Web Audio API.
- **Ambient Background Sound Mixer**: Layer ambient sounds (Rain 🌧️, Cafe ☕, Ocean Waves 🌊, Fireplace 🪵, White Noise 📻) behind music playback with individual volume sliders.

---

## 📹 5. WebRTC Video & Voice Calling

- **P2P Video Grid**: Real-time peer-to-peer video calls using WebRTC & PeerJS.
- **Floating Controls**: Minimize video call into a floating bar (`FloatingVideoCall`) or expand to full grid view.
- **Media Controls**: Individual toggles for Microphone, Camera, Screen Sharing, and Local Mute.

---

## 🎮 6. Interactive Lounge Mini-Games

1. **Tic-Tac-Toe**: Classic 3x3 strategy game with multiplayer room turns.
2. **Connect Four**: Grid drop game with real-time peer state updates.
3. **Rock-Paper-Scissors**: Instant decision mini-game.
4. **Music Trivia Challenge**: Multiple-choice trivia questions with timer countdowns and score leaderboards.

---

## 🎨 7. Theme Customization & Notifications

- **Dynamic Theme Selector**: Switch between 6 curated visual themes:
  - 🌌 **Cyberpunk Glow**
  - 🌌 **Midnight Velvet**
  - 🌅 **Neon Sunset**
  - ☕ **Lofi Study**
  - 🌲 **Emerald Forest**
  - 🌇 **Sunset Glow**
- **Notification Center & Toast Alerts**: Real-time popover logging room events, user joins/leaves, track updates, and unread mentions.
- **Room QR Code Generator**: Built-in QR Code generator in `ShareModal` that creates instant scannable QR codes for smartphone camera 1-click lounge entry.
- **WebRTC Latency & Signal Strength Ping**: Real-time PING/PONG data latency measurement (`24ms`) with color-coded signal quality indicators (📶 Green `<60ms` / Yellow / Red).

---

## 🛠️ 8. CI/CD & GitHub Pages Deployment Guide

The repository includes a GitHub Actions workflow (`.github/workflows/ci-cd.yml`) that automatically tests, builds, and deploys the app to GitHub Pages upon pushing to `main`.

### Local Build & Verification Commands
```bash
# 1. Install dependencies
npm install --force

# 2. Check TypeScript type safety (Must exit with code 0)
npx tsc --noEmit

# 3. Check code quality with Oxlint
npm run lint

# 4. Build production bundle
npm run build
```

### GitHub Actions Workflow Flow
1. **Trigger**: Push or PR to branch `main`.
2. **Job 1 (Build & Test)**: Node.js 20 environment, runs `npm run lint`, compiles TypeScript & Vite bundle to `./dist`, uploads artifact.
3. **Job 2 (Deploy to GitHub Pages)**: Automatically publishes `./dist` to GitHub Pages live environment.

---

*Documentation maintained for dev-sujan/virtual-lounge.*
