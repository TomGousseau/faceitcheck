# FACEIT CS2 Match Analyzer

A modern, real-time FACEIT match analyzer with WebSocket support that helps you dominate your CS2 matches.

- AI made website that dont really work and need work 

![Dark Theme](https://img.shields.io/badge/theme-dark-black)
![Next.js](https://img.shields.io/badge/frontend-Next.js%2015-blue)
![Go](https://img.shields.io/badge/backend-Go-00ADD8)
![WebSocket](https://img.shields.io/badge/realtime-WebSocket-green)

> **New user?** Check out the detailed [Setup Guide](SETUP.md) for step-by-step instructions.

## Features

### Core Analysis
- 🎯 **Match Analysis** - Paste any FACEIT match URL to analyze both teams
- 👥 **Player Stats** - Deep stats for all 10 players (K/D, HS%, win rate, recent form)
- 🗺️ **Map Recommendations** - Best map to pick and which maps to ban
- ⚔️ **Side Selection** - Know whether to start T or CT based on team playstyles
- 📊 **Win Probability** - AI-calculated win chance based on team comparisons

### Real-Time Features
- ⚡ **WebSocket Updates** - Live match state changes via WebSocket
- 🔄 **Auto-Refresh** - Configurable auto-refresh (10/15/30/60 seconds)
- 💾 **Match History** - Download match results for up to 1 hour after completion

### Player Behavior Analysis
- 🎤 **Communication** - Voice activity indicators (talkative, callouts, silent)
- ⚠️ **Toxicity Score** - Track potentially toxic players
- 🏆 **Carry/Bottom Detection** - Identify top fraggers and struggling players
- 🤝 **Teamwork Rating** - Player cooperation metrics

### Tactical Tools
- 🗺️ **Map Callouts** - Complete callout reference for all CS2 competitive maps
- 📍 **Strategy Suggestions** - A/B site strategies with utility callouts
- 🎯 **Solo & Team Strategies** - Personal tips and team execution plans
- 💰 **Economy Guide** - Buy recommendations for all economy states
- 🔄 **Map Veto Helper** - Suggested pick/ban order based on team strengths

### Supported Maps
All CS2 competitive maps with complete callout data:
- Mirage, Inferno, Dust2, Nuke, Overpass, Ancient, Anubis, Vertigo

### UI/UX
- 🌙 **Dark Theme** - Modern dark UI with glassmorphism effects
- ✨ **Smooth Animations** - Framer Motion powered transitions
- 📱 **Responsive Design** - Works on desktop and mobile
- ⚙️ **Settings Panel** - Configure username, auto-refresh, and more

## Quick Start

### 1. Clone & Configure

```bash
git clone https://github.com/TomGousseau/faceitcheck.git
cd faceitcheck/backend
cp .env.example .env
# Edit .env with your FACEIT API keys
```

### 2. Start Backend

```bash
cd backend
go mod tidy
go run main.go
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open App

Go to http://localhost:3000

> **Need help?** See the detailed [Setup Guide](SETUP.md) for troubleshooting.

## Getting FACEIT API Keys

1. Go to [developers.faceit.com](https://developers.faceit.com/)
2. Create an application
3. Copy your Client ID and Client Secret
4. Add them to `backend/.env`

See [SETUP.md](SETUP.md) for detailed instructions.

## Usage

1. Open a FACEIT match page
2. Copy the match URL (e.g., `https://www.faceit.com/en/cs2/room/1-abc123`)
3. Paste it into the analyzer
4. Click **Analyze** and get your winning strategy!

## Tech Stack

- **Frontend**: Next.js 15 with Turbopack, React 19, Tailwind CSS, Framer Motion
- **Backend**: Go with Gin framework
- **Styling**: Apple-inspired dark theme with glass morphism
- **Animations**: Smooth transitions and micro-interactions

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Analyze a FACEIT match |
| `/api/health` | GET | Health check |
| `/ws` | WS | WebSocket connection for real-time updates |
| `/api/match/:matchId/state` | GET | Get current match state |
| `/api/match/:matchId/download` | GET | Download match results (1hr expiry) |

### Analyze Request

```json
{
  "matchUrl": "https://www.faceit.com/en/cs2/room/1-abc123",
  "username": "YourFACEITName"
}
```

### WebSocket Connection

Connect to `ws://localhost:8080/ws?matchId=YOUR_MATCH_ID&username=YOUR_USERNAME`

Messages received:
```json
{
  "type": "match_update",
  "matchId": "1-abc123",
  "analysis": { ... },
  "timestamp": "2024-03-06T15:00:00Z"
}
```

## License

Personal use only.
