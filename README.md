# FACEIT Analyzer

A sleek, Apple-style FACEIT match analyzer that helps you dominate your CS2 matches.

![Dark Theme](https://img.shields.io/badge/theme-dark-black)
![Next.js](https://img.shields.io/badge/frontend-Next.js%2015-blue)
![Go](https://img.shields.io/badge/backend-Go-00ADD8)

## Features

- 🎯 **Match Analysis** - Paste any FACEIT match URL to analyze both teams
- 👥 **Player Stats** - Deep dive into all 10 players' stats, K/D, HS%, and recent form
- 🗺️ **Map Recommendations** - Get the best map to pick and which maps to ban
- ⚔️ **Side Selection** - Know whether to start T or CT based on team playstyles
- 📊 **Win Probability** - AI-calculated win chance based on team comparisons
- 🎮 **Strategy Generation** - Get tactical suggestions based on opponent weaknesses
- 💾 **Save Username** - Store your FACEIT username for personalized analysis

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

### Analyze Request

```json
{
  "matchUrl": "https://www.faceit.com/en/cs2/room/1-abc123",
  "username": "YourFACEITName",
  "apiKey": "optional-api-key"
}
```

## License

Personal use only.
