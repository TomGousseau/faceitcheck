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
	KillPositions       []Position `json:"killPositions"`
	DeathPositions      []Position `json:"deathPositions"`
	AveragePosition     Position   `json:"averagePosition"`
	CommonAreas         []string   `json:"commonAreas"`
	PlayedSide          string     `json:"playedSide"` // T or CT
	BombPlantPositions  []Position `json:"bombPlantPositions"`  // Where they plant bomb
	RoundStartPositions []Position `json:"roundStartPositions"` // Where they go at round start
	PreferredSite       string     `json:"preferredSite"`       // A or B site preference
	EarlyPositions      []Position `json:"earlyPositions"`      // Positions in first 30 seconds
}

// CommunicationStats tracks player communication patterns
type CommunicationStats struct {
	ChatMessages    int      `json:"chatMessages"`    // Total chat messages
	TeamMessages    int      `json:"teamMessages"`    // Team chat only
	RadioCommands   int      `json:"radioCommands"`   // Radio commands used
	InfoCalls       int      `json:"infoCalls"`       // Messages with callouts/info
	ToxicMessages   int      `json:"toxicMessages"`   // Negative/toxic messages
	IsTactical      bool     `json:"isTactical"`      // Overall tactical assessment
	IsVocal         bool     `json:"isVocal"`         // Communicates often
	SampleMessages  []string `json:"sampleMessages"`  // Example messages (sanitized)
}

// BombStats tracks bomb-related actions
type BombStats struct {
	Plants         int        `json:"plants"`
	Defuses        int        `json:"defuses"`
	ASitePlants    int        `json:"aSitePlants"`
	BSitePlants    int        `json:"bSitePlants"`
	PlantPositions []Position `json:"plantPositions"`
	PreferredSite  string     `json:"preferredSite"` // A or B
}

// MovementPattern tracks how player moves in rounds
type MovementPattern struct {
	AvgTimeToSite    float64  `json:"avgTimeToSite"`    // Avg seconds to reach site
	IsAggressive     bool     `json:"isAggressive"`     // Pushes early
	IsLurker         bool     `json:"isLurker"`         // Stays back
	RotatesOften     bool     `json:"rotatesOften"`     // Changes position a lot
	HoldsAngles      bool     `json:"holdsAngles"`      // Passive playstyle
	CommonRoutes     []string `json:"commonRoutes"`     // Common paths taken
	EntryPercentage  float64  `json:"entryPercentage"`  // How often they entry
}

// DemoPlayerStats represents parsed demo stats for a player
type DemoPlayerStats struct {
	Nickname        string              `json:"nickname"`
	Kills           int                 `json:"kills"`
	Deaths          int                 `json:"deaths"`
	Assists         int                 `json:"assists"`
	ADR             float64             `json:"adr"`
	HSPercent       float64             `json:"hsPercent"`
	FlashAssists    int                 `json:"flashAssists"`
	EnemiesFlashed  int                 `json:"enemiesFlashed"`
	UtilityDamage   int                 `json:"utilityDamage"`
	FirstKills      int                 `json:"firstKills"`
	FirstDeaths     int                 `json:"firstDeaths"`
	Clutches        int                 `json:"clutches"`
	ClutchAttempts  int                 `json:"clutchAttempts"`
	TradesKilled    int                 `json:"tradesKilled"`   // traded a teammate
	TradesDied      int                 `json:"tradesDied"`     // got traded after kill
	Positions       PlayerPositions     `json:"positions"`
	WeaponKills     map[string]int      `json:"weaponKills"`
	RoundByRound    []RoundStats        `json:"roundByRound"`
	// New analysis fields
	Communication   CommunicationStats  `json:"communication"`
	BombStats       BombStats           `json:"bombStats"`
	Movement        MovementPattern     `json:"movement"`
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

	// Bomb plant events - track where players plant
	p.RegisterEventHandler(func(e events.BombPlanted) {
		if e.Player != nil {
			initPlayer(e.Player)
			if stats, ok := analysis.Players[e.Player.Name]; ok {
				pos := e.Player.Position()
				plantPos := Position{X: pos.X, Y: pos.Y}
				
				stats.BombStats.Plants++
				stats.BombStats.PlantPositions = append(stats.BombStats.PlantPositions, plantPos)
				stats.Positions.BombPlantPositions = append(stats.Positions.BombPlantPositions, plantPos)
				
				// Determine site based on position (rough estimate based on common map layouts)
				// A sites are typically at lower Y coordinates on most maps
				site := determineBombSite(analysis.Map, pos.X, pos.Y)
				if site == "A" {
					stats.BombStats.ASitePlants++
				} else {
					stats.BombStats.BSitePlants++
				}
			}
		}
	})

	// Bomb defuse events
	p.RegisterEventHandler(func(e events.BombDefused) {
		if e.Player != nil {
			initPlayer(e.Player)
			if stats, ok := analysis.Players[e.Player.Name]; ok {
				stats.BombStats.Defuses++
			}
		}
	})

	// Round freeze end - track where players go at round start
	roundStartTick := 0
	p.RegisterEventHandler(func(e events.RoundFreezetimeEnd) {
		roundStartTick = p.GameState().IngameTick()
		// Track initial positions after freeze
		for _, player := range p.GameState().Participants().Playing() {
			initPlayer(player)
			if stats, ok := analysis.Players[player.Name]; ok {
				pos := player.Position()
				stats.Positions.RoundStartPositions = append(stats.Positions.RoundStartPositions, Position{
					X: pos.X,
					Y: pos.Y,
				})
			}
		}
	})

	// Track positions 15 seconds into round (early game positioning)
	earlyGameTracked := make(map[int]bool)
	p.RegisterEventHandler(func(e events.FrameDone) {
		if roundStartTick == 0 {
			return
		}
		currentTick := p.GameState().IngameTick()
		ticksElapsed := currentTick - roundStartTick
		// Track at ~15 seconds (assuming 64 tick = ~960 ticks for 15 sec)
		if ticksElapsed > 800 && ticksElapsed < 1200 && !earlyGameTracked[currentRound] {
			earlyGameTracked[currentRound] = true
			for _, player := range p.GameState().Participants().Playing() {
				initPlayer(player)
				if stats, ok := analysis.Players[player.Name]; ok {
					pos := player.Position()
					stats.Positions.EarlyPositions = append(stats.Positions.EarlyPositions, Position{
						X: pos.X,
						Y: pos.Y,
					})
				}
			}
		}
	})

	// Chat message events - track communication
	p.RegisterEventHandler(func(e events.ChatMessage) {
		if e.Sender != nil {
			initPlayer(e.Sender)
			if stats, ok := analysis.Players[e.Sender.Name]; ok {
				stats.Communication.ChatMessages++
				
				msg := strings.ToLower(e.Text)
				
				// Check if team message
				if e.IsChatAll == false {
					stats.Communication.TeamMessages++
				}
				
				// Analyze message content for tactical info
				infoKeywords := []string{
					"rush", "go", "flash", "smoke", "wait", "rotate", "back", "push",
					"a", "b", "mid", "long", "short", "cat", "palace", "apps", "banana",
					"1", "2", "3", "4", "5", "low", "full", "eco", "save", "buy",
					"ct", "spawn", "site", "plant", "defuse", "cover", "trade", "help",
				}
				for _, keyword := range infoKeywords {
					if strings.Contains(msg, keyword) {
						stats.Communication.InfoCalls++
						break
					}
				}
				
				// Check for toxic messages
				toxicKeywords := []string{
					"noob", "trash", "bot", "idiot", "stupid", "bad", "report", "kick",
					"gg", "ff", "quit", "leave", "uninstall",
				}
				for _, keyword := range toxicKeywords {
					if strings.Contains(msg, keyword) {
						stats.Communication.ToxicMessages++
						break
					}
				}
				
				// Store sample messages (max 5, sanitized)
				if len(stats.Communication.SampleMessages) < 5 && len(e.Text) > 2 && len(e.Text) < 50 {
					stats.Communication.SampleMessages = append(stats.Communication.SampleMessages, e.Text)
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
		
		// Calculate preferred bomb site
		if stats.BombStats.ASitePlants > stats.BombStats.BSitePlants {
			stats.BombStats.PreferredSite = "A"
			stats.Positions.PreferredSite = "A"
		} else if stats.BombStats.BSitePlants > stats.BombStats.ASitePlants {
			stats.BombStats.PreferredSite = "B"
			stats.Positions.PreferredSite = "B"
		} else {
			stats.BombStats.PreferredSite = "None"
			stats.Positions.PreferredSite = "None"
		}
		
		// Calculate communication patterns
		totalRounds := len(stats.RoundByRound)
		if totalRounds > 0 {
			// Is vocal if they chat more than once per 3 rounds
			stats.Communication.IsVocal = float64(stats.Communication.ChatMessages) > float64(totalRounds)/3.0
			// Is tactical if info calls > toxic and has decent chat
			stats.Communication.IsTactical = stats.Communication.InfoCalls > stats.Communication.ToxicMessages &&
				stats.Communication.ChatMessages > 5
		}
		
		// Calculate movement patterns
		if stats.FirstKills > 0 || stats.FirstDeaths > 0 {
			stats.Movement.EntryPercentage = float64(stats.FirstKills) / float64(stats.FirstKills+stats.FirstDeaths) * 100
		}
		// Aggressive if they get first kills often
		stats.Movement.IsAggressive = stats.FirstKills > 3 && stats.Movement.EntryPercentage > 60
		// Lurker if low first contact and late kills
		stats.Movement.IsLurker = stats.FirstKills < 2 && stats.FirstDeaths < 2
		// Holds angles if low first kills but high overall K/D
		if stats.Deaths > 0 {
			kd := float64(stats.Kills) / float64(stats.Deaths)
			stats.Movement.HoldsAngles = !stats.Movement.IsAggressive && kd > 1.0
		}
		
		// Determine common areas from positions
		stats.Positions.CommonAreas = analyzeCommonAreas(analysis.Map, stats.Positions.KillPositions, stats.Positions.DeathPositions)
		stats.Movement.CommonRoutes = stats.Positions.CommonAreas
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

// determineBombSite determines which bomb site based on position
// Each map has different layouts - these are approximate coordinates
func determineBombSite(mapName string, x, y float64) string {
	// Map-specific bomb site detection based on common game coordinates
	switch strings.ToLower(mapName) {
	case "de_mirage":
		// A site is around x: -300, y: -1800 | B site is around x: -2000, y: 350
		if x > -1000 {
			return "A"
		}
		return "B"
	case "de_inferno":
		// A site is around x: 2000, y: 300 | B site is around x: 200, y: 3000
		if y < 1500 {
			return "A"
		}
		return "B"
	case "de_dust2":
		// A site is around x: 1200, y: 2500 | B site is around x: -1400, y: 2500
		if x > 0 {
			return "A"
		}
		return "B"
	case "de_nuke":
		// A site is above, B site is below (Z matters but use Y as proxy)
		// A site y: -500 to 500, B site y: -1500 to -800
		if y > -700 {
			return "A"
		}
		return "B"
	case "de_ancient":
		// A site is around x: -400, y: -1100 | B site is around x: -500, y: 400
		if y < -300 {
			return "A"
		}
		return "B"
	case "de_anubis":
		// A site is around x: -1500, y: 1500 | B site is around x: 1800, y: -600
		if x < 0 {
			return "A"
		}
		return "B"
	case "de_vertigo":
		// A site is around x: -1500, y: 300 | B site is around x: -1200, y: -1400
		if y > -500 {
			return "A"
		}
		return "B"
	default:
		// Default heuristic: use X coordinate (A sites tend to be on one side)
		if x > 0 {
			return "A"
		}
		return "B"
	}
}

// analyzeCommonAreas determines common areas from kill/death positions
func analyzeCommonAreas(mapName string, killPositions, deathPositions []Position) []string {
	areas := make(map[string]int)
	allPositions := append(killPositions, deathPositions...)
	
	for _, pos := range allPositions {
		area := getAreaFromPosition(mapName, pos.X, pos.Y)
		areas[area]++
	}
	
	// Sort by frequency and return top 3
	type areaCount struct {
		name  string
		count int
	}
	var sorted []areaCount
	for name, count := range areas {
		sorted = append(sorted, areaCount{name, count})
	}
	// Simple bubble sort for small array
	for i := 0; i < len(sorted); i++ {
		for j := i + 1; j < len(sorted); j++ {
			if sorted[j].count > sorted[i].count {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}
	
	result := []string{}
	for i := 0; i < len(sorted) && i < 5; i++ {
		result = append(result, sorted[i].name)
	}
	return result
}

// getAreaFromPosition determines the area name from coordinates
func getAreaFromPosition(mapName string, x, y float64) string {
	switch strings.ToLower(mapName) {
	case "de_mirage":
		// Rough Mirage area detection
		if x > 0 && y < -1500 {
			return "A Site"
		} else if x > -500 && y > -1500 && y < -800 {
			return "CT Spawn"
		} else if x > -300 && y > -800 && y < -200 {
			return "Connector"
		} else if x < -1500 && y > 0 {
			return "B Site"
		} else if x < 0 && x > -1500 && y > -200 {
			return "Mid"
		} else if x > 500 && y > -1500 {
			return "Palace/A Ramp"
		} else if x < -1700 && y < 0 {
			return "B Apartments"
		}
		return "T Area"
		
	case "de_inferno":
		if x > 1500 && y < 1000 {
			return "A Site"
		} else if y > 2500 {
			return "B Site"
		} else if x > 0 && x < 1500 && y < 1000 {
			return "Mid"
		} else if y > 1500 && y < 2500 {
			return "Banana"
		} else if x > 1000 && y > 500 && y < 2000 {
			return "Apartments"
		}
		return "T Area"
		
	case "de_dust2":
		if x > 800 && y > 2000 {
			return "A Site"
		} else if x < -1000 && y > 2000 {
			return "B Site"
		} else if x > 800 && y < 2000 && y > 500 {
			return "Long A"
		} else if x > 0 && x < 800 && y > 500 && y < 2000 {
			return "Short A/Catwalk"
		} else if x < -500 && y < 2000 && y > 500 {
			return "B Tunnels"
		} else if x > -500 && x < 500 && y > 500 && y < 2000 {
			return "Mid"
		}
		return "T Area"
		
	case "de_ancient":
		if y < -800 {
			return "A Site"
		} else if y > 200 {
			return "B Site"
		} else if x > 0 {
			return "Mid"
		}
		return "Main/Cave"
		
	case "de_anubis":
		if x < -1000 && y > 1000 {
			return "A Site"
		} else if x > 1000 {
			return "B Site"
		} else if x > -500 && x < 1000 {
			return "Mid/Water"
		}
		return "Connector"
		
	case "de_vertigo":
		if y > 0 {
			return "A Site"
		} else if y < -1000 {
			return "B Site"
		}
		return "Ramp/Mid"
		
	case "de_nuke":
		if y > -500 {
			return "A Site/Heaven"
		} else if y < -1200 {
			return "B Site"
		} else {
			return "Ramp/Outside"
		}
		
	default:
		// Generic area based on quadrant
		if x > 0 && y > 0 {
			return "Area NE"
		} else if x < 0 && y > 0 {
			return "Area NW"
		} else if x > 0 && y < 0 {
			return "Area SE"
		}
		return "Area SW"
	}
}
