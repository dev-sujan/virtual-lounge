# 🎮 Virtual Lounge

[![CI/CD Pipeline](https://github.com/dev-sujan/virtual-lounge/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/dev-sujan/virtual-lounge/actions/workflows/ci-cd.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)](https://dev-sujan.github.io/virtual-lounge/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A real-time, peer-to-peer virtual hangout room where friends can chat, make video calls, listen to synchronized music, and play mini-games together.

🚀 **Live App**: [https://dev-sujan.github.io/virtual-lounge/](https://dev-sujan.github.io/virtual-lounge/)

---

## ✨ Features

- 📹 **Peer-to-Peer Video Call**: Real-time video & audio streaming powered by WebRTC & PeerJS.
- 🎵 **Synchronized YouTube Music**: Shared media player queue for listening to music together.
- 💬 **Instant Chat**: Low-latency room chat with emoji support and session awareness.
- 🎯 **Interactive Mini-Games**:
  - ⭕ **Tic-Tac-Toe**
  - 🟡 **Connect Four**
  - ✂️ **Rock-Paper-Scissors**
- 🎨 **Modern Design**: Built with Tailwind CSS v4, smooth animations, and dynamic state management via Zustand.

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

- `npm run dev` - Launches the local development server with Vite HMR
- `npm run build` - Compiles TypeScript and builds the production bundle
- `npm run lint` - Runs Oxlint to check code quality
- `npm run preview` - Previews the production build locally

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
