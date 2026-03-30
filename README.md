<div align="center">
  <img src="frontend/public/logo3.png" alt="VideoCircle Logo" width="120" />

  <h1>VideoCircle</h1>

  <p>A full-stack real-time video conferencing web application built with WebRTC, Socket.IO, and React.</p>

  <p>
    <a href="https://zoom-clone-teal-gamma.vercel.app" target="_blank">
      <img src="https://img.shields.io/badge/Live%20Demo-zoom--clone--teal--gamma.vercel.app-D4A017?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" />
    <img src="https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white" />
    <img src="https://img.shields.io/badge/Socket.IO-4-010101?style=flat-square&logo=socket.io&logoColor=white" />
    <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" />
    <img src="https://img.shields.io/badge/WebRTC-Peer--to--Peer-333?style=flat-square&logo=webrtc&logoColor=white" />
    <img src="https://img.shields.io/badge/Deployed-Vercel-000?style=flat-square&logo=vercel&logoColor=white" />
  </p>
</div>

---

## Overview

VideoCircle is a full-stack video conferencing application that lets users host and join real-time video calls directly in the browser — no plugins or downloads required. It supports multi-participant calls with live camera/mic toggling, screen sharing, in-call chat, and a meeting history dashboard.

**Key Features:**

- **Multi-participant video calls** — peer-to-peer WebRTC connections via STUN server negotiation
- **Lobby screen** — preview your camera and toggle audio/video before joining a call
- **In-call chat** — real-time messages broadcast to all participants in the room
- **Screen sharing** — share your screen with all call participants
- **Guest access** — join any meeting without registering
- **Meeting history** — authenticated users can view a log of all past sessions
- **Token-based auth** — secure registration and login with bcrypt-hashed passwords and 7-day session tokens
- **Gold brutalist UI** — distinctive aesthetic with animated ASCII canvas backgrounds, Anton/JetBrains Mono typography, and sharp-cornered bracket-notation controls

---

## Live Demo

**Frontend:** [https://zoom-clone-teal-gamma.vercel.app](https://zoom-clone-teal-gamma.vercel.app)

> The backend is hosted on Render (free tier — may have a cold start delay of ~30s on first request).

---

## Screenshots

<div align="center">
  <img src="frontend/public/in_call_experience.png" alt="In-Call Experience" width="800" />
  <p><em>In-call view with video grid, controls, and chat panel</em></p>

  <img src="frontend/public/mobile.png" alt="Mobile View" width="350" />
  <p><em>Responsive mobile layout</em></p>
</div>

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router v6, Material-UI v5 |
| **Real-time** | Socket.IO v4 (client + server) |
| **Video/Audio** | WebRTC (`getUserMedia`, `RTCPeerConnection`, `getDisplayMedia`) |
| **HTTP Client** | Axios |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Authentication** | Custom token (crypto hex), bcrypt (10 rounds) |
| **Process Manager** | PM2 (production), Nodemon (development) |
| **Frontend Hosting** | Vercel |
| **Backend Hosting** | Render |

---

## Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│                                                             │
│  React App (Vercel)                                         │
│  ┌─────────────┐   REST (Axios)   ┌──────────────────────┐ │
│  │ Auth Pages  │ ──────────────── │                      │ │
│  │ Home / Hist │                  │  Express Backend      │ │
│  └─────────────┘                  │  (Render)            │ │
│                                   │                      │ │
│  ┌─────────────┐  Socket.IO WS    │  Socket.IO Server    │ │
│  │ VideoMeet   │ ─────────────── │                      │ │
│  │ Component   │                  └────────┬─────────────┘ │
│  └──────┬──────┘                           │               │
│         │  WebRTC (direct P2P)             │ Mongoose      │
│         └──────────────────────┐           ▼               │
│                                │    MongoDB Atlas          │
│  ┌─────────────┐               │    ┌──────────────────┐  │
│  │  Peer Browser│◄─────────────┘    │ users collection  │  │
│  └─────────────┘   ICE/SDP via      │ meetings collection│  │
│                    Socket relay     └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

1. User registers → password hashed with bcrypt → stored in MongoDB
2. Login → server generates a 40-char hex token with 7-day expiry → returned to client
3. Token stored in `localStorage`; sent as `Authorization: Bearer <token>` on protected requests
4. `withAuth.jsx` HOC validates token on every protected route load

### Video Call Flow

1. User navigates to `/home` → enters a meeting code → navigated to `/:meetingCode`
2. **Lobby screen** — camera/mic preview, name entry, toggle controls
3. `[JOIN]` clicked → `getUserMedia` streams camera/mic → Socket.IO connects to server
4. Server receives `join-call` → broadcasts `user-joined` to all sockets in the room
5. Peers exchange **SDP offer/answer** and **ICE candidates** via `signal` relay events
6. Direct WebRTC `RTCPeerConnection` established between peers (STUN: `stun.l.google.com:19302`)
7. Chat messages broadcast via `chat-message` Socket.IO event
8. On disconnect, server emits `user-left` → peers remove the video stream from the grid

---

## Project Structure

```
Zoom-Clone/
├── frontend/                    # React CRA app (Vercel)
│   ├── public/
│   │   ├── logo3.png            # App logo
│   │   ├── in_call_experience.png
│   │   └── mobile.png
│   └── src/
│       ├── App.js               # Route definitions
│       ├── App.css              # Global gold-brutalist styles
│       ├── environment.js       # Backend URL config
│       ├── components/
│       │   └── meet/
│       │       ├── ChatPanel.jsx        # In-call chat UI
│       │       ├── ConferenceGrid.jsx   # Peer video grid
│       │       ├── LobbyScreen.jsx      # Pre-join preview
│       │       └── MeetControls.jsx     # Camera/mic/screen controls
│       ├── contexts/
│       │   └── AuthContext.jsx  # Axios client, auth + history functions
│       ├── hooks/
│       │   ├── useASCIICanvas.js        # Animated ASCII background
│       │   └── useVideoMeet.js          # WebRTC + Socket.IO logic
│       ├── pages/
│       │   ├── landing.jsx      # Landing page (/)
│       │   ├── authentication.jsx # Register/login (/auth)
│       │   ├── home.jsx         # Authenticated home (/home)
│       │   ├── joinmeet.jsx     # Guest join (/guest)
│       │   ├── history.jsx      # Meeting history (/history)
│       │   └── VideoMeet.jsx    # Video call (:meetingCode)
│       ├── styles/
│       │   └── videoComponent.module.css # Video call styles
│       └── utils/
│           └── withAuth.jsx     # Auth guard HOC
│
├── backend/                     # Node.js / Express server (Render)
│   └── src/
│       ├── app.js               # Express + Socket.IO init, MongoDB connect
│       ├── controllers/
│       │   ├── socketManager.js # WebRTC signaling logic
│       │   └── user.controller.js # Auth + history handlers
│       ├── models/
│       │   ├── user.model.js    # User schema (name, username, token)
│       │   └── meeting.model.js # Meeting schema (user_id, code, date)
│       └── routes/
│           └── users.routes.js  # API route definitions + rate limiting
│
├── vercel.json                  # Vercel frontend-only build config
└── README.md
```

---

## Installation & Setup

### Prerequisites

- Node.js 18+
- npm 9+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/SidVaidya2005/Zoom-Clone.git
cd Zoom-Clone
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
PORT=8000
```

> **MongoDB Atlas**: Go to **Network Access** and add `0.0.0.0/0` (or your machine's IP) to allow connections.

Start the backend:

```bash
npm run dev        # Development (nodemon hot reload)
# or
npm start          # Production
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

Optionally create a `.env.local` file to point to your backend:

```env
REACT_APP_SERVER_URL=http://localhost:8000
```

> If omitted, the frontend defaults to `http://localhost:8000`.

Start the frontend:

```bash
npm start          # Dev server on http://localhost:3000
```

---

## Usage

| Route | Description | Auth Required |
|---|---|---|
| `/` | Landing page | No |
| `/auth` | Register or login | No |
| `/home` | Enter a meeting code to join or start a call | Yes |
| `/guest` | Join a meeting as a guest (no account needed) | No |
| `/:meetingCode` | Live video call room | No |
| `/history` | View all past meetings | Yes |

### Joining a call

1. Open the app and click **[JOIN AS GUEST]** or log in.
2. Enter any meeting code (e.g., `my-team-standup`).
3. On the lobby screen, preview your camera, toggle camera/mic, enter your name.
4. Click **[JOIN]** to enter the call.
5. Share the same URL with others — they join instantly.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URL` | Yes | MongoDB Atlas connection string |
| `PORT` | No | Server port (default: `8000`) |

### Frontend (`.env.local` or Vercel env)

| Variable | Required | Description |
|---|---|---|
| `REACT_APP_SERVER_URL` | No | Backend base URL (default: `http://localhost:8000`) |

---

## API Endpoints

All routes are prefixed with `/api/v1/users`. Rate limited to **100 requests per 15 minutes** per IP.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | No | Create a new account |
| `POST` | `/login` | No | Authenticate and receive a session token |
| `GET` | `/verify` | Bearer token | Validate an existing session token |
| `POST` | `/add_to_activity` | Bearer token | Log a meeting to history |
| `GET` | `/get_all_activity` | Bearer token | Fetch all meetings for the current user |

### Request/Response Examples

**POST `/register`**
```json
// Request
{ "name": "Jane Doe", "username": "janedoe", "password": "secret123" }

// Response 200
{ "message": "User registered successfully" }
```

**POST `/login`**
```json
// Request
{ "username": "janedoe", "password": "secret123" }

// Response 200
{ "token": "a3f9c2d1...", "username": "janedoe", "name": "Jane Doe" }
```

**GET `/get_all_activity`**
```json
// Response 200
[
  { "meetingCode": "my-team-standup", "date": "2026-03-30T10:00:00.000Z" },
  { "meetingCode": "design-review", "date": "2026-03-28T15:30:00.000Z" }
]
```

---

## Deployment

### Frontend (Vercel)

The frontend is deployed as a static React build on Vercel. The `vercel.json` in the repo root configures the build:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/build",
  "installCommand": "echo 'skip root install'"
}
```

Set the `REACT_APP_SERVER_URL` environment variable in your Vercel project settings to point to your backend URL.

### Backend (Render / any Node.js host)

The backend requires a persistent server with WebSocket support — it **cannot** be deployed as serverless functions because Socket.IO requires long-lived connections.

Recommended hosts: **Render**, **Railway**, **Fly.io**, **DigitalOcean App Platform**.

```bash
# Production start command
npm start
# or with PM2
npm run prod
```

---

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a pull request

Please follow the existing code style (gold brutalist UI design, bracket-notation controls, JetBrains Mono typography) when contributing frontend changes.

---

## License

This project is licensed under the **ISC License**.

---

## Author

**Siddarth Vaidya**
- GitHub: [@SidVaidya2005](https://github.com/SidVaidya2005)

---

<div align="center">
  <sub>Built with React, Express, WebRTC, and Socket.IO</sub>
</div>
