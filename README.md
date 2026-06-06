# ⚡ BeamIt — Serverless P2P File Transfer

Transfer files directly between devices over WebRTC. No servers. No cloud. No size limits. Completely private.

---

## Overview

BeamIt lets you send files between any two devices on the same network (or across the internet) using a direct WebRTC DataChannel connection. Signaling is done manually via QR codes — no signaling server required. Every file is SHA-256 verified after transfer.

**Stack:** React + Vite · WebRTC DataChannels · QR Code (qrcode + jsqr) · Web Crypto API

---

## Architecture

```
src/
├── components/         # Reusable UI components
│   ├── Button.*        # Button with variants and loading state
│   ├── ConnectionBadge.*  # Live connection state pill
│   ├── DropZone.*      # Drag-and-drop file selection area
│   ├── FileCard.*      # File entry with progress and stats
│   ├── Layout.*        # App shell with sticky header and nav
│   ├── ProgressBar.*   # Animated progress bar
│   ├── QRDisplay.*     # Generate and display QR codes
│   └── QRScanner.*     # Camera-based QR scanning with paste fallback
│
├── hooks/
│   ├── useAppState.jsx  # Global state (useReducer + Context)
│   ├── useTransfer.js   # Wires WebRTC + FileTransfer to React state
│   └── useQRScanner.js  # Camera-based QR scanning hook
│
├── pages/
│   ├── HomePage.*       # Landing page with mode selection
│   ├── CreatePage.*     # Sender flow: show offer QR → scan answer QR
│   ├── JoinPage.*       # Receiver flow: scan offer QR → show answer QR
│   ├── TransferPage.*   # Active transfer UI (drop zone + file queue)
│   ├── HistoryPage.*    # Transfer log
│   └── SettingsPage.*   # App settings
│
├── services/
│   ├── webrtc.js        # RTCPeerConnection wrapper (offer/answer/ICE)
│   └── fileTransfer.js  # Chunked send/receive with SHA-256 integrity
│
├── utils/
│   ├── crypto.js        # SHA-256, hex encoding, format helpers
│   ├── qr.js            # QR code generation, scanning, SDP compression
│   └── files.js         # File icons, validation, download helper
│
└── styles/
    └── global.css       # CSS variables, typography, reset, animations
```

### Connection Flow

```
SENDER                          RECEIVER
──────                          ────────
createOffer()
  → ICE gathering
  → Generate QR ──── scan ───→ createAnswer(offer)
                                 → ICE gathering
scanQR(answer) ←── show QR ─── Display answer QR
acceptAnswer()
  └── WebRTC handshake ──────────────────────────── CONNECTED
```

No server is involved at any point. SDP is exchanged via QR codes displayed on screen.

### File Transfer Protocol

Each file transfer uses a binary framing protocol over the DataChannel:

```
Packet = [fileId: 36 bytes (UTF-8)] [chunkIndex: 4 bytes (uint32 BE)] [data: N bytes]
```

Control messages (metadata, ACK, done, cancel) are sent as JSON strings. The receiver assembles chunks in order and verifies the SHA-256 hash against the metadata sent before transfer begins.

---

## Local Development

```bash
git clone <repo>
cd beamit
npm install
npm run dev
```

Open http://localhost:5173 on two browser tabs (or two devices on the same WiFi).

---

## Testing

```bash
npm test           # Run all tests once
npm run test:watch # Watch mode
```

36 tests covering: SHA-256 hashing, SDP compression/decompression, file utilities, and state management.

---

## Deployment

### GitHub Pages

```bash
npm run build
# Deploy the dist/ folder to GitHub Pages
# Set base in vite.config.js if not at root:
# base: '/your-repo-name/'
```

Or use the [GitHub Pages Action](https://github.com/marketplace/actions/deploy-to-github-pages):

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Cloudflare Pages

1. Connect your GitHub repo in the Cloudflare Pages dashboard
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Deploy — zero config needed

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli
netlify deploy --dir=dist --prod
```

Or add a `netlify.toml`:

```toml
[build]
  command   = "npm run build"
  publish   = "dist"
```

---

## Browser Compatibility

| Browser         | Support |
|----------------|---------|
| Chrome 88+     | ✅ Full  |
| Firefox 78+    | ✅ Full  |
| Safari 15.1+   | ✅ Full  |
| Edge 88+       | ✅ Full  |
| Mobile Chrome  | ✅ Full  |
| Mobile Safari  | ✅ Full  |

WebRTC DataChannels are required. Older browsers without DataChannel support will not work.

---

## Limitations

- **Signaling is manual.** Both devices must be physically present (or share a screen) to exchange QR codes. This is intentional — no server needed.
- **NAT traversal.** On different networks (not same WiFi), connections may fail without a TURN server. Adding a public TURN server URL to `RTC_CONFIG` in `webrtc.js` resolves this.
- **Large file hashing.** SHA-256 of files >1GB may be slow on low-end devices before transfer begins.
- **No resume.** Interrupted transfers must be restarted from the beginning.
- **One sender per session.** Both peers can drop files, but sessions are initiated by one sender.
- **Tab must stay open.** Closing/backgrounding the tab during transfer may interrupt it (especially on mobile Safari).

---

## Security

- All WebRTC DataChannels are DTLS-encrypted by the browser
- No data ever touches a server
- SHA-256 integrity check on every received file
- No `eval`, no `innerHTML`, no unsafe patterns
- Content Security Policy compatible

---

## License

MIT
