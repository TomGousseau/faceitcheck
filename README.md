# FACEIT CS2 Match Analyzer

A modern, real-time FACEIT match analyzer with WebSocket support that helps you dominate your CS2 matches.

![Dark Theme](https://img.shields.io/badge/theme-dark-black)
![Next.js](https://img.shields.io/badge/frontend-Next.js%2015-blue)
![Go](https://img.shields.io/badge/backend-Go-00ADD8)
![WebSocket](https://img.shields.io/badge/realtime-WebSocket-green)

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
- 🗺️ **Interactive Map Display** - Visual tactical maps for all CS2 maps
- 📍 **Strategy Suggestions** - A/B site strategies with utility callouts
- 🎯 **Solo & Team Strategies** - Personal tips and team execution plans
- 💰 **Economy Guide** - Buy recommendations for all economy states

### UI/UX
- 🌙 **Dark Theme** - Modern dark UI with glassmorphism effects
- ✨ **Smooth Animations** - Framer Motion powered transitions
- 📱 **Responsive Design** - Works on desktop and mobile
- ⚙️ **Settings Panel** - Configure username, auto-refresh, and more

## Quick Start

### Frontend (Next.js with Turbo)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000

### Backend (Go)

```bash
cd backend
go mod tidy
go run main.go
```

Backend runs on http://localhost:8080

## Configuration

### Environment Variables

Copy `.env.example` to `.env` in the backend folder and configure:

```env
# FACEIT API Keys
FACEIT_PUBLIC_KEY=your_public_key_here
FACEIT_PRIVATE_KEY=your_private_key_here

# Demo Analysis (CPU intensive, optional)
ENABLE_DEMO_ANALYSIS=no    # Set to "yes" to enable
DEMO_ANALYSIS_COUNT=3       # Demos to analyze per player
DEMO_CACHE_DIR=./demo_cache
MAX_CONCURRENT_DOWNLOADS=2
```

### Demo Analysis (Advanced)

The analyzer can parse actual CS2 demo files to extract:
- **Kill/Death Heatmaps** - See where players fight on each map
- **Position Tendencies** - Identify common areas each player plays
- **Detailed ADR** - Accurate damage stats from demo parsing

⚠️ **Warning**: Demo analysis is CPU intensive. Enable only if needed.

To enable:
1. Set `ENABLE_DEMO_ANALYSIS=yes` in `.env`
2. Restart the backend
3. Demos will be downloaded and cached in `demo_cache/`

1. Click the ⚙️ settings icon in the top-right
2. Enter your FACEIT username
3. (Optional) Add your FACEIT API key for enhanced data

### Getting a FACEIT API Key

1. Go to https://developers.faceit.com/
2. Create an application
3. Copy your API key
4. Paste it in the settings

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
