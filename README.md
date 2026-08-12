# 🎮 Virtual Social Lounge

[![CI/CD Pipeline](https://github.com/dev-sujan/virtual-lounge/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/dev-sujan/virtual-lounge/actions/workflows/ci-cd.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://dev-sujan.github.io/virtual-lounge/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A real-time, peer-to-peer virtual hangout room where friends can chat with advanced mobile touch gestures, make WebRTC video calls, listen to synchronized YouTube music with an audio equalizer & ambient sound mixer, and play interactive mini-games together.

🚀 **Live App**: [https://dev-sujan.github.io/virtual-lounge/](https://dev-sujan.github.io/virtual-lounge/)  
📖 **Complete User Manual**: [USER_MANUAL.md](USER_MANUAL.md)

---

## ✨ Features at a Glance

- 📱 **Mobile Touch UX & Gestures**:
  - **Swipe Right to Reply**: Drag message right to attach reply with haptic vibration.
  - **Press & Hold**: 450ms held opens quick reaction menu & action toolbar.
  - **Double-Tap Heart**: Double tap message bubble for `❤️` reaction + animated floating heart burst.
  - **Top Message Safety**: Options automatically position below top messages to prevent header clipping.
  - **Centered Latest Messages Button**: Centered glassmorphic floating button for quick feed scrolling.
- 💬 **Advanced Chat Suite**:
  - **Text-to-Speech (TTS) Reader**: Listen to messages read aloud via Web Speech API.
  - **Starred / Saved Bookmarks**: Star messages (`Star`) and filter bookmarked items in the `Saved` tab.
  - **Voice Notes & Speed Toggle**: Record voice notes with live audio waveforms; adjust playback speed (`1x`, `1.5x`, `2x`).
  - **Interactive Polls & Slash Commands**: `/poll`, `/8ball`, `/dice`, `/coin`, `/shrug`, `/tableflip`, `/unflip`.
  - **Vanish Mode**: Self-destructing flame messages (`Flame`).
- 📹 **Peer-to-Peer Video Call**: Real-time video & audio streaming powered by WebRTC & PeerJS with floating draggable bar.
- 🎵 **Synchronized Music & Audio**:
  - Shared YouTube media player queue.
  - 10-Band Graphic Equalizer with audio presets.
  - Ambient background sound mixer (Rain, Cafe, Ocean Waves, Fireplace, White Noise).
- 🎯 **Interactive Mini-Games**: Tic-Tac-Toe, Connect Four, Rock-Paper-Scissors, and Music Trivia Challenge.
- 🎨 **Dynamic Themes**: 6 curated glassmorphic room themes (Cyberpunk, Midnight Velvet, Neon Sunset, Lofi Study, Emerald Forest, Sunset Glow).

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Real-Time Communication**: [WebRTC](https://webrtc.org/) & [PeerJS](https://peerjs.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Deployment & CI/CD**: [GitHub Actions](https://github.com/features/actions) & [GitHub Pages](https://pages.github.com/)

---

## 💻 Quick Start

### Prerequisites
- Node.js `^20.0.0` or higher
- `npm`

### Installation & Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/dev-sujan/virtual-lounge.git
   cd virtual-lounge
   ```

2. Install dependencies:
   ```bash
   npm install --force
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

---

## 📜 Available Scripts

- `npm run dev` - Launches local development server with Vite HMR
- `npm run build` - Compiles TypeScript and builds production bundle
- `npm run lint` - Runs Oxlint to check code quality
- `npm run preview` - Previews production build locally

---

## 📄 Documentation

For full feature manuals, touch gesture guides, and CI/CD setup, see [USER_MANUAL.md](USER_MANUAL.md).

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
