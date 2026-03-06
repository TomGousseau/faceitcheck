package main

import (
	"compress/gzip"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/joho/godotenv"
	dem "github.com/markus-wa/demoinfocs-golang/v4/pkg/demoinfocs"
	"github.com/markus-wa/demoinfocs-golang/v4/pkg/demoinfocs/common"
	events "github.com/markus-wa/demoinfocs-golang/v4/pkg/demoinfocs/events"
)

// DemoConfig holds demo analysis configuration
type DemoConfig struct {
	Enabled            bool
	DemoCount          int
	CacheDir           string
	MaxConcurrentDownloads int
}

// Position represents a 2D position on the map
type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// KillPosition represents a kill event with positions
type KillPosition struct {
	KillerPos  Position `json:"killerPos"`
	VictimPos  Position `json:"victimPos"`
	Weapon     string   `json:"weapon"`
	Headshot   bool     `json:"headshot"`
	Round      int      `json:"round"`
}

// DeathPosition represents where a player died
type DeathPosition struct {
	Position Position `json:"position"`
	Killer   string   `json:"killer"`
	Weapon   string   `json:"weapon"`
	Round    int      `json:"round"`
}

// PlayerPositions represents average positions for a player
type PlayerPositions struct {
	KillPositions    []Position `json:"killPositions"`
	DeathPositions   []Position `json:"deathPositions"`
	AveragePosition  Position   `json:"averagePosition"`
	CommonAreas      []string   `json:"commonAreas"`
	PlayedSide       string     `json:"playedSide"` // T or CT
}

// DemoPlayerStats represents parsed demo stats for a player
type DemoPlayerStats struct {
	Nickname        string            `json:"nickname"`
	Kills           int               `json:"kills"`
	Deaths          int               `json:"deaths"`
	Assists         int               `json:"assists"`
	ADR             float64           `json:"adr"`
	HSPercent       float64           `json:"hsPercent"`
	FlashAssists    int               `json:"flashAssists"`
	EnemiesFlashed  int               `json:"enemiesFlashed"`
	UtilityDamage   int               `json:"utilityDamage"`
	FirstKills      int               `json:"firstKills"`
	FirstDeaths     int               `json:"firstDeaths"`
	Clutches        int               `json:"clutches"`
	ClutchAttempts  int               `json:"clutchAttempts"`
	TradesKilled    int               `json:"tradesKilled"`   // traded a teammate
	TradesDied      int               `json:"tradesDied"`     // got traded after kill
	Positions       PlayerPositions   `json:"positions"`
	WeaponKills     map[string]int    `json:"weaponKills"`
	RoundByRound    []RoundStats      `json:"roundByRound"`
}

// RoundStats for per-round analysis
type RoundStats struct {
	Round       int     `json:"round"`
	Kills       int     `json:"kills"`
	Deaths      int     `json:"deaths"`
	Damage      int     `json:"damage"`
	Side        string  `json:"side"`
	IsAlive     bool    `json:"isAlive"`
}

// DemoAnalysis represents full demo analysis
type DemoAnalysis struct {
	MatchID     string                     `json:"matchId"`
	Map         string                     `json:"map"`
	Duration    int                        `json:"duration"`
	Team1Score  int                        `json:"team1Score"`
	Team2Score  int                        `json:"team2Score"`
	Players     map[string]*DemoPlayerStats `json:"players"`
}

// HeatmapData for frontend visualization
type HeatmapData struct {
	Map           string      `json:"map"`
	KillHeatmap   []Position  `json:"killHeatmap"`
	DeathHeatmap  []Position  `json:"deathHeatmap"`
	MoveHeatmap   []Position  `json:"moveHeatmap"`
}

// Global demo config
var demoConfig DemoConfig

// Demo cache mutex
var demoCacheMutex sync.Mutex

// InitDemoConfig loads demo configuration from environment
func InitDemoConfig() {
	// Load .env file if exists
	godotenv.Load()

	// Check if demo analysis is enabled
	enabledStr := os.Getenv("ENABLE_DEMO_ANALYSIS")
	demoConfig.Enabled = strings.ToLower(enabledStr) == "yes" || strings.ToLower(enabledStr) == "true" || enabledStr == "1"

	// Demo count
	countStr := os.Getenv("DEMO_ANALYSIS_COUNT")
	count, err := strconv.Atoi(countStr)
	if err != nil || count < 1 {
		count = 3
	}
	demoConfig.DemoCount = count

	// Cache directory
	cacheDir := os.Getenv("DEMO_CACHE_DIR")
	if cacheDir == "" {
		cacheDir = "./demo_cache"
	}
	demoConfig.CacheDir = cacheDir

	// Max concurrent downloads
	maxDownloads := os.Getenv("MAX_CONCURRENT_DOWNLOADS")
	downloads, err := strconv.Atoi(maxDownloads)
	if err != nil || downloads < 1 {
		downloads = 2
	}
	demoConfig.MaxConcurrentDownloads = downloads

	// Create cache directory
	if demoConfig.Enabled {
		os.MkdirAll(demoConfig.CacheDir, 0755)
		fmt.Printf("[Demo Analysis] Enabled - Analyzing %d demos per player, cache: %s\n", 
			demoConfig.DemoCount, demoConfig.CacheDir)
	} else {
		fmt.Println("[Demo Analysis] Disabled")
	}
}

// IsDemoAnalysisEnabled returns if demo analysis is enabled
func IsDemoAnalysisEnabled() bool {
	return demoConfig.Enabled
}

// DownloadDemo downloads a demo file from URL
func DownloadDemo(url string, matchID string) (string, error) {
	demoCacheMutex.Lock()
	defer demoCacheMutex.Unlock()

	// Check if already cached
	filename := filepath.Join(demoConfig.CacheDir, matchID+".dem")
	if _, err := os.Stat(filename); err == nil {
		fmt.Printf("[Demo] Using cached: %s\n", matchID)
		return filename, nil
	}

	fmt.Printf("[Demo] Downloading: %s\n", matchID)

	// Download
	resp, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("failed to download demo: %w", err)
	}
	defer resp.Body.Close()

	// Create temp file
	tempFile := filename + ".tmp"
	out, err := os.Create(tempFile)
	if err != nil {
		return "", fmt.Errorf("failed to create temp file: %w", err)
	}

	// Check if gzipped
	var reader io.Reader = resp.Body
	if strings.HasSuffix(url, ".gz") || resp.Header.Get("Content-Type") == "application/gzip" {
		gzReader, err := gzip.NewReader(resp.Body)
		if err != nil {
			out.Close()
			os.Remove(tempFile)
			return "", fmt.Errorf("failed to create gzip reader: %w", err)
		}
		defer gzReader.Close()
		reader = gzReader
	}

	// Copy
	_, err = io.Copy(out, reader)
	out.Close()
	if err != nil {
		os.Remove(tempFile)
		return "", fmt.Errorf("failed to write demo: %w", err)
	}

	// Rename to final filename
	os.Rename(tempFile, filename)
	return filename, nil
}

// ParseDemo parses a demo file and extracts stats
func ParseDemo(filename string) (*DemoAnalysis, error) {
	f, err := os.Open(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to open demo: %w", err)
	}
	defer f.Close()

	p := dem.NewParser(f)
	defer p.Close()

	analysis := &DemoAnalysis{
		Players: make(map[string]*DemoPlayerStats),
	}

	// Track round data
	currentRound := 0
	roundDamage := make(map[uint64]int)
	roundKills := make(map[uint64]int)
	roundDeaths := make(map[uint64]bool)
	lastKillTime := make(map[uint64]int) // For trade detection

	// Initialize player stats when they appear
	initPlayer := func(player *common.Player) {
		if player == nil || player.Name == "" {
			return
		}
		if _, exists := analysis.Players[player.Name]; !exists {
			analysis.Players[player.Name] = &DemoPlayerStats{
				Nickname:    player.Name,
				WeaponKills: make(map[string]int),
				Positions: PlayerPositions{
					KillPositions:  []Position{},
					DeathPositions: []Position{},
				},
			}
		}
	}

	// Round start
	p.RegisterEventHandler(func(e events.RoundStart) {
		currentRound++
		roundDamage = make(map[uint64]int)
		roundKills = make(map[uint64]int)
		roundDeaths = make(map[uint64]bool)
		lastKillTime = make(map[uint64]int)
	})

	// Round end - calculate round stats
	p.RegisterEventHandler(func(e events.RoundEnd) {
		for _, player := range p.GameState().Participants().Playing() {
			initPlayer(player)
			if stats, ok := analysis.Players[player.Name]; ok {
				side := "T"
				if player.Team == common.TeamCounterTerrorists {
					side = "CT"
				}
				stats.RoundByRound = append(stats.RoundByRound, RoundStats{
					Round:  currentRound,
					Kills:  roundKills[player.SteamID64],
					Deaths: func() int { if roundDeaths[player.SteamID64] { return 1 }; return 0 }(),
					Damage: roundDamage[player.SteamID64],
					Side:   side,
					IsAlive: player.IsAlive(),
				})
			}
		}

		// Update scores
		gs := p.GameState()
		analysis.Team1Score = gs.TeamTerrorists().Score()
		analysis.Team2Score = gs.TeamCounterTerrorists().Score()
	})

	// Kill events
	p.RegisterEventHandler(func(e events.Kill) {
		tick := p.GameState().IngameTick()

		// Victim stats
		if e.Victim != nil {
			initPlayer(e.Victim)
			if stats, ok := analysis.Players[e.Victim.Name]; ok {
				stats.Deaths++
				roundDeaths[e.Victim.SteamID64] = true

				// Track death position
				pos := e.Victim.Position()
				stats.Positions.DeathPositions = append(stats.Positions.DeathPositions, Position{
					X: pos.X,
					Y: pos.Y,
				})
			}
		}

		// Killer stats
		if e.Killer != nil && e.Killer != e.Victim {
			initPlayer(e.Killer)
			if stats, ok := analysis.Players[e.Killer.Name]; ok {
				stats.Kills++
				roundKills[e.Killer.SteamID64]++

				if e.IsHeadshot {
					// Track HS in a separate counter
				}

				// Track kill position
				pos := e.Killer.Position()
				stats.Positions.KillPositions = append(stats.Positions.KillPositions, Position{
					X: pos.X,
					Y: pos.Y,
				})

				// Weapon kills
				if e.Weapon != nil {
					weaponName := e.Weapon.String()
					stats.WeaponKills[weaponName]++
				}

				// First kill detection (first kill of the round)
				if roundKills[e.Killer.SteamID64] == 1 {
					isFirstKill := true
					for _, kills := range roundKills {
						if kills > 1 {
							isFirstKill = false
							break
						}
					}
					if isFirstKill {
						stats.FirstKills++
					}
				}

				// Trade detection (kill within 3 seconds of teammate death)
				lastKillTime[e.Killer.SteamID64] = tick
			}
		}

		// Assister stats
		if e.Assister != nil {
			initPlayer(e.Assister)
			if stats, ok := analysis.Players[e.Assister.Name]; ok {
				stats.Assists++
			}
		}
	})

	// Damage events
	p.RegisterEventHandler(func(e events.PlayerHurt) {
		if e.Attacker != nil && e.Player != nil && e.Attacker.Team != e.Player.Team {
			initPlayer(e.Attacker)
			roundDamage[e.Attacker.SteamID64] += e.HealthDamage
		}
	})

	// Flash events
	p.RegisterEventHandler(func(e events.PlayerFlashed) {
		if e.Attacker != nil && e.Player != nil && e.Attacker.Team != e.Player.Team {
			initPlayer(e.Attacker)
			if stats, ok := analysis.Players[e.Attacker.Name]; ok {
				stats.EnemiesFlashed++
				if e.FlashDuration() > 2.0 { // Significant flash
					stats.FlashAssists++
				}
			}
		}
	})

	// Parse header first
	header, err := p.ParseHeader()
	if err != nil {
		return nil, fmt.Errorf("failed to parse header: %w", err)
	}
	analysis.Map = header.MapName
	analysis.Duration = int(header.PlaybackTime.Seconds())

	// Parse entire demo
	err = p.ParseToEnd()
	if err != nil {
		// Some demos may have parsing issues but still have useful data
		fmt.Printf("[Demo] Parse warning: %v\n", err)
	}

	// Calculate derived stats
	for _, stats := range analysis.Players {
		// HS percent
		totalHS := 0
		for weapon, kills := range stats.WeaponKills {
			// Rifles and pistols count for HS%
			if strings.Contains(strings.ToLower(weapon), "ak") ||
				strings.Contains(strings.ToLower(weapon), "m4") ||
				strings.Contains(strings.ToLower(weapon), "deagle") ||
				strings.Contains(strings.ToLower(weapon), "usp") ||
				strings.Contains(strings.ToLower(weapon), "glock") {
				totalHS += kills
			}
		}
		if stats.Kills > 0 {
			stats.HSPercent = float64(totalHS) / float64(stats.Kills) * 100
		}

		// ADR
		totalDamage := 0
		for _, round := range stats.RoundByRound {
			totalDamage += round.Damage
		}
		if len(stats.RoundByRound) > 0 {
			stats.ADR = float64(totalDamage) / float64(len(stats.RoundByRound))
		}

		// Average position
		if len(stats.Positions.KillPositions) > 0 {
			var sumX, sumY float64
			for _, pos := range stats.Positions.KillPositions {
				sumX += pos.X
				sumY += pos.Y
			}
			stats.Positions.AveragePosition = Position{
				X: sumX / float64(len(stats.Positions.KillPositions)),
				Y: sumY / float64(len(stats.Positions.KillPositions)),
			}
		}

		// Determine played side (what they played most)
		tRounds, ctRounds := 0, 0
		for _, round := range stats.RoundByRound {
			if round.Side == "T" {
				tRounds++
			} else {
				ctRounds++
			}
		}
		if tRounds > ctRounds {
			stats.Positions.PlayedSide = "T"
		} else {
			stats.Positions.PlayedSide = "CT"
		}
	}

	analysis.MatchID = filepath.Base(filename)
	return analysis, nil
}

// AggregatePlayerDemoStats combines stats from multiple demos
func AggregatePlayerDemoStats(analyses []*DemoAnalysis, nickname string) *DemoPlayerStats {
	aggregate := &DemoPlayerStats{
		Nickname:       nickname,
		WeaponKills:    make(map[string]int),
		Positions: PlayerPositions{
			KillPositions:  []Position{},
			DeathPositions: []Position{},
		},
	}

	totalGames := 0
	for _, analysis := range analyses {
		if stats, ok := analysis.Players[nickname]; ok {
			totalGames++
			aggregate.Kills += stats.Kills
			aggregate.Deaths += stats.Deaths
			aggregate.Assists += stats.Assists
			aggregate.FlashAssists += stats.FlashAssists
			aggregate.EnemiesFlashed += stats.EnemiesFlashed
			aggregate.UtilityDamage += stats.UtilityDamage
			aggregate.FirstKills += stats.FirstKills
			aggregate.FirstDeaths += stats.FirstDeaths
			aggregate.Clutches += stats.Clutches
			aggregate.ClutchAttempts += stats.ClutchAttempts
			aggregate.TradesKilled += stats.TradesKilled
			aggregate.TradesDied += stats.TradesDied

			// Merge weapon kills
			for weapon, kills := range stats.WeaponKills {
				aggregate.WeaponKills[weapon] += kills
			}

			// Merge positions
			aggregate.Positions.KillPositions = append(
				aggregate.Positions.KillPositions,
				stats.Positions.KillPositions...,
			)
			aggregate.Positions.DeathPositions = append(
				aggregate.Positions.DeathPositions,
				stats.Positions.DeathPositions...,
			)

			// Add round by round
			aggregate.RoundByRound = append(aggregate.RoundByRound, stats.RoundByRound...)
		}
	}

	// Calculate averages
	if totalGames > 0 {
		// ADR average
		totalDamage := 0
		for _, round := range aggregate.RoundByRound {
			totalDamage += round.Damage
		}
		if len(aggregate.RoundByRound) > 0 {
			aggregate.ADR = float64(totalDamage) / float64(len(aggregate.RoundByRound))
		}

		// HS%
		if aggregate.Kills > 0 {
			hsKills := 0
			for weapon, kills := range aggregate.WeaponKills {
				if strings.Contains(strings.ToLower(weapon), "ak") ||
					strings.Contains(strings.ToLower(weapon), "m4") ||
					strings.Contains(strings.ToLower(weapon), "deagle") {
					hsKills += kills
				}
			}
			aggregate.HSPercent = float64(hsKills) / float64(aggregate.Kills) * 100
		}

		// Average position
		if len(aggregate.Positions.KillPositions) > 0 {
			var sumX, sumY float64
			for _, pos := range aggregate.Positions.KillPositions {
				sumX += pos.X
				sumY += pos.Y
			}
			aggregate.Positions.AveragePosition = Position{
				X: sumX / float64(len(aggregate.Positions.KillPositions)),
				Y: sumY / float64(len(aggregate.Positions.KillPositions)),
			}
		}
	}

	return aggregate
}

// GetPlayerHeatmap generates heatmap data for a player
func GetPlayerHeatmap(analyses []*DemoAnalysis, nickname string, mapName string) *HeatmapData {
	heatmap := &HeatmapData{
		Map:          mapName,
		KillHeatmap:  []Position{},
		DeathHeatmap: []Position{},
		MoveHeatmap:  []Position{},
	}

	for _, analysis := range analyses {
		if analysis.Map != mapName {
			continue
		}
		if stats, ok := analysis.Players[nickname]; ok {
			heatmap.KillHeatmap = append(heatmap.KillHeatmap, stats.Positions.KillPositions...)
			heatmap.DeathHeatmap = append(heatmap.DeathHeatmap, stats.Positions.DeathPositions...)
		}
	}

	return heatmap
}

// CleanupDemoCache removes old demo files
func CleanupDemoCache(maxAgeDays int) {
	filepath.Walk(demoConfig.CacheDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() && strings.HasSuffix(path, ".dem") {
			// Check age
			age := info.ModTime()
			ageInDays := int(time.Since(age).Hours() / 24)
			if ageInDays > maxAgeDays {
				os.Remove(path)
				fmt.Printf("[Demo] Cleaned up old demo: %s\n", path)
			}
		}
		return nil
	})
}
