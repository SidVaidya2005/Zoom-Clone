# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack video conferencing web application (Zoom clone) with a React frontend and Node.js/Express backend.

## Commands

### Frontend (`/frontend`)
```bash
npm start       # Dev server on http://localhost:3000
npm run build   # Production build
npm test        # Run tests (Jest + React Testing Library)
```

### Backend (`/backend`)
```bash
npm run dev     # Development with nodemon hot reload on port 8000
npm start       # Production start
npm run prod    # Start with PM2 process manager
```

## Architecture

### Communication Patterns

The frontend communicates with the backend via two channels:

1. **REST API** (auth + history) — Axios client targeting `/api/v1/users`:
   - `POST /register`, `POST /login` — auth endpoints returning a 40-char hex token
   - `POST /add_to_activity`, `GET /get_all_activity` — meeting history

2. **Socket.IO** (real-time signaling) — used for WebRTC peer discovery and in-meeting chat:
   - `join-call` — user joins a room (keyed by URL path/meeting code)
   - `signal` — relay WebRTC SDP offer/answer/ICE candidates between peers
   - `chat-message` — broadcast chat messages within a room

### Video Call Flow

1. User enters a meeting code on `/home` (or `/guest`) → navigates to `/:meetingCode`
2. `VideoMeet.jsx` shows a **lobby screen** — ASCII canvas background, topbar with `[HOME]`, name input, camera/mic toggle buttons, and live video preview
3. User toggles camera/mic on/off in the lobby before joining, then clicks `[JOIN]`
4. Component requests camera/mic via `getUserMedia`, then connects via Socket.IO
5. Server maintains `connections[path]` (socket IDs per room) and notifies existing peers
6. Peers exchange SDP via `signal` events through the server; direct WebRTC connections form
7. STUN server: `stun:stun.l.google.com:19302`

### Authentication

- Token stored in `localStorage`; no JWT — backend looks up the token directly in MongoDB
- `withAuth.jsx` HOC guards authenticated routes (e.g., `/home`, `/history`)
- Passwords hashed with bcrypt (10 rounds)
- `/guest` is an unprotected route — skips auth guard and meeting history tracking; intended for unauthenticated users joining a meeting directly

### Environment Configuration

**Backend** requires a `.env` file:
```
MONGO_URL=mongodb+srv://...
PORT=8000  # optional
```

**Frontend** backend URL is toggled in `frontend/src/environment.js` via `IS_PROD` flag — set to `false` for local development to target `http://localhost:8000`.

## Frontend Design System

All pages share a consistent **gold brutalist** aesthetic:

- **Colors**: `#D4A017` gold on `#080808` near-black; no blue/cyan anywhere
- **Typography**: `Anton` / `Syne` for display headings; `JetBrains Mono` for all UI labels, buttons, inputs, and body text; `Playfair Display` italic for decorative script accents
- **Shape**: `border-radius: 0` everywhere — sharp corners, no pill shapes, no rounded cards
- **Borders**: `rgba(212, 160, 23, 0.18–0.35)` gold at varying opacity; hover state brightens border
- **Buttons**: Bracket notation (`[HOME]`, `[JOIN]`, `[SEND]`, etc.); gold fill when active/primary, transparent with gold border when secondary
- **Background**: Animated ASCII canvas (same `useEffect` pattern reused across pages) — `JetBrains Mono` characters at `rgba(185, 138, 18, 0.42)`, updating ~0.8% of cells per 80ms tick; covered by a radial + linear gradient overlay
- **Topbar pattern**: `landingTopBar` (global App.css class) — flex row with `authTopLeft` nav group (`[HOME]` + `[V_C_26]`), centered `landingBrand` (`VideoCircle®`), right `bracketLabel` indicating current page

### Key Files

| File | Purpose |
|------|---------|
| `backend/src/app.js` | Express + Socket.IO initialization |
| `backend/src/controllers/socketManager.js` | WebRTC signaling logic |
| `backend/src/controllers/user.controller.js` | Auth + history API handlers |
| `frontend/src/App.js` | Route definitions |
| `frontend/src/contexts/AuthContext.jsx` | Auth context + Axios client |
| `frontend/src/App.css` | Global shared styles for all pages — landing, auth, guest, history; defines `landingTopBar`, `navLinkBracket`, `bracketLabel`, `landingBrand`, `authTopLeft`, and all page-specific classes |
| `frontend/src/pages/landing.jsx` | Landing page (`/`) — ASCII canvas, topbar with `[JOIN AS GUEST]`, `[REGISTER]`, `[LOGIN]`; large Anton hero title |
| `frontend/src/pages/authentication.jsx` | Auth page (`/auth`) — ASCII canvas, topbar with `[HOME]`, tabbed sign-in/register form in gold-bordered panel |
| `frontend/src/pages/guest.jsx` | Guest join page (`/guest`) — unprotected, ASCII canvas, topbar with `[HOME]`, meeting code input; no history tracking |
| `frontend/src/pages/home.jsx` | Home page (`/home`) — authenticated; meeting code input to start/join a call |
| `frontend/src/pages/history.jsx` | History page (`/history`) — ASCII canvas (position: fixed), topbar with `[HOME]`, Anton heading "MEETING HISTORY", gold-bordered stacked card list (meeting code + date per row); empty state shows `[∅]` symbol |
| `frontend/src/pages/VideoMeet.jsx` | Video call component (`/:meetingCode`) — **lobby**: ASCII canvas, topbar with `[HOME]`, name input, `[JOIN]` button, live preview, `[camera]`/`[mic]` toggle buttons (gold fill = on, transparent = off); **in-call**: black background, peer video grid (gold borders, sharp corners), self-video pip (bottom-left), flat gold-bordered control bar with icon buttons, `[CHAT]` side panel (330px, JetBrains Mono, gold text, `[SEND]` button) |
| `frontend/src/styles/videoComponent.module.css` | All styles for the lobby and in-call screens |
| `frontend/src/environment.js` | Backend URL config (toggle `IS_PROD`) |
