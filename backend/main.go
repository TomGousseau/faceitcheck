package main

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Player represents a FACEIT player with comprehensive analysis
type Player struct {
	Nickname       string   `json:"nickname"`
	Level          int      `json:"level"`
	Elo            int      `json:"elo"`
	AvgKD          float64  `json:"avgKD"`
	AvgHSPercent   int      `json:"avgHSPercent"`
	WinRate        int      `json:"winRate"`
	BestMaps       []string `json:"bestMaps"`
	RecentForm     string   `json:"recentForm"`     // hot, warm, cold
	Role           string   `json:"role"`           // entry, support, awp, lurk, igl
	Playstyle      string   `json:"playstyle"`      // aggressive, passive, mixed
	Weaknesses     []string `json:"weaknesses"`     // specific weaknesses
	Strengths      []string `json:"strengths"`      // specific strengths
	PreferredGuns  []string `json:"preferredGuns"`  // based on playstyle
	ClutchRate     int      `json:"clutchRate"`     // 1vX success rate
	FirstKillRate  int      `json:"firstKillRate"`  // opening duel win rate
	UtilityDamage  int      `json:"utilityDamage"`  // avg utility damage
	FlashAssists   int      `json:"flashAssists"`   // avg flash assists
	TradingRating  int      `json:"tradingRating"`  // trade kill effectiveness
}

// MapStats represents map win rate
type MapStats struct {
	Map      string `json:"map"`
	WinRate  int    `json:"winRate"`
	TWinRate int    `json:"tWinRate"`
	CTWinRate int   `json:"ctWinRate"`
}

// TeamAnalysis represents team analysis data
type TeamAnalysis struct {
	Players       []Player   `json:"players"`
	AvgElo        int        `json:"avgElo"`
	TeamStrength  int        `json:"teamStrength"`
	PreferredSide string     `json:"preferredSide"`
	BestMaps      []MapStats `json:"bestMaps"`
	TeamStyle     string     `json:"teamStyle"`     // aggressive, tactical, mixed
	WeakSites     []string   `json:"weakSites"`     // sites they struggle on
	StrongSites   []string   `json:"strongSites"`   // sites they excel on
}

// Strategy represents a game strategy
type Strategy struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Side        string   `json:"side"`
	MapArea     string   `json:"mapArea"`
	Priority    string   `json:"priority"`    // high, medium, low
	RoundType   string   `json:"roundType"`   // pistol, eco, force, full
	Utility     []string `json:"utility"`     // required utility
	Positions   []string `json:"positions"`   // key positions to take
}

// SoloStrategy for individual play
type SoloStrategy struct {
	Role          string   `json:"role"`
	Position      string   `json:"position"`
	PrimaryWeapon string   `json:"primaryWeapon"`
	Playstyle     string   `json:"playstyle"`
	Tips          []string `json:"tips"`
	Counters      []string `json:"counters"` // how to counter enemy players
}

// TeamStrategy for coordinated play
type TeamStrategy struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Side        string   `json:"side"`
	Setup       []string `json:"setup"`
	Execution   []string `json:"execution"`
	Fallbacks   []string `json:"fallbacks"`
	KeyPlayers  []string `json:"keyPlayers"` // who should do what
}

// GunRecommendation based on economy and role
type GunRecommendation struct {
	Economy     string   `json:"economy"` // eco, force, full
	Weapons     []string `json:"weapons"`
	Reason      string   `json:"reason"`
	Alternatives []string `json:"alternatives"`
}

// RoundStrategy for different round types
type RoundStrategy struct {
	RoundType   string `json:"roundType"`
	TSide       string `json:"tSide"`
	CTSide      string `json:"ctSide"`
	KeyPoints   []string `json:"keyPoints"`
}

// EnemyWeakness identified weakness to exploit
type EnemyWeakness struct {
	Player      string `json:"player"`
	Weakness    string `json:"weakness"`
	Exploitation string `json:"exploitation"`
}

// MatchAnalysis represents the full analysis response
type MatchAnalysis struct {
	MatchID            string              `json:"matchId"`
	YourTeam           TeamAnalysis        `json:"yourTeam"`
	EnemyTeam          TeamAnalysis        `json:"enemyTeam"`
	RecommendedMap     string              `json:"recommendedMap"`
	RecommendedSide    string              `json:"recommendedSide"`
	BanSuggestions     []string            `json:"banSuggestions"`
	PickOrder          []string            `json:"pickOrder"`
	Strategies         []Strategy          `json:"strategies"`
	SoloStrategies     []SoloStrategy      `json:"soloStrategies"`
	TeamStrategies     []TeamStrategy      `json:"teamStrategies"`
	GunRecommendations []GunRecommendation `json:"gunRecommendations"`
	RoundStrategies    []RoundStrategy     `json:"roundStrategies"`
	EnemyWeaknesses    []EnemyWeakness     `json:"enemyWeaknesses"`
	WinProbability     int                 `json:"winProbability"`
	KeyToVictory       string              `json:"keyToVictory"`
}

// AnalyzeRequest represents the analysis request
type AnalyzeRequest struct {
	MatchURL string `json:"matchUrl"`
	Username string `json:"username"`
	APIKey   string `json:"apiKey"`
}

// FACEITMatchResponse from FACEIT API
type FACEITMatchResponse struct {
	MatchID string `json:"match_id"`
	Teams   struct {
		Faction1 struct {
			Roster []FACEITPlayer `json:"roster"`
		} `json:"faction1"`
		Faction2 struct {
			Roster []FACEITPlayer `json:"roster"`
		} `json:"faction2"`
	} `json:"teams"`
}

type FACEITPlayer struct {
	PlayerID       string `json:"player_id"`
	Nickname       string `json:"nickname"`
	GameSkillLevel int    `json:"game_skill_level"`
}

type FACEITPlayerStats struct {
	Lifetime struct {
		AverageKDRatio   string `json:"Average K/D Ratio"`
		AverageHeadshots string `json:"Average Headshots %"`
		WinRate          string `json:"Win Rate %"`
		Matches          string `json:"Matches"`
	} `json:"lifetime"`
	Segments []struct {
		Label string `json:"label"`
		Stats struct {
			WinRate string `json:"Win Rate %"`
			Matches string `json:"Matches"`
		} `json:"stats"`
	} `json:"segments"`
}

var cs2Maps = []string{"Mirage", "Inferno", "Dust2", "Nuke", "Ancient", "Anubis", "Vertigo"}

var playerRoles = []string{"entry", "support", "awp", "lurk", "igl"}
var playstyles = []string{"aggressive", "passive", "mixed"}

// Weapon pools for recommendations
var riflePool = []string{"AK-47", "M4A4", "M4A1-S", "Galil AR", "FAMAS"}
var smgPool = []string{"MAC-10", "MP9", "MP7", "UMP-45"}
var awpPool = []string{"AWP", "SSG 08"}
var pistolPool = []string{"Glock-18", "USP-S", "P250", "Five-SeveN", "Tec-9", "Desert Eagle"}
var econPool = []string{"P250", "CZ75-Auto", "Tec-9", "Five-SeveN"}

// Map-specific callouts
var mapCallouts = map[string][]string{
	"Mirage":  {"A Site", "B Site", "Mid", "A Ramp", "Palace", "Apps", "Market", "Connector", "Jungle", "CT Spawn"},
	"Inferno": {"A Site", "B Site", "Banana", "Apps", "Mid", "Arch", "Library", "Pit", "Boiler", "CT Spawn"},
	"Dust2":   {"A Site", "B Site", "Long A", "Short A", "Mid", "B Tunnels", "CT Spawn", "Catwalk", "Pit", "Xbox"},
	"Nuke":    {"A Site", "B Site", "Ramp", "Outside", "Secret", "Heaven", "Hell", "Vent", "Squeaky", "CT Spawn"},
	"Ancient": {"A Site", "B Site", "Mid", "Donut", "Cave", "Temple", "Elbow", "CT Spawn", "T Spawn", "Water"},
	"Anubis":  {"A Site", "B Site", "Mid", "Connector", "Palace", "Water", "Bridge", "CT Spawn", "Main", "Alley"},
	"Vertigo": {"A Site", "B Site", "Ramp", "Mid", "T Spawn", "CT Spawn", "Elevator", "Stairs", "Window", "Generator"},
}

func init() {
	rand.Seed(time.Now().UnixNano())
}

func main() {
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "http://127.0.0.1:3000"}
	config.AllowMethods = []string{"GET", "POST", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	// Routes
	r.POST("/api/analyze", analyzeMatch)
	r.GET("/api/health", healthCheck)
	r.GET("/api/strategies/:map", getMapStrategies)

	fmt.Println("🎯 FACEIT Analyzer Backend running on http://localhost:8080")
	r.Run(":8080")
}

func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok", "version": "2.0"})
}

func getMapStrategies(c *gin.Context) {
	mapName := c.Param("map")
	strategies := getDetailedMapStrategies(mapName)
	c.JSON(http.StatusOK, strategies)
}

func analyzeMatch(c *gin.Context) {
	var req AnalyzeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Extract match ID from URL
	matchID := extractMatchID(req.MatchURL)
	if matchID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid match URL"})
		return
	}

	// Try to fetch real data from FACEIT API
	analysis, err := fetchRealMatchData(matchID, req.Username, req.APIKey)
	if err != nil {
		// Fallback to generated analysis
		analysis = generateAnalysis(matchID, req.Username)
	}

	c.JSON(http.StatusOK, analysis)
}

func extractMatchID(url string) string {
	// Match patterns like: 
	// https://www.faceit.com/en/cs2/room/1-abc123
	// https://www.faceit.com/en/csgo/room/1-abc123
	patterns := []string{
		`room/([a-zA-Z0-9-]+)`,
		`match/([a-zA-Z0-9-]+)`,
	}
	
	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindStringSubmatch(url)
		if len(matches) > 1 {
			return matches[1]
		}
	}
	
	// If URL is just the match ID
	if !strings.Contains(url, "/") && len(url) > 5 {
		return url
	}
	
	return ""
}

func fetchRealMatchData(matchID string, username string, apiKey string) (*MatchAnalysis, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("no API key provided")
	}

	// Fetch match details
	client := &http.Client{Timeout: 10 * time.Second}
	
	matchURL := fmt.Sprintf("https://open.faceit.com/data/v4/matches/%s", matchID)
	req, _ := http.NewRequest("GET", matchURL, nil)
	req.Header.Set("Authorization", "Bearer "+apiKey)
	
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("FACEIT API error: %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var matchData FACEITMatchResponse
	if err := json.Unmarshal(body, &matchData); err != nil {
		return nil, err
	}

	// Determine which faction the user is on
	yourRoster := matchData.Teams.Faction1.Roster
	enemyRoster := matchData.Teams.Faction2.Roster
	
	for _, p := range matchData.Teams.Faction2.Roster {
		if strings.EqualFold(p.Nickname, username) {
			yourRoster = matchData.Teams.Faction2.Roster
			enemyRoster = matchData.Teams.Faction1.Roster
			break
		}
	}

	// Fetch detailed stats for each player
	yourPlayers := fetchPlayersStats(yourRoster, apiKey, client)
	enemyPlayers := fetchPlayersStats(enemyRoster, apiKey, client)

	// Analyze and generate recommendations
	return analyzeTeams(matchID, yourPlayers, enemyPlayers), nil
}

func fetchPlayersStats(roster []FACEITPlayer, apiKey string, client *http.Client) []Player {
	players := make([]Player, len(roster))
	
	for i, p := range roster {
		players[i] = Player{
			Nickname: p.Nickname,
			Level:    p.GameSkillLevel,
			Elo:      1000 + (p.GameSkillLevel * 150), // Estimate ELO from level
			BestMaps: getRandomMaps(2),
			RecentForm: getRandomForm(),
		}

		// Try to fetch detailed stats
		statsURL := fmt.Sprintf("https://open.faceit.com/data/v4/players/%s/stats/cs2", p.PlayerID)
		req, _ := http.NewRequest("GET", statsURL, nil)
		req.Header.Set("Authorization", "Bearer "+apiKey)
		
		resp, err := client.Do(req)
		if err == nil && resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			body, _ := io.ReadAll(resp.Body)
			var stats FACEITPlayerStats
			if json.Unmarshal(body, &stats) == nil {
				players[i].AvgKD = parseFloat(stats.Lifetime.AverageKDRatio, 1.0)
				players[i].AvgHSPercent = parseInt(stats.Lifetime.AverageHeadshots, 45)
				players[i].WinRate = parseInt(stats.Lifetime.WinRate, 50)
				
				// Get best maps from segments
				players[i].BestMaps = getBestMapsFromStats(stats)
			}
		}
	}
	
	return players
}

func getBestMapsFromStats(stats FACEITPlayerStats) []string {
	type mapWinRate struct {
		name    string
		winRate int
	}
	
	var mapStats []mapWinRate
	for _, seg := range stats.Segments {
		if seg.Stats.WinRate != "" {
			mapStats = append(mapStats, mapWinRate{
				name:    seg.Label,
				winRate: parseInt(seg.Stats.WinRate, 0),
			})
		}
	}
	
	// Sort by win rate and return top 2
	for i := 0; i < len(mapStats)-1; i++ {
		for j := i + 1; j < len(mapStats); j++ {
			if mapStats[j].winRate > mapStats[i].winRate {
				mapStats[i], mapStats[j] = mapStats[j], mapStats[i]
			}
		}
	}
	
	result := make([]string, 0, 2)
	for i := 0; i < len(mapStats) && i < 2; i++ {
		result = append(result, mapStats[i].name)
	}
	
	if len(result) == 0 {
		return getRandomMaps(2)
	}
	return result
}

func analyzeTeams(matchID string, yourPlayers, enemyPlayers []Player) *MatchAnalysis {
	// Enhance players with role and weakness analysis
	enhancePlayers(yourPlayers)
	enhancePlayers(enemyPlayers)

	yourTeam := buildTeamAnalysis(yourPlayers)
	enemyTeam := buildTeamAnalysis(enemyPlayers)

	// Determine best map (where your team excels but enemy doesn't)
	recommendedMap := findBestMap(yourTeam, enemyTeam)
	banSuggestions := findBanSuggestions(enemyTeam)
	pickOrder := generatePickOrder(yourTeam, enemyTeam)

	// Calculate win probability based on ELO difference and team strength
	eloDiff := yourTeam.AvgElo - enemyTeam.AvgElo
	winProb := 50 + int(float64(eloDiff)/20) + (yourTeam.TeamStrength-enemyTeam.TeamStrength)/4
	winProb = clamp(winProb, 25, 85)

	// Determine recommended side
	recommendedSide := yourTeam.PreferredSide

	// Generate all types of strategies
	strategies := generateStrategies(recommendedMap, enemyPlayers)
	soloStrategies := generateSoloStrategies(recommendedMap, yourPlayers, enemyPlayers)
	teamStrategies := generateTeamStrategies(recommendedMap, yourTeam, enemyTeam)
	gunRecommendations := generateGunRecommendations(yourPlayers)
	roundStrategies := generateRoundStrategies(recommendedMap, yourTeam, enemyTeam)
	enemyWeaknesses := identifyEnemyWeaknesses(enemyPlayers)

	// Generate key to victory
	keyToVictory := generateKeyToVictory(yourTeam, enemyTeam, recommendedMap)

	return &MatchAnalysis{
		MatchID:            matchID,
		YourTeam:           yourTeam,
		EnemyTeam:          enemyTeam,
		RecommendedMap:     recommendedMap,
		RecommendedSide:    recommendedSide,
		BanSuggestions:     banSuggestions,
		PickOrder:          pickOrder,
		Strategies:         strategies,
		SoloStrategies:     soloStrategies,
		TeamStrategies:     teamStrategies,
		GunRecommendations: gunRecommendations,
		RoundStrategies:    roundStrategies,
		EnemyWeaknesses:    enemyWeaknesses,
		WinProbability:     winProb,
		KeyToVictory:       keyToVictory,
	}
}

func enhancePlayers(players []Player) {
	for i := range players {
		// Assign role based on stats
		players[i].Role = detectRole(players[i])
		players[i].Playstyle = detectPlaystyle(players[i])
		players[i].Weaknesses = detectWeaknesses(players[i])
		players[i].Strengths = detectStrengths(players[i])
		players[i].PreferredGuns = getPreferredGuns(players[i])
		
		// Additional stats
		players[i].ClutchRate = 15 + rand.Intn(25)
		players[i].FirstKillRate = 40 + rand.Intn(25)
		players[i].UtilityDamage = 50 + rand.Intn(100)
		players[i].FlashAssists = 2 + rand.Intn(5)
		players[i].TradingRating = 60 + rand.Intn(30)
	}
}

func detectRole(p Player) string {
	if p.AvgHSPercent > 50 && p.AvgKD > 1.1 {
		return "entry"
	}
	if p.AvgKD > 1.3 && p.WinRate > 55 {
		return "awp"
	}
	if p.AvgKD < 1.0 && p.WinRate > 50 {
		return "support"
	}
	if p.WinRate > 52 && p.AvgKD > 1.0 {
		return "lurk"
	}
	return "igl"
}

func detectPlaystyle(p Player) string {
	if p.AvgHSPercent > 48 && p.AvgKD > 1.1 {
		return "aggressive"
	}
	if p.AvgKD < 1.0 || p.WinRate < 48 {
		return "passive"
	}
	return "mixed"
}

func detectWeaknesses(p Player) []string {
	weaknesses := []string{}
	
	if p.AvgKD < 0.95 {
		weaknesses = append(weaknesses, "Poor fragging ability")
	}
	if p.AvgHSPercent < 40 {
		weaknesses = append(weaknesses, "Low headshot accuracy")
	}
	if p.WinRate < 48 {
		weaknesses = append(weaknesses, "Struggles in clutch moments")
	}
	if p.RecentForm == "cold" {
		weaknesses = append(weaknesses, "Currently in poor form")
	}
	if p.Level < 6 {
		weaknesses = append(weaknesses, "Limited game sense")
	}
	
	if len(weaknesses) == 0 {
		weaknesses = append(weaknesses, "No major weaknesses detected")
	}
	
	return weaknesses
}

func detectStrengths(p Player) []string {
	strengths := []string{}
	
	if p.AvgKD > 1.2 {
		strengths = append(strengths, "Strong fragging power")
	}
	if p.AvgHSPercent > 50 {
		strengths = append(strengths, "Excellent aim")
	}
	if p.WinRate > 55 {
		strengths = append(strengths, "High impact player")
	}
	if p.RecentForm == "hot" {
		strengths = append(strengths, "Currently in great form")
	}
	if p.Level >= 8 {
		strengths = append(strengths, "Experienced player")
	}
	
	if len(strengths) == 0 {
		strengths = append(strengths, "Consistent performance")
	}
	
	return strengths
}

func getPreferredGuns(p Player) []string {
	role := detectRole(p)
	
	switch role {
	case "awp":
		return []string{"AWP", "Desert Eagle", "P250"}
	case "entry":
		return []string{"AK-47", "M4A4", "MAC-10"}
	case "support":
		return []string{"M4A1-S", "FAMAS", "MP9"}
	case "lurk":
		return []string{"AK-47", "Galil AR", "Tec-9"}
	default:
		return []string{"M4A4", "AK-47", "UMP-45"}
	}
}

func buildTeamAnalysis(players []Player) TeamAnalysis {
	totalElo := 0
	totalKD := 0.0
	totalWinRate := 0
	mapCounts := make(map[string]int)
	aggressiveCount := 0
	passiveCount := 0

	for _, p := range players {
		totalElo += p.Elo
		totalKD += p.AvgKD
		totalWinRate += p.WinRate
		for _, m := range p.BestMaps {
			mapCounts[m]++
		}
		if p.Playstyle == "aggressive" {
			aggressiveCount++
		} else if p.Playstyle == "passive" {
			passiveCount++
		}
	}

	avgElo := totalElo / len(players)
	avgKD := totalKD / float64(len(players))
	avgWinRate := totalWinRate / len(players)

	// Calculate team strength (0-100)
	teamStrength := int((float64(avgElo-1000)/1500)*50 + (avgKD*20) + float64(avgWinRate-40)/2)
	teamStrength = clamp(teamStrength, 20, 95)

	// Determine team style
	teamStyle := "mixed"
	if aggressiveCount >= 3 {
		teamStyle = "aggressive"
	} else if passiveCount >= 3 {
		teamStyle = "tactical"
	}

	// Determine preferred side based on team's playstyle
	preferredSide := "CT"
	if teamStyle == "aggressive" && avgKD > 1.1 {
		preferredSide = "T"
	}

	// Get best maps with T/CT split
	bestMaps := getTopMapsEnhanced(mapCounts, 3)

	// Identify weak and strong sites based on player roles
	weakSites := []string{}
	strongSites := []string{}
	
	hasAWP := false
	hasGoodEntry := false
	for _, p := range players {
		if p.Role == "awp" && p.AvgKD > 1.0 {
			hasAWP = true
		}
		if p.Role == "entry" && p.AvgKD > 1.1 {
			hasGoodEntry = true
		}
	}
	
	if hasAWP {
		strongSites = append(strongSites, "Long angles", "Mid control")
	} else {
		weakSites = append(weakSites, "Long range fights")
	}
	
	if hasGoodEntry {
		strongSites = append(strongSites, "Site executes")
	} else {
		weakSites = append(weakSites, "Opening duels")
	}

	return TeamAnalysis{
		Players:       players,
		AvgElo:        avgElo,
		TeamStrength:  teamStrength,
		PreferredSide: preferredSide,
		BestMaps:      bestMaps,
		TeamStyle:     teamStyle,
		WeakSites:     weakSites,
		StrongSites:   strongSites,
	}
}

func getTopMapsEnhanced(counts map[string]int, n int) []MapStats {
	type mapCount struct {
		name  string
		count int
	}
	
	var maps []mapCount
	for name, count := range counts {
		maps = append(maps, mapCount{name, count})
	}
	
	sort.Slice(maps, func(i, j int) bool {
		return maps[i].count > maps[j].count
	})
	
	result := make([]MapStats, 0, n)
	for i := 0; i < len(maps) && i < n; i++ {
		tRate := 45 + rand.Intn(20)
		ctRate := 45 + rand.Intn(20)
		result = append(result, MapStats{
			Map:       maps[i].name,
			WinRate:   (tRate + ctRate) / 2,
			TWinRate:  tRate,
			CTWinRate: ctRate,
		})
	}
	
	return result
}

func findBestMap(yourTeam, enemyTeam TeamAnalysis) string {
	yourMaps := make(map[string]int)
	enemyMaps := make(map[string]int)
	
	for _, m := range yourTeam.BestMaps {
		yourMaps[m.Map] = m.WinRate
	}
	for _, m := range enemyTeam.BestMaps {
		enemyMaps[m.Map] = m.WinRate
	}
	
	// Find maps where we have advantage
	bestMap := "Mirage"
	bestDiff := -100
	
	for _, m := range yourTeam.BestMaps {
		enemyRate := enemyMaps[m.Map]
		diff := m.WinRate - enemyRate
		if diff > bestDiff {
			bestDiff = diff
			bestMap = m.Map
		}
	}
	
	return bestMap
}

func findBanSuggestions(enemyTeam TeamAnalysis) []string {
	bans := make([]string, 0, 2)
	
	// Sort enemy maps by their win rate
	sorted := make([]MapStats, len(enemyTeam.BestMaps))
	copy(sorted, enemyTeam.BestMaps)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].WinRate > sorted[j].WinRate
	})
	
	for _, m := range sorted {
		bans = append(bans, m.Map)
		if len(bans) >= 2 {
			break
		}
	}
	return bans
}

func generatePickOrder(yourTeam, enemyTeam TeamAnalysis) []string {
	order := []string{}
	
	// Suggest ban order based on enemy strengths
	for _, m := range enemyTeam.BestMaps {
		if m.WinRate > 55 {
			order = append(order, fmt.Sprintf("BAN: %s (Enemy %d%% WR)", m.Map, m.WinRate))
		}
	}
	
	// Suggest pick
	for _, m := range yourTeam.BestMaps {
		if m.WinRate > 55 {
			order = append(order, fmt.Sprintf("PICK: %s (Your %d%% WR)", m.Map, m.WinRate))
			break
		}
	}
	
	return order
}

func generateStrategies(mapName string, enemyPlayers []Player) []Strategy {
	strategies := []Strategy{}
	
	// Find weak enemy players
	var weakPlayer *Player
	var strongPlayer *Player
	
	for i := range enemyPlayers {
		if enemyPlayers[i].RecentForm == "cold" || enemyPlayers[i].AvgKD < 0.95 {
			weakPlayer = &enemyPlayers[i]
		}
		if enemyPlayers[i].RecentForm == "hot" && enemyPlayers[i].AvgKD > 1.2 {
			strongPlayer = &enemyPlayers[i]
		}
	}
	
	// Map-specific strategies with detailed utility and positions
	strategies = append(strategies, getMapStrategiesDetailed(mapName)...)
	
	// Add player-specific strategies
	if weakPlayer != nil {
		strategies = append(strategies, Strategy{
			Title:       fmt.Sprintf("Focus %s", weakPlayer.Nickname),
			Description: fmt.Sprintf("Player is struggling (%.2f K/D, %s form). Pressure their position aggressively.", weakPlayer.AvgKD, weakPlayer.RecentForm),
			Side:        "T",
			MapArea:     "Varies",
			Priority:    "high",
			RoundType:   "all",
			Utility:     []string{"Flash", "Smoke"},
			Positions:   []string{"Their defensive position"},
		})
	}
	
	if strongPlayer != nil {
		strategies = append(strategies, Strategy{
			Title:       fmt.Sprintf("Avoid %s", strongPlayer.Nickname),
			Description: fmt.Sprintf("Player is on fire (%.2f K/D, %s form). Trade carefully and use utility to isolate.", strongPlayer.AvgKD, strongPlayer.RecentForm),
			Side:        "CT",
			MapArea:     "Varies",
			Priority:    "high",
			RoundType:   "all",
			Utility:     []string{"Smoke", "Molotov"},
			Positions:   []string{"Crossfire setups"},
		})
	}
	
	return strategies
}

func getMapStrategiesDetailed(mapName string) []Strategy {
	switch mapName {
	case "Mirage":
		return []Strategy{
			{Title: "A Ramp Control", Description: "Smoke CT, flash over and take ramp control. Use HE to clear sandwich/stairs.", Side: "T", MapArea: "A Site", Priority: "high", RoundType: "full", Utility: []string{"2x Smoke", "2x Flash", "HE"}, Positions: []string{"Ramp", "Tetris", "Stairs"}},
			{Title: "Split A Execute", Description: "3 ramp, 2 palace. Simultaneous push with smokes on CT and jungle.", Side: "T", MapArea: "A Site", Priority: "medium", RoundType: "full", Utility: []string{"CT Smoke", "Jungle Smoke", "3x Flash"}, Positions: []string{"Palace", "Ramp", "CT"}},
			{Title: "B Apps Rush", Description: "Fast apartments push with popflash. 4 apps, 1 underpass lurk.", Side: "T", MapArea: "B Site", Priority: "medium", RoundType: "force", Utility: []string{"Popflash", "Smoke window"}, Positions: []string{"Apps", "Short", "Van"}},
			{Title: "Mid Control CT", Description: "Hold window with AWP, connector with rifle. Flash if they push.", Side: "CT", MapArea: "Mid", Priority: "high", RoundType: "all", Utility: []string{"Window smoke (if needed)", "Connector molly"}, Positions: []string{"Window", "Connector", "Short"}},
			{Title: "A Anchor Setup", Description: "One ticket/stairs, one CT. Play for trades. Call rotator from B.", Side: "CT", MapArea: "A Site", Priority: "high", RoundType: "all", Utility: []string{"Ramp molly", "Palace smoke"}, Positions: []string{"Ticket", "CT", "Jungle"}},
		}
	case "Inferno":
		return []Strategy{
			{Title: "Banana Control", Description: "Early banana aggression with molly car, smoke deep, flash over wall.", Side: "CT", MapArea: "Banana", Priority: "high", RoundType: "all", Utility: []string{"Car molly", "Deep smoke", "Flash"}, Positions: []string{"Banana", "CT", "Coffins"}},
			{Title: "A Apps Take", Description: "Flash boiler, take apps control. Set up for split or slow default.", Side: "T", MapArea: "Apartments", Priority: "high", RoundType: "full", Utility: []string{"Boiler flash", "Balcony smoke"}, Positions: []string{"Apps", "Boiler", "Balcony"}},
			{Title: "B Execute", Description: "Smoke CT, molly first/second oranges, flash and rush. Support from banana.", Side: "T", MapArea: "B Site", Priority: "medium", RoundType: "full", Utility: []string{"CT smoke", "First molly", "2x Flash"}, Positions: []string{"Construction", "First", "CT"}},
			{Title: "Pit AWP Control", Description: "Hold pit with AWP, info on apartments. Aggressive if they push.", Side: "CT", MapArea: "A Site", Priority: "high", RoundType: "all", Utility: []string{"Apps molly"}, Positions: []string{"Pit", "Library", "Site"}},
		}
	case "Dust2":
		return []Strategy{
			{Title: "Long Control", Description: "Flash out long doors, take long control with AWP/rifle support.", Side: "T", MapArea: "Long A", Priority: "high", RoundType: "all", Utility: []string{"Long flash", "Corner smoke"}, Positions: []string{"Long", "Pit", "A Site"}},
			{Title: "Mid to B Split", Description: "Smoke xbox, take lower tunnels control. Split B with tunnels players.", Side: "T", MapArea: "B Site", Priority: "medium", RoundType: "full", Utility: []string{"Xbox smoke", "B window smoke"}, Positions: []string{"Mid", "B tunnels", "Window"}},
			{Title: "A Retake Setup", Description: "Play 2 A (long/short), 1 mid, 2 B. Rotate fast through CT.", Side: "CT", MapArea: "All", Priority: "high", RoundType: "all", Utility: []string{"Long molly", "Short smoke"}, Positions: []string{"Long", "Short", "CT"}},
		}
	case "Nuke":
		return []Strategy{
			{Title: "Outside Control", Description: "Take outside with smokes on garage and silo. Control secret.", Side: "T", MapArea: "Outside", Priority: "high", RoundType: "full", Utility: []string{"Garage smoke", "Silo molly"}, Positions: []string{"Outside", "Secret", "Lobby"}},
			{Title: "Ramp Push", Description: "Flash and push ramp. Take control and set up for A execute.", Side: "T", MapArea: "Ramp", Priority: "medium", RoundType: "full", Utility: []string{"Ramp flash", "Heaven smoke"}, Positions: []string{"Ramp", "Hut", "Heaven"}},
			{Title: "Heaven Control CT", Description: "Hold heaven with AWP, info from ramp. Rotate when needed.", Side: "CT", MapArea: "A Site", Priority: "high", RoundType: "all", Utility: []string{"Ramp molly"}, Positions: []string{"Heaven", "Mini", "Hut"}},
		}
	case "Ancient":
		return []Strategy{
			{Title: "Mid Control", Description: "Take mid with smoke on CT. Control donut and cave.", Side: "T", MapArea: "Mid", Priority: "high", RoundType: "all", Utility: []string{"CT smoke", "Cave molly"}, Positions: []string{"Mid", "Donut", "Cave"}},
			{Title: "A Main Execute", Description: "Smoke cubby and CT, flash main and rush. Plant default.", Side: "T", MapArea: "A Site", Priority: "medium", RoundType: "full", Utility: []string{"Cubby smoke", "CT smoke", "2x Flash"}, Positions: []string{"Main", "Donut", "CT"}},
			{Title: "B Hold", Description: "Aggressive B hold with 2 players. Play ramp and back site.", Side: "CT", MapArea: "B Site", Priority: "high", RoundType: "all", Utility: []string{"Ramp molly", "Main smoke"}, Positions: []string{"Ramp", "Back site", "Pillar"}},
		}
	case "Anubis":
		return []Strategy{
			{Title: "Mid Control", Description: "Flash and take mid. Control connector and water.", Side: "T", MapArea: "Mid", Priority: "high", RoundType: "all", Utility: []string{"Mid flash", "Water molly"}, Positions: []string{"Mid", "Connector", "Water"}},
			{Title: "B Execute", Description: "Smoke site, flash main and push. Trade into site.", Side: "T", MapArea: "B Site", Priority: "medium", RoundType: "full", Utility: []string{"Site smoke", "2x Flash"}, Positions: []string{"Main", "Canal", "Ruins"}},
			{Title: "A Anchor", Description: "Hold A with 2 players. One palace, one connector.", Side: "CT", MapArea: "A Site", Priority: "high", RoundType: "all", Utility: []string{"Palace molly"}, Positions: []string{"Palace", "Connector", "Boat"}},
		}
	case "Vertigo":
		return []Strategy{
			{Title: "A Ramp Control", Description: "Flash and take ramp. Set up for A execute.", Side: "T", MapArea: "A Site", Priority: "high", RoundType: "full", Utility: []string{"Ramp flash", "Elevator smoke"}, Positions: []string{"Ramp", "Elevator", "Default"}},
			{Title: "B Stairs Rush", Description: "Fast B push through stairs. Smoke window, flash and go.", Side: "T", MapArea: "B Site", Priority: "medium", RoundType: "force", Utility: []string{"Window smoke", "Stairs flash"}, Positions: []string{"Stairs", "Site", "Generator"}},
			{Title: "Mid Defense", Description: "Hold mid with 2. Control generator and stairs.", Side: "CT", MapArea: "Mid", Priority: "high", RoundType: "all", Utility: []string{"Generator molly"}, Positions: []string{"Mid", "Generator", "Window"}},
		}
	default:
		return []Strategy{
			{Title: "Default Take", Description: "Play default and gather info before executing.", Side: "T", MapArea: "All", Priority: "medium", RoundType: "all", Utility: []string{"Varies"}, Positions: []string{"Map dependent"}},
			{Title: "Stack Defense", Description: "Stack the site with lower enemy activity.", Side: "CT", MapArea: "All", Priority: "medium", RoundType: "all", Utility: []string{"Retake utility"}, Positions: []string{"Site specific"}},
		}
	}
}

func getDetailedMapStrategies(mapName string) []Strategy {
	return getMapStrategiesDetailed(mapName)
}

func generateSoloStrategies(mapName string, yourPlayers, enemyPlayers []Player) []SoloStrategy {
	soloStrats := []SoloStrategy{}
	
	// Find your role (assuming first player is you)
	if len(yourPlayers) > 0 {
		you := yourPlayers[0]
		role := you.Role
		
		// Find enemy weak player to target
		targetEnemy := ""
		for _, e := range enemyPlayers {
			if e.RecentForm == "cold" || e.AvgKD < 0.95 {
				targetEnemy = e.Nickname
				break
			}
		}
		
		// Role-specific solo strategy
		switch role {
		case "entry":
			soloStrats = append(soloStrats, SoloStrategy{
				Role:          "Entry Fragger",
				Position:      getEntryPosition(mapName),
				PrimaryWeapon: "AK-47 / M4A4",
				Playstyle:     "Aggressive peek, take space, create openings",
				Tips: []string{
					"Always have a teammate ready to trade you",
					"Pre-aim common angles when entering",
					"Use flashes to blind defenders before peeking",
					"Don't overextend - get the first kill and fall back",
				},
				Counters: getCountersForRole("entry", enemyPlayers),
			})
		case "awp":
			soloStrats = append(soloStrats, SoloStrategy{
				Role:          "AWPer",
				Position:      getAWPPosition(mapName),
				PrimaryWeapon: "AWP / SSG 08",
				Playstyle:     "Hold angles, get opening picks, control map",
				Tips: []string{
					"Hold off-angles to catch enemies off guard",
					"Reposition after each kill",
					"Keep track of enemy utility - don't get flashed",
					"On eco rounds, use SSG 08 for mobility",
				},
				Counters: getCountersForRole("awp", enemyPlayers),
			})
		case "support":
			soloStrats = append(soloStrats, SoloStrategy{
				Role:          "Support Player",
				Position:      getSupportPosition(mapName),
				PrimaryWeapon: "M4A1-S / FAMAS",
				Playstyle:     "Utility usage, flash for teammates, trade kills",
				Tips: []string{
					"Always have utility available for teammates",
					"Flash for your entry fraggers",
					"Play behind entry to secure trades",
					"Call enemy positions for the team",
				},
				Counters: getCountersForRole("support", enemyPlayers),
			})
		case "lurk":
			soloStrats = append(soloStrats, SoloStrategy{
				Role:          "Lurker",
				Position:      getLurkPosition(mapName),
				PrimaryWeapon: "AK-47 / Galil AR",
				Playstyle:     "Split from team, catch rotators, create pressure",
				Tips: []string{
					"Wait for your team to start the execute",
					"Time your rotations with enemy movements",
					"Don't force fights - wait for opportunities",
					fmt.Sprintf("Target %s if possible (weak performance)", targetEnemy),
				},
				Counters: getCountersForRole("lurk", enemyPlayers),
			})
		default:
			soloStrats = append(soloStrats, SoloStrategy{
				Role:          "IGL / Flex",
				Position:      "Varies based on round",
				PrimaryWeapon: "M4A4 / AK-47",
				Playstyle:     "Call strategies, adapt to enemy patterns",
				Tips: []string{
					"Watch enemy tendencies and adapt",
					"Call timeouts when losing momentum",
					"Keep team morale high",
					"Make mid-round calls based on info",
				},
				Counters: getCountersForRole("igl", enemyPlayers),
			})
		}
	}
	
	return soloStrats
}

func getCountersForRole(role string, enemies []Player) []string {
	counters := []string{}
	
	for _, e := range enemies {
		if e.RecentForm == "hot" || e.AvgKD > 1.2 {
			counters = append(counters, fmt.Sprintf("Watch out for %s (%s, %.2f K/D) - use utility to neutralize", e.Nickname, e.Role, e.AvgKD))
		}
	}
	
	if len(counters) == 0 {
		counters = append(counters, "No major threats identified - play your game")
	}
	
	return counters
}

func getEntryPosition(mapName string) string {
	positions := map[string]string{
		"Mirage":  "A Ramp / Palace entrance",
		"Inferno": "Apartments / Banana front",
		"Dust2":   "Long doors / B tunnels",
		"Nuke":    "Ramp / Outside main",
		"Ancient": "A Main / B Main",
		"Anubis":  "A Main / B Main",
		"Vertigo": "A Ramp / B Stairs",
	}
	if pos, ok := positions[mapName]; ok {
		return pos
	}
	return "Site entry point"
}

func getAWPPosition(mapName string) string {
	positions := map[string]string{
		"Mirage":  "Mid window / A site",
		"Inferno": "Pit / Arch side",
		"Dust2":   "Long A / Mid doors",
		"Nuke":    "Heaven / Outside silo",
		"Ancient": "A site / Mid CT",
		"Anubis":  "A site / Mid",
		"Vertigo": "A site / Mid generator",
	}
	if pos, ok := positions[mapName]; ok {
		return pos
	}
	return "Long angle position"
}

func getSupportPosition(mapName string) string {
	positions := map[string]string{
		"Mirage":  "Behind entry on A / B apps support",
		"Inferno": "Second banana / Apps support",
		"Dust2":   "Behind entry long / B support",
		"Nuke":    "Ramp support / Outside second",
		"Ancient": "Donut support / B connector",
		"Anubis":  "Mid connector / B water",
		"Vertigo": "Ramp second / B support",
	}
	if pos, ok := positions[mapName]; ok {
		return pos
	}
	return "Behind entry fragger"
}

func getLurkPosition(mapName string) string {
	positions := map[string]string{
		"Mirage":  "Underpass / Palace lurk",
		"Inferno": "Apartments / Banana lurk",
		"Dust2":   "Lower tunnels / Short lurk",
		"Nuke":    "Secret / Ramp lurk",
		"Ancient": "Cave / Temple side",
		"Anubis":  "Connector / Water lurk",
		"Vertigo": "Mid lurk / Stairs delay",
	}
	if pos, ok := positions[mapName]; ok {
		return pos
	}
	return "Opposite of main attack"
}

func generateTeamStrategies(mapName string, yourTeam, enemyTeam TeamAnalysis) []TeamStrategy {
	teamStrats := []TeamStrategy{}
	
	// Default strategy based on team style
	if yourTeam.TeamStyle == "aggressive" {
		teamStrats = append(teamStrats, TeamStrategy{
			Name:        "Fast Execute",
			Description: "Use your aggressive playstyle to overwhelm sites quickly",
			Side:        "T",
			Setup:       []string{"Entry takes space early", "Support flashes", "AWP holds mid for rotators"},
			Execution:   []string{"Pop smoke/flash", "Entry goes first", "Support trades", "Lurk watches flank"},
			Fallbacks:   []string{"If stopped, default and rotate", "Save if 2+ down early"},
			KeyPlayers:  []string{"Entry for opening kill", "Support for trades"},
		})
	} else if yourTeam.TeamStyle == "tactical" {
		teamStrats = append(teamStrats, TeamStrategy{
			Name:        "Slow Default",
			Description: "Play slow, gather info, then execute based on enemy setup",
			Side:        "T",
			Setup:       []string{"Spread across map", "Gather info with utility", "Wait for rotation"},
			Execution:   []string{"Identify weak site", "Smoke and flash", "Execute together"},
			Fallbacks:   []string{"If info shows stack, hit other site", "Use lurker for late rotate kills"},
			KeyPlayers:  []string{"IGL for calls", "Lurker for info"},
		})
	}
	
	// Map-specific team strategies
	teamStrats = append(teamStrats, getMapTeamStrategies(mapName)...)
	
	// Counter strategy based on enemy
	if enemyTeam.TeamStyle == "aggressive" {
		teamStrats = append(teamStrats, TeamStrategy{
			Name:        "Anti-Aggression",
			Description: "Counter enemy's aggressive plays with proper positioning",
			Side:        "CT",
			Setup:       []string{"Don't push early", "Set up crossfires", "Save utility for retake"},
			Execution:   []string{"Let them come to you", "Trade aggressively", "Retake with numbers"},
			Fallbacks:   []string{"If site falls fast, set up retake instead of dying for info"},
			KeyPlayers:  []string{"AWP for picks", "Support for retake utility"},
		})
	}
	
	return teamStrats
}

func getMapTeamStrategies(mapName string) []TeamStrategy {
	switch mapName {
	case "Mirage":
		return []TeamStrategy{
			{
				Name:        "A Split",
				Description: "Classic A site split from palace and ramp",
				Side:        "T",
				Setup:       []string{"2 Palace", "3 Ramp/A main"},
				Execution:   []string{"Smoke CT and jungle", "Flash palace and ramp", "Hit together"},
				Fallbacks:   []string{"If CT aggression, fall back and default", "1 lurk underpass"},
				KeyPlayers:  []string{"Palace entry", "Ramp flasher"},
			},
			{
				Name:        "B Apps Execute",
				Description: "Fast B execute through apartments",
				Side:        "T",
				Setup:       []string{"4 Apps", "1 Mid lurk"},
				Execution:   []string{"Smoke window", "Flash apps and push", "Plant safe spot"},
				Fallbacks:   []string{"If heavy resistance, rotate A through underpass"},
				KeyPlayers:  []string{"First apps player", "Mid lurk for rotators"},
			},
		}
	case "Inferno":
		return []TeamStrategy{
			{
				Name:        "B Execute",
				Description: "Standard B site execute with full utility",
				Side:        "T",
				Setup:       []string{"4 Banana", "1 Apartments lurk"},
				Execution:   []string{"Smoke CT and coffins", "Molly first box", "Flash and execute"},
				Fallbacks:   []string{"If banana stacked, fake B and rotate A"},
				KeyPlayers:  []string{"First banana player", "Smoke thrower"},
			},
		}
	default:
		return []TeamStrategy{
			{
				Name:        "Standard Default",
				Description: "Spread and gather info before committing",
				Side:        "T",
				Setup:       []string{"2-1-2 spread"},
				Execution:   []string{"Gather info", "Call based on enemy position", "Execute weak site"},
				Fallbacks:   []string{"Rotate opposite if heavy resistance"},
				KeyPlayers:  []string{"IGL for calls", "Entry for space"},
			},
		}
	}
}

func generateGunRecommendations(players []Player) []GunRecommendation {
	recommendations := []GunRecommendation{}
	
	// Full buy
	recommendations = append(recommendations, GunRecommendation{
		Economy:      "full",
		Weapons:      []string{"AK-47 (T)", "M4A4/M4A1-S (CT)", "AWP (if you're AWPer)"},
		Reason:       "Full armor, full utility. Play for the round win.",
		Alternatives: []string{"Aug/SG if you prefer scoped rifles", "Galil/FAMAS if slightly short on money"},
	})
	
	// Force buy
	recommendations = append(recommendations, GunRecommendation{
		Economy:      "force",
		Weapons:      []string{"Galil AR (T)", "FAMAS (CT)", "Desert Eagle"},
		Reason:       "Force buy to keep pressure. Get close-range fights.",
		Alternatives: []string{"MAC-10/MP9 for mobility", "Scout for picks"},
	})
	
	// Eco
	recommendations = append(recommendations, GunRecommendation{
		Economy:      "eco",
		Weapons:      []string{"P250", "Tec-9 (T)", "Five-SeveN (CT)"},
		Reason:       "Save for next round but try to get kills. Stack a site.",
		Alternatives: []string{"CZ75-Auto for close angles", "Deagle for long range"},
	})
	
	// Pistol round
	recommendations = append(recommendations, GunRecommendation{
		Economy:      "pistol",
		Weapons:      []string{"Default pistol + Kevlar", "P250 + Flash (support)"},
		Reason:       "Armor is key. Work together and trade.",
		Alternatives: []string{"Full utility no armor for support", "Zeus for memes"},
	})
	
	return recommendations
}

func generateRoundStrategies(mapName string, yourTeam, enemyTeam TeamAnalysis) []RoundStrategy {
	strategies := []RoundStrategy{}
	
	strategies = append(strategies, RoundStrategy{
		RoundType: "Pistol (Round 1)",
		TSide:     "Group up and hit a site together. Trade kills. Plant and play post-plant.",
		CTSide:    "Default setup, call rotates fast. Don't die for nothing.",
		KeyPoints: []string{"Armor > utility on pistol", "Trade kills are crucial", "Plant in open for crossfire"},
	})
	
	strategies = append(strategies, RoundStrategy{
		RoundType: "Second Round",
		TSide:     "If won pistol: buy SMGs and armor, hunt. If lost: force or save based on kills.",
		CTSide:    "If won pistol: buy SMGs for anti-eco. If lost: force with good pistols.",
		KeyPoints: []string{"SMGs are OP against no armor", "Don't give away guns", "Play close angles on eco"},
	})
	
	strategies = append(strategies, RoundStrategy{
		RoundType: "Gun Rounds",
		TSide:     "Execute set plays, use utility properly, trade kills, plant for crossfire.",
		CTSide:    "Hold angles, rotate with info, use utility to delay, retake with numbers.",
		KeyPoints: []string{"Don't peek alone", "Use utility before peeking", "Call enemy positions"},
	})
	
	strategies = append(strategies, RoundStrategy{
		RoundType: "Eco Rounds",
		TSide:     "Stack a site, aim for heads, try to get 1-2 kills and save.",
		CTSide:    "Hunt them down but don't get cocky. Respect the deagle.",
		KeyPoints: []string{"P250/Deagle for headshots", "Group up for trades", "Save if you get a kill"},
	})
	
	return strategies
}

func identifyEnemyWeaknesses(enemies []Player) []EnemyWeakness {
	weaknesses := []EnemyWeakness{}
	
	for _, e := range enemies {
		if e.RecentForm == "cold" {
			weaknesses = append(weaknesses, EnemyWeakness{
				Player:       e.Nickname,
				Weakness:     fmt.Sprintf("Cold form - %.2f K/D recently", e.AvgKD),
				Exploitation: "Push their position aggressively, force them into duels",
			})
		}
		if e.AvgKD < 0.95 {
			weaknesses = append(weaknesses, EnemyWeakness{
				Player:       e.Nickname,
				Weakness:     fmt.Sprintf("Low fragging ability - %.2f K/D", e.AvgKD),
				Exploitation: "Challenge them in aim duels, entry through their site",
			})
		}
		if e.AvgHSPercent < 38 {
			weaknesses = append(weaknesses, EnemyWeakness{
				Player:       e.Nickname,
				Weakness:     fmt.Sprintf("Poor accuracy - %d%% HS", e.AvgHSPercent),
				Exploitation: "Shoulder peek them, jiggle angles to bait shots",
			})
		}
		if e.Level < 6 {
			weaknesses = append(weaknesses, EnemyWeakness{
				Player:       e.Nickname,
				Weakness:     fmt.Sprintf("Lower level player - Level %d", e.Level),
				Exploitation: "Use utility and outplay with game sense",
			})
		}
	}
	
	return weaknesses
}

func generateKeyToVictory(yourTeam, enemyTeam TeamAnalysis, mapName string) string {
	eloDiff := yourTeam.AvgElo - enemyTeam.AvgElo
	
	if eloDiff > 200 {
		return "You have the skill advantage. Play confident, don't overthink, and outaim them."
	} else if eloDiff < -200 {
		return "They have higher ELO. Focus on teamwork, trading, and utility usage. Don't take solo fights."
	} else if yourTeam.TeamStyle == "aggressive" && enemyTeam.TeamStyle == "passive" {
		return "Your aggression vs their passive play. Push fast, overwhelm sites, don't give them time to set up."
	} else if yourTeam.TeamStyle == "passive" && enemyTeam.TeamStyle == "aggressive" {
		return "Hold angles and let them come to you. Punish their aggression with crossfires."
	} else {
		return fmt.Sprintf("Pick %s and play your best maps. Focus on mid-round adaptations and trading effectively.", mapName)
	}
}

func generateAnalysis(matchID string, username string) *MatchAnalysis {
	// Generate players with realistic stats
	yourPlayers := generatePlayers(5, true, username)
	enemyPlayers := generatePlayers(5, false, "")

	return analyzeTeams(matchID, yourPlayers, enemyPlayers)
}

func generatePlayers(count int, isYourTeam bool, username string) []Player {
	players := make([]Player, count)
	names := []string{"Phoenix", "Shadow", "Viper", "Storm", "Blaze", "Ghost", "Wolf", "Hawk", "Titan", "Nova"}
	
	for i := 0; i < count; i++ {
		level := rand.Intn(4) + 5 // Level 5-8
		elo := 1200 + (level * 150) + rand.Intn(200) - 100
		kd := 0.8 + rand.Float64()*0.5
		hs := 35 + rand.Intn(25)
		winRate := 45 + rand.Intn(15)
		form := getRandomForm()
		
		nameIndex := i
		if !isYourTeam {
			nameIndex = i + 5
		}
		if nameIndex >= len(names) {
			nameIndex = rand.Intn(len(names))
		}
		
		players[i] = Player{
			Nickname:      names[nameIndex] + fmt.Sprintf("%d", rand.Intn(99)),
			Level:         level,
			Elo:           elo,
			AvgKD:         kd,
			AvgHSPercent:  hs,
			WinRate:       winRate,
			BestMaps:      getRandomMaps(2),
			RecentForm:    form,
			Role:          playerRoles[rand.Intn(len(playerRoles))],
			Playstyle:     playstyles[rand.Intn(len(playstyles))],
			ClutchRate:    15 + rand.Intn(25),
			FirstKillRate: 40 + rand.Intn(25),
			UtilityDamage: 50 + rand.Intn(100),
			FlashAssists:  2 + rand.Intn(5),
			TradingRating: 60 + rand.Intn(30),
		}
		
		// Set username for first player on your team
		if isYourTeam && i == 0 && username != "" {
			players[i].Nickname = username
			players[i].Level = clamp(level+1, 1, 10)
			players[i].AvgKD = kd + 0.15
			players[i].WinRate = clamp(winRate+5, 0, 100)
			players[i].RecentForm = "hot"
		}
	}
	
	return players
}

func getRandomMaps(n int) []string {
	shuffled := make([]string, len(cs2Maps))
	copy(shuffled, cs2Maps)
	rand.Shuffle(len(shuffled), func(i, j int) {
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	})
	return shuffled[:n]
}

func getRandomForm() string {
	forms := []string{"hot", "warm", "cold"}
	weights := []int{20, 50, 30}
	r := rand.Intn(100)
	
	cumulative := 0
	for i, w := range weights {
		cumulative += w
		if r < cumulative {
			return forms[i]
		}
	}
	return "warm"
}

func parseFloat(s string, def float64) float64 {
	var f float64
	_, err := fmt.Sscanf(s, "%f", &f)
	if err != nil {
		return def
	}
	return f
}

func parseInt(s string, def int) int {
	var i int
	_, err := fmt.Sscanf(s, "%d", &i)
	if err != nil {
		return def
	}
	return i
}

func clamp(val, min, max int) int {
	if val < min {
		return min
	}
	if val > max {
		return max
	}
	return val
}
