# FACEIT CS2 Analyzer - Setup Guide

Complete setup guide for running the FACEIT CS2 Match Analyzer on your machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **Go 1.21+** - Download from [go.dev](https://go.dev/dl/)
- **Git** - Download from [git-scm.com](https://git-scm.com/)
- **FACEIT Account** - Required for API access

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/TomGousseau/faceitcheck.git
cd faceitcheck
```

### 2. Backend Setup

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your FACEIT API keys
# (See "Getting FACEIT API Keys" section below)

# Install Go dependencies
go mod tidy

# Start the backend server
go run main.go
```

The backend will start on `http://localhost:8080`

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:3000`

### 4. Open the App

Navigate to `http://localhost:3000` in your browser.

---

## Getting FACEIT API Keys

### Step 1: Create a FACEIT Developer Account

1. Go to [developers.faceit.com](https://developers.faceit.com/)
2. Sign in with your FACEIT account
3. Accept the developer terms

### Step 2: Create an Application

1. Go to the Applications section
2. Click "Create Application"
3. Fill in the details:
   - **Name**: Your app name (e.g., "My CS2 Analyzer")
   - **Description**: Brief description
   - **Website**: Can be `http://localhost:3000`
   - **Redirect URL**: `http://localhost:3000/callback` (if using OAuth)
4. Click Create

### Step 3: Get Your API Keys

After creating the application, you'll see:

- **Client ID** - Your public key
- **Client Secret** - Your private/server key (keep this secret!)

### Step 4: Configure Environment

Edit `backend/.env` and add your keys:

```env
# FACEIT API Configuration
FACEIT_PUBLIC_KEY=your_client_id_here
FACEIT_PRIVATE_KEY=your_client_secret_here

# Demo Analysis (optional)
ENABLE_DEMO_ANALYSIS=no
DEMO_ANALYSIS_COUNT=3
DEMO_CACHE_DIR=./demo_cache
```

---

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FACEIT_PUBLIC_KEY` | Your FACEIT Client ID | Required |
| `FACEIT_PRIVATE_KEY` | Your FACEIT Client Secret | Required |
| `ENABLE_DEMO_ANALYSIS` | Enable CS2 demo parsing | `no` |
| `DEMO_ANALYSIS_COUNT` | Demos to analyze per player | `3` |
| `DEMO_CACHE_DIR` | Directory for cached demos | `./demo_cache` |

### Demo Analysis (Advanced)

Demo analysis parses actual CS2 demo files to extract:
- Kill/Death positions
- Player movement patterns
- Detailed ADR and damage stats

**Warning**: Demo analysis is CPU intensive and downloads large files.

To enable:
1. Set `ENABLE_DEMO_ANALYSIS=yes` in `.env`
2. Restart the backend
3. First analysis will be slower while demos download

---

## Project Structure

```
faceitcheck/
├── backend/                 # Go backend server
│   ├── main.go             # Main server & API routes
│   ├── websocket.go        # Real-time WebSocket hub
│   ├── demo_analyzer.go    # CS2 demo parser
│   ├── go.mod              # Go dependencies
│   ├── .env                # Your configuration (git ignored)
│   └── .env.example        # Configuration template
│
├── frontend/               # Next.js frontend
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx    # Main application
│   │       ├── layout.tsx  # App layout
│   │       └── globals.css # Styles
│   ├── public/             # Static assets
│   ├── package.json        # Node dependencies
│   └── next.config.ts      # Next.js config
│
├── README.md               # Project overview
├── SETUP.md                # This file
└── start.bat               # Windows quick start script
```

---

## Features Overview

### Real-Time Updates
- WebSocket connection at `ws://localhost:8080/ws`
- Auto-reconnect on disconnect
- Live match state tracking

### Auto-Refresh
- Configurable intervals: 10s, 15s, 30s, 60s
- Enabled via Settings panel
- Shows last refresh timestamp

### Player Analysis
- ELO rating and skill level
- K/D ratio and headshot percentage
- Win rate and recent form
- Best/worst maps
- Role detection (Entry, AWP, Support, Lurker, IGL)

### Behavior Tracking
- Toxicity score (0-100)
- Voice activity (Silent, Callouts, Talkative)
- Carry/Bottom frag detection
- Teamwork rating

### Tactical Tools
- Map callouts for all CS2 maps
- A/B site strategies
- Player role assignments
- Economy buy recommendations
- Map veto suggestions

### Match Management
- Download results (1 hour after match)
- Team selection when no username set
- Match expiry notifications

---

## API Endpoints

### REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Analyze a FACEIT match |
| `/api/health` | GET | Server health check |
| `/api/match/:id/state` | GET | Get match state |
| `/api/match/:id/download` | GET | Download match results |

### WebSocket

Connect: `ws://localhost:8080/ws?matchId=YOUR_MATCH_ID&username=YOUR_USERNAME`

Messages:
```json
{
  "type": "match_update",
  "matchId": "1-abc123",
  "analysis": { ... },
  "timestamp": "2024-03-06T15:00:00Z"
}
```

---

## Troubleshooting

### Backend won't start

1. Check Go version: `go version` (need 1.21+)
2. Check if port 8080 is free: `netstat -ano | findstr 8080`
3. Verify .env file exists with valid keys

### Frontend won't start

1. Check Node version: `node --version` (need 18+)
2. Delete node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check if port 3000 is free

### FACEIT API errors

1. Verify API keys are correct
2. Check rate limits (FACEIT has limits on requests/minute)
3. Ensure match URL is valid and from a CS2 match

### WebSocket won't connect

1. Make sure backend is running on port 8080
2. Check browser console for errors
3. Try refreshing the page

### Analysis returns empty data

1. The match might be private or not yet started
2. Some players may have private profiles
3. Check backend logs for specific errors

---

## Updating

To get the latest version:

```bash
git pull origin main

# Update backend dependencies
cd backend
go mod tidy

# Update frontend dependencies
cd ../frontend
npm install
```

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## Support

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Search existing GitHub issues
3. Create a new issue with:
   - Your OS and version
   - Node.js and Go versions
   - Error messages from console
   - Steps to reproduce

---

## License

Personal use only. See LICENSE file for details.
