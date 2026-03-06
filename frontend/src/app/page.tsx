'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Target, Users, Map, Shield, Crosshair, Zap, Settings, ChevronRight, Loader2, Trophy, TrendingUp, Sword, User, Layers, AlertTriangle, Gamepad2, DollarSign } from 'lucide-react'

interface Player {
  nickname: string
  level: number
  elo: number
  avgKD: number
  avgHSPercent: number
  winRate: number
  bestMaps: string[]
  recentForm: 'hot' | 'warm' | 'cold'
  role: string
  playstyle: string
  weaknesses: string[]
  strengths: string[]
  preferredGuns: string[]
  clutchRate: number
  firstKillRate: number
  utilityDamage: number
  flashAssists: number
  tradingRating: number
}

interface MapStats {
  map: string
  winRate: number
  tWinRate: number
  ctWinRate: number
}

interface TeamAnalysis {
  players: Player[]
  avgElo: number
  teamStrength: number
  preferredSide: 'T' | 'CT'
  bestMaps: MapStats[]
  teamStyle: string
  weakSites: string[]
  strongSites: string[]
}

interface Strategy {
  title: string
  description: string
  side: 'T' | 'CT'
  mapArea: string
  priority: string
  roundType: string
  utility: string[]
  positions: string[]
}

interface SoloStrategy {
  role: string
  position: string
  primaryWeapon: string
  playstyle: string
  tips: string[]
  counters: string[]
}

interface TeamStrategy {
  name: string
  description: string
  side: string
  setup: string[]
  execution: string[]
  fallbacks: string[]
  keyPlayers: string[]
}

interface GunRecommendation {
  economy: string
  weapons: string[]
  reason: string
  alternatives: string[]
}

interface RoundStrategy {
  roundType: string
  tSide: string
  ctSide: string
  keyPoints: string[]
}

interface EnemyWeakness {
  player: string
  weakness: string
  exploitation: string
}

interface MatchAnalysis {
  matchId: string
  yourTeam: TeamAnalysis
  enemyTeam: TeamAnalysis
  recommendedMap: string
  recommendedSide: 'T' | 'CT'
  banSuggestions: string[]
  pickOrder: string[]
  strategies: Strategy[]
  soloStrategies: SoloStrategy[]
  teamStrategies: TeamStrategy[]
  gunRecommendations: GunRecommendation[]
  roundStrategies: RoundStrategy[]
  enemyWeaknesses: EnemyWeakness[]
  winProbability: number
  keyToVictory: string
}

interface UserSettings {
  faceitUsername: string
  apiKey: string
}

export default function Home() {
  const [matchUrl, setMatchUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({ faceitUsername: '', apiKey: '' })
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'strategy' | 'solo' | 'team' | 'economy'>('overview')

  useEffect(() => {
    const savedSettings = localStorage.getItem('faceit-analyzer-settings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const saveSettings = () => {
    localStorage.setItem('faceit-analyzer-settings', JSON.stringify(settings))
    setShowSettings(false)
  }

  const analyzeMatch = async () => {
    if (!matchUrl) return
    
    setIsLoading(true)
    
    try {
      const response = await fetch('http://localhost:8080/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          matchUrl, 
          username: settings.faceitUsername,
          apiKey: settings.apiKey 
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
      }
    } catch (error) {
      // Demo data for testing without backend
      setAnalysis(generateDemoAnalysis())
    }
    
    setIsLoading(false)
  }

  const generateDemoAnalysis = (): MatchAnalysis => ({
    matchId: 'demo-123',
    yourTeam: {
      players: [
        { nickname: settings.faceitUsername || 'You', level: 8, elo: 1850, avgKD: 1.15, avgHSPercent: 48, winRate: 54, bestMaps: ['Mirage', 'Inferno'], recentForm: 'hot', role: 'entry', playstyle: 'aggressive', weaknesses: ['Sometimes overpeeks'], strengths: ['Great aim', 'Good opener'], preferredGuns: ['AK-47', 'M4A4'], clutchRate: 28, firstKillRate: 58, utilityDamage: 85, flashAssists: 4, tradingRating: 78 },
        { nickname: 'Viper42', level: 7, elo: 1650, avgKD: 1.02, avgHSPercent: 42, winRate: 51, bestMaps: ['Mirage', 'Dust2'], recentForm: 'warm', role: 'support', playstyle: 'mixed', weaknesses: ['Utility usage'], strengths: ['Good trades'], preferredGuns: ['M4A1-S', 'FAMAS'], clutchRate: 18, firstKillRate: 42, utilityDamage: 120, flashAssists: 6, tradingRating: 82 },
        { nickname: 'Storm77', level: 9, elo: 2100, avgKD: 1.25, avgHSPercent: 55, winRate: 58, bestMaps: ['Inferno', 'Nuke'], recentForm: 'hot', role: 'awp', playstyle: 'mixed', weaknesses: ['Close range'], strengths: ['AWP god', 'High impact'], preferredGuns: ['AWP', 'Desert Eagle'], clutchRate: 35, firstKillRate: 65, utilityDamage: 45, flashAssists: 2, tradingRating: 65 },
        { nickname: 'Ghost15', level: 6, elo: 1450, avgKD: 0.95, avgHSPercent: 38, winRate: 48, bestMaps: ['Dust2', 'Vertigo'], recentForm: 'cold', role: 'support', playstyle: 'passive', weaknesses: ['Low fragging'], strengths: ['Good comms'], preferredGuns: ['FAMAS', 'MP9'], clutchRate: 12, firstKillRate: 35, utilityDamage: 95, flashAssists: 5, tradingRating: 70 },
        { nickname: 'Hawk99', level: 8, elo: 1800, avgKD: 1.08, avgHSPercent: 45, winRate: 52, bestMaps: ['Mirage', 'Ancient'], recentForm: 'warm', role: 'lurk', playstyle: 'passive', weaknesses: ['Timing'], strengths: ['Lurk plays'], preferredGuns: ['AK-47', 'Galil'], clutchRate: 25, firstKillRate: 48, utilityDamage: 65, flashAssists: 3, tradingRating: 72 },
      ],
      avgElo: 1770,
      teamStrength: 72,
      preferredSide: 'CT',
      bestMaps: [{ map: 'Mirage', winRate: 62, tWinRate: 58, ctWinRate: 66 }, { map: 'Inferno', winRate: 58, tWinRate: 55, ctWinRate: 61 }],
      teamStyle: 'mixed',
      weakSites: ['Long range fights'],
      strongSites: ['Site executes', 'Mid control'],
    },
    enemyTeam: {
      players: [
        { nickname: 'Shadow23', level: 7, elo: 1700, avgKD: 1.05, avgHSPercent: 44, winRate: 50, bestMaps: ['Dust2', 'Anubis'], recentForm: 'warm', role: 'entry', playstyle: 'aggressive', weaknesses: ['Predictable'], strengths: ['Aggressive peeks'], preferredGuns: ['AK-47'], clutchRate: 20, firstKillRate: 52, utilityDamage: 70, flashAssists: 3, tradingRating: 68 },
        { nickname: 'Titan55', level: 8, elo: 1900, avgKD: 1.18, avgHSPercent: 51, winRate: 55, bestMaps: ['Nuke', 'Vertigo'], recentForm: 'hot', role: 'awp', playstyle: 'mixed', weaknesses: ['Rifling'], strengths: ['AWP angles'], preferredGuns: ['AWP'], clutchRate: 30, firstKillRate: 60, utilityDamage: 40, flashAssists: 2, tradingRating: 58 },
        { nickname: 'Wolf88', level: 6, elo: 1500, avgKD: 0.92, avgHSPercent: 35, winRate: 46, bestMaps: ['Dust2', 'Mirage'], recentForm: 'cold', role: 'support', playstyle: 'passive', weaknesses: ['Poor aim', 'Low impact'], strengths: ['Utility'], preferredGuns: ['M4A1-S'], clutchRate: 10, firstKillRate: 32, utilityDamage: 110, flashAssists: 5, tradingRating: 75 },
        { nickname: 'Blaze44', level: 7, elo: 1650, avgKD: 1.01, avgHSPercent: 40, winRate: 49, bestMaps: ['Inferno', 'Ancient'], recentForm: 'warm', role: 'lurk', playstyle: 'passive', weaknesses: ['Trade kills'], strengths: ['Lurk timing'], preferredGuns: ['AK-47'], clutchRate: 22, firstKillRate: 45, utilityDamage: 55, flashAssists: 3, tradingRating: 62 },
        { nickname: 'Nova67', level: 8, elo: 1850, avgKD: 1.12, avgHSPercent: 47, winRate: 53, bestMaps: ['Anubis', 'Nuke'], recentForm: 'warm', role: 'igl', playstyle: 'mixed', weaknesses: ['Mechanical skill'], strengths: ['Game sense'], preferredGuns: ['M4A4'], clutchRate: 24, firstKillRate: 48, utilityDamage: 90, flashAssists: 4, tradingRating: 70 },
      ],
      avgElo: 1720,
      teamStrength: 68,
      preferredSide: 'T',
      bestMaps: [{ map: 'Dust2', winRate: 56, tWinRate: 60, ctWinRate: 52 }, { map: 'Nuke', winRate: 54, tWinRate: 58, ctWinRate: 50 }],
      teamStyle: 'aggressive',
      weakSites: ['B site retakes'],
      strongSites: ['A site pushes'],
    },
    recommendedMap: 'Mirage',
    recommendedSide: 'CT',
    banSuggestions: ['Nuke', 'Dust2'],
    pickOrder: ['BAN: Nuke (Enemy 58% T-side)', 'BAN: Dust2 (Enemy 60% T-side)', 'PICK: Mirage (Your 62% WR)'],
    strategies: [
      { title: 'A Ramp Control', description: 'Smoke CT, flash over and take ramp control. Use HE to clear sandwich/stairs.', side: 'T', mapArea: 'A Site', priority: 'high', roundType: 'full', utility: ['2x Smoke', '2x Flash', 'HE'], positions: ['Ramp', 'Tetris', 'Stairs'] },
      { title: 'Mid Control CT', description: 'Hold window with AWP, connector with rifle. Flash if they push.', side: 'CT', mapArea: 'Mid', priority: 'high', roundType: 'all', utility: ['Window smoke (if needed)', 'Connector molly'], positions: ['Window', 'Connector', 'Short'] },
      { title: 'Focus Wolf88', description: 'Player is struggling (0.92 K/D, cold form). Pressure their position aggressively.', side: 'T', mapArea: 'Varies', priority: 'high', roundType: 'all', utility: ['Flash', 'Smoke'], positions: ['Their defensive position'] },
    ],
    soloStrategies: [
      { role: 'Entry Fragger', position: 'A Ramp / Palace entrance', primaryWeapon: 'AK-47 / M4A4', playstyle: 'Aggressive peek, take space, create openings', tips: ['Always have a teammate ready to trade you', 'Pre-aim common angles when entering', 'Use flashes to blind defenders before peeking', 'Don\'t overextend - get the first kill and fall back'], counters: ['Watch out for Titan55 (awp, 1.18 K/D) - use utility to neutralize'] }
    ],
    teamStrategies: [
      { name: 'A Split', description: 'Classic A site split from palace and ramp', side: 'T', setup: ['2 Palace', '3 Ramp/A main'], execution: ['Smoke CT and jungle', 'Flash palace and ramp', 'Hit together'], fallbacks: ['If CT aggression, fall back and default', '1 lurk underpass'], keyPlayers: ['Palace entry', 'Ramp flasher'] },
      { name: 'B Apps Execute', description: 'Fast B execute through apartments', side: 'T', setup: ['4 Apps', '1 Mid lurk'], execution: ['Smoke window', 'Flash apps and push', 'Plant safe spot'], fallbacks: ['If heavy resistance, rotate A through underpass'], keyPlayers: ['First apps player', 'Mid lurk for rotators'] }
    ],
    gunRecommendations: [
      { economy: 'full', weapons: ['AK-47 (T)', 'M4A4/M4A1-S (CT)', 'AWP (if you\'re AWPer)'], reason: 'Full armor, full utility. Play for the round win.', alternatives: ['Aug/SG if you prefer scoped rifles', 'Galil/FAMAS if slightly short on money'] },
      { economy: 'force', weapons: ['Galil AR (T)', 'FAMAS (CT)', 'Desert Eagle'], reason: 'Force buy to keep pressure. Get close-range fights.', alternatives: ['MAC-10/MP9 for mobility', 'Scout for picks'] },
      { economy: 'eco', weapons: ['P250', 'Tec-9 (T)', 'Five-SeveN (CT)'], reason: 'Save for next round but try to get kills. Stack a site.', alternatives: ['CZ75-Auto for close angles', 'Deagle for long range'] },
      { economy: 'pistol', weapons: ['Default pistol + Kevlar', 'P250 + Flash (support)'], reason: 'Armor is key. Work together and trade.', alternatives: ['Full utility no armor for support'] }
    ],
    roundStrategies: [
      { roundType: 'Pistol (Round 1)', tSide: 'Group up and hit a site together. Trade kills. Plant and play post-plant.', ctSide: 'Default setup, call rotates fast. Don\'t die for nothing.', keyPoints: ['Armor > utility on pistol', 'Trade kills are crucial', 'Plant in open for crossfire'] },
      { roundType: 'Gun Rounds', tSide: 'Execute set plays, use utility properly, trade kills, plant for crossfire.', ctSide: 'Hold angles, rotate with info, use utility to delay, retake with numbers.', keyPoints: ['Don\'t peek alone', 'Use utility before peeking', 'Call enemy positions'] }
    ],
    enemyWeaknesses: [
      { player: 'Wolf88', weakness: 'Cold form - 0.92 K/D recently', exploitation: 'Push their position aggressively, force them into duels' },
      { player: 'Wolf88', weakness: 'Poor accuracy - 35% HS', exploitation: 'Shoulder peek them, jiggle angles to bait shots' }
    ],
    winProbability: 58,
    keyToVictory: 'Pick Mirage and play your best maps. Focus on mid-round adaptations and trading effectively.',
  })

  return (
    <main className="min-h-screen">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 glass"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight">FACEIT Analyzer</span>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-surface-light transition-colors"
          >
            <Settings className="w-5 h-5 text-muted hover:text-white transition-colors" />
          </button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Dominate your
              <span className="gradient-text"> FACEIT </span>
              matches
            </h1>
            <p className="text-xl text-muted max-w-2xl mx-auto mb-12">
              Analyze opponents, discover weaknesses, and get AI-powered strategies to win more games.
            </p>
          </motion.div>

          {/* Search Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative max-w-2xl mx-auto"
          >
            <div className="glass rounded-2xl p-2 glow-orange">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-muted ml-4" />
                <input
                  type="text"
                  value={matchUrl}
                  onChange={(e) => setMatchUrl(e.target.value)}
                  placeholder="Paste FACEIT match URL..."
                  className="flex-1 bg-transparent py-4 text-lg outline-none placeholder:text-muted/50"
                  onKeyDown={(e) => e.key === 'Enter' && analyzeMatch()}
                />
                <button
                  onClick={analyzeMatch}
                  disabled={isLoading || !matchUrl}
                  className="px-8 py-4 bg-gradient-to-r from-accent to-accent-light rounded-xl font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Analyze <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          {!analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
            >
              {[
                { icon: Users, label: 'Player Analysis', desc: 'Deep stats on all 10 players' },
                { icon: Map, label: 'Map Prediction', desc: 'Best map selection strategy' },
                { icon: Zap, label: 'Win Tactics', desc: 'AI-generated game plans' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="glass rounded-2xl p-6 text-left hover:bg-surface-light/50 transition-colors"
                >
                  <item.icon className="w-8 h-8 text-accent mb-4" />
                  <h3 className="font-semibold mb-1">{item.label}</h3>
                  <p className="text-sm text-muted">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="px-6 pb-20"
          >
            <div className="max-w-6xl mx-auto">
              {/* Win Probability Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-3xl p-8 mb-8 text-center"
              >
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Trophy className="w-8 h-8 text-accent" />
                  <span className="text-2xl font-semibold">Win Probability</span>
                </div>
                <div className="text-7xl font-bold gradient-text mb-4">
                  {analysis.winProbability}%
                </div>
                <div className="flex items-center justify-center gap-8 text-muted">
                  <div className="flex items-center gap-2">
                    <Map className="w-5 h-5" />
                    <span>Pick: <span className="text-white font-semibold">{analysis.recommendedMap}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    <span>Start: <span className="text-white font-semibold">{analysis.recommendedSide}</span></span>
                  </div>
                </div>
              </motion.div>

              {/* Key to Victory */}
              {analysis.keyToVictory && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-6 mb-8 border border-accent/30"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-6 h-6 text-accent" />
                    <span className="text-lg font-semibold">Key to Victory</span>
                  </div>
                  <p className="text-muted">{analysis.keyToVictory}</p>
                </motion.div>
              )}

              {/* Tabs */}
              <div className="flex gap-2 mb-8 flex-wrap">
                {(['overview', 'players', 'strategy', 'solo', 'team', 'economy'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                      activeTab === tab 
                        ? 'bg-accent text-white' 
                        : 'glass hover:bg-surface-light'
                    }`}
                  >
                    {tab === 'overview' && <Target className="w-4 h-4" />}
                    {tab === 'players' && <Users className="w-4 h-4" />}
                    {tab === 'strategy' && <Map className="w-4 h-4" />}
                    {tab === 'solo' && <User className="w-4 h-4" />}
                    {tab === 'team' && <Layers className="w-4 h-4" />}
                    {tab === 'economy' && <DollarSign className="w-4 h-4" />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {/* Your Team */}
                    <div className="glass rounded-2xl p-6">
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        Your Team
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-muted">Average ELO</span>
                          <span className="font-semibold">{analysis.yourTeam.avgElo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Team Strength</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-surface-lighter rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full"
                                style={{ width: `${analysis.yourTeam.teamStrength}%` }}
                              />
                            </div>
                            <span className="font-semibold">{analysis.yourTeam.teamStrength}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Best Side</span>
                          <span className="font-semibold">{analysis.yourTeam.preferredSide}</span>
                        </div>
                        <div>
                          <span className="text-muted block mb-2">Best Maps</span>
                          <div className="flex gap-2">
                            {analysis.yourTeam.bestMaps.map((m) => (
                              <span key={m.map} className="px-3 py-1 bg-surface-lighter rounded-lg text-sm">
                                {m.map} <span className="text-green-400">{m.winRate}%</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enemy Team */}
                    <div className="glass rounded-2xl p-6">
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        Enemy Team
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-muted">Average ELO</span>
                          <span className="font-semibold">{analysis.enemyTeam.avgElo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Team Strength</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-surface-lighter rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                                style={{ width: `${analysis.enemyTeam.teamStrength}%` }}
                              />
                            </div>
                            <span className="font-semibold">{analysis.enemyTeam.teamStrength}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted">Best Side</span>
                          <span className="font-semibold">{analysis.enemyTeam.preferredSide}</span>
                        </div>
                        <div>
                          <span className="text-muted block mb-2">Best Maps (BAN THESE)</span>
                          <div className="flex gap-2">
                            {analysis.enemyTeam.bestMaps.map((m) => (
                              <span key={m.map} className="px-3 py-1 bg-red-950/50 border border-red-800/50 rounded-lg text-sm">
                                {m.map} <span className="text-red-400">{m.winRate}%</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ban Suggestions */}
                    <div className="glass rounded-2xl p-6 md:col-span-2">
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Crosshair className="w-5 h-5 text-accent" />
                        Map Veto Strategy
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-green-950/30 border border-green-800/30 rounded-xl">
                          <span className="text-xs text-green-400 uppercase tracking-wider">Pick</span>
                          <div className="text-lg font-semibold mt-1">{analysis.recommendedMap}</div>
                        </div>
                        {analysis.banSuggestions.map((map, i) => (
                          <div key={map} className="text-center p-4 bg-red-950/30 border border-red-800/30 rounded-xl">
                            <span className="text-xs text-red-400 uppercase tracking-wider">Ban {i + 1}</span>
                            <div className="text-lg font-semibold mt-1">{map}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'players' && (
                  <motion.div
                    key="players"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    {/* Enemy Weaknesses Alert */}
                    {analysis.enemyWeaknesses && analysis.enemyWeaknesses.length > 0 && (
                      <div className="glass rounded-2xl p-6 border border-red-500/30">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                          Enemy Weaknesses to Exploit
                        </h3>
                        <div className="grid gap-3">
                          {analysis.enemyWeaknesses.slice(0, 3).map((w, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-red-950/30 rounded-lg">
                              <Crosshair className="w-5 h-5 text-red-400 mt-0.5" />
                              <div>
                                <div className="font-semibold text-red-300">{w.player}: {w.weakness}</div>
                                <div className="text-sm text-muted">{w.exploitation}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Your Team Players */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        Your Team
                      </h3>
                      <div className="grid gap-3">
                        {analysis.yourTeam.players.map((player, i) => (
                          <motion.div
                            key={player.nickname}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass rounded-xl p-4"
                          >
                            <div className="flex items-center gap-4 mb-3">
                              <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                                player.level >= 8 ? 'bg-amber-600/20 text-amber-400' :
                                player.level >= 6 ? 'bg-purple-600/20 text-purple-400' :
                                'bg-surface-lighter text-muted'
                              }`}>
                                <span className="text-lg font-bold">{player.level}</span>
                                <span className="text-[10px] uppercase">LVL</span>
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold flex items-center gap-2">
                                  {player.nickname}
                                  {player.recentForm === 'hot' && <TrendingUp className="w-4 h-4 text-green-400" />}
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    player.role === 'awp' ? 'bg-yellow-600/20 text-yellow-400' :
                                    player.role === 'entry' ? 'bg-red-600/20 text-red-400' :
                                    player.role === 'support' ? 'bg-blue-600/20 text-blue-400' :
                                    player.role === 'lurk' ? 'bg-purple-600/20 text-purple-400' :
                                    'bg-green-600/20 text-green-400'
                                  }`}>
                                    {player.role?.toUpperCase()}
                                  </span>
                                </div>
                                <div className="text-sm text-muted">{player.elo} ELO · {player.playstyle} playstyle</div>
                              </div>
                              <div className="grid grid-cols-5 gap-4 text-center">
                                <div>
                                  <div className="text-xs text-muted">K/D</div>
                                  <div className={`font-semibold ${player.avgKD >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                                    {player.avgKD.toFixed(2)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted">HS%</div>
                                  <div className="font-semibold">{player.avgHSPercent}%</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted">Win</div>
                                  <div className={`font-semibold ${player.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                    {player.winRate}%
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted">1st Kill</div>
                                  <div className="font-semibold">{player.firstKillRate}%</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted">Form</div>
                                  <div className={`font-semibold ${
                                    player.recentForm === 'hot' ? 'text-green-400' :
                                    player.recentForm === 'warm' ? 'text-yellow-400' : 'text-blue-400'
                                  }`}>
                                    {player.recentForm === 'hot' ? '🔥' : player.recentForm === 'warm' ? '⚡' : '❄️'}
                                  </div>
                                </div>
                              </div>
                            </div>
                            {player.strengths && player.strengths.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {player.strengths.slice(0, 3).map((s, idx) => (
                                  <span key={idx} className="text-xs px-2 py-1 bg-green-950/50 text-green-400 rounded">+{s}</span>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Enemy Team Players */}
                    <div>
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        Enemy Team
                      </h3>
                      <div className="grid gap-3">
                        {analysis.enemyTeam.players.map((player, i) => (
                          <motion.div
                            key={player.nickname}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`glass rounded-xl p-4 ${player.recentForm === 'cold' || player.avgKD < 0.95 ? 'border border-red-500/30' : ''}`}
                          >
                            <div className="flex items-center gap-4 mb-3">
                              <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                                player.level >= 8 ? 'bg-amber-600/20 text-amber-400' :
                                player.level >= 6 ? 'bg-purple-600/20 text-purple-400' :
                                'bg-surface-lighter text-muted'
                              }`}>
                                <span className="text-lg font-bold">{player.level}</span>
                                <span className="text-[10px] uppercase">LVL</span>
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold flex items-center gap-2">
                                  {player.nickname}
                                  {(player.recentForm === 'cold' || player.avgKD < 0.95) && <span className="text-xs bg-red-600/30 text-red-300 px-2 py-0.5 rounded animate-pulse">TARGET</span>}
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    player.role === 'awp' ? 'bg-yellow-600/20 text-yellow-400' :
                                    player.role === 'entry' ? 'bg-red-600/20 text-red-400' :
                                    player.role === 'support' ? 'bg-blue-600/20 text-blue-400' :
                                    player.role === 'lurk' ? 'bg-purple-600/20 text-purple-400' :
                                    'bg-green-600/20 text-green-400'
                                  }`}>
                                    {player.role?.toUpperCase()}
                                  </span>
                                </div>
                                <div className="text-sm text-muted">{player.elo} ELO · {player.playstyle} playstyle</div>
                              </div>
                              <div className="grid grid-cols-5 gap-4 text-center">
                                <div>
                                  <div className="text-xs text-muted">K/D</div>
                                  <div className={`font-semibold ${player.avgKD >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                                    {player.avgKD.toFixed(2)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted">HS%</div>
                                  <div className="font-semibold">{player.avgHSPercent}%</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted">Win</div>
                                  <div className={`font-semibold ${player.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                    {player.winRate}%
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted">1st Kill</div>
                                  <div className="font-semibold">{player.firstKillRate}%</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted">Form</div>
                                  <div className={`font-semibold ${
                                    player.recentForm === 'hot' ? 'text-red-400' :
                                    player.recentForm === 'warm' ? 'text-yellow-400' : 'text-green-400'
                                  }`}>
                                    {player.recentForm === 'hot' ? '⚠️' : player.recentForm === 'warm' ? '⚡' : '✓'}
                                  </div>
                                </div>
                              </div>
                            </div>
                            {player.weaknesses && player.weaknesses.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {player.weaknesses.slice(0, 3).map((w, idx) => (
                                  <span key={idx} className="text-xs px-2 py-1 bg-red-950/50 text-red-400 rounded">-{w}</span>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'strategy' && (
                  <motion.div
                    key="strategy"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid gap-6"
                  >
                    <div className="glass rounded-2xl p-6">
                      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-accent" />
                        Recommended Strategies
                      </h3>
                      <div className="grid gap-4">
                        {analysis.strategies.map((strategy, i) => (
                          <motion.div
                            key={strategy.title}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-4 bg-surface-light/50 rounded-xl border border-white/5"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                strategy.side === 'T' ? 'bg-amber-600/20 text-amber-400' : 'bg-blue-600/20 text-blue-400'
                              }`}>
                                {strategy.side}
                              </span>
                              <span className="text-xs text-muted">{strategy.mapArea}</span>
                              {strategy.priority && (
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  strategy.priority === 'high' ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'
                                }`}>
                                  {strategy.priority}
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold mb-1">{strategy.title}</h4>
                            <p className="text-muted text-sm mb-2">{strategy.description}</p>
                            {strategy.utility && strategy.utility.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {strategy.utility.map((u, idx) => (
                                  <span key={idx} className="text-xs px-2 py-0.5 bg-surface-lighter rounded">{u}</span>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Round Strategies */}
                    {analysis.roundStrategies && analysis.roundStrategies.length > 0 && (
                      <div className="glass rounded-2xl p-6">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <Gamepad2 className="w-5 h-5 text-accent" />
                          Round-by-Round Guide
                        </h3>
                        <div className="space-y-4">
                          {analysis.roundStrategies.map((rs, i) => (
                            <div key={i} className="p-4 bg-surface-light/50 rounded-xl border border-white/5">
                              <h4 className="font-semibold mb-3">{rs.roundType}</h4>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-3 bg-amber-950/30 border border-amber-800/30 rounded-lg">
                                  <div className="text-xs text-amber-400 mb-1 font-semibold">T SIDE</div>
                                  <p className="text-sm text-muted">{rs.tSide}</p>
                                </div>
                                <div className="p-3 bg-blue-950/30 border border-blue-800/30 rounded-lg">
                                  <div className="text-xs text-blue-400 mb-1 font-semibold">CT SIDE</div>
                                  <p className="text-sm text-muted">{rs.ctSide}</p>
                                </div>
                              </div>
                              {rs.keyPoints && rs.keyPoints.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {rs.keyPoints.map((kp, idx) => (
                                    <span key={idx} className="text-xs px-2 py-1 bg-surface-lighter rounded">💡 {kp}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'solo' && (
                  <motion.div
                    key="solo"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="glass rounded-2xl p-6">
                      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-accent" />
                        Your Solo Strategy
                      </h3>
                      {analysis.soloStrategies && analysis.soloStrategies.map((solo, i) => (
                        <div key={i} className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-surface-light/50 rounded-xl">
                              <div className="text-sm text-muted mb-1">Your Role</div>
                              <div className="text-2xl font-bold text-accent">{solo.role}</div>
                            </div>
                            <div className="p-4 bg-surface-light/50 rounded-xl">
                              <div className="text-sm text-muted mb-1">Position</div>
                              <div className="text-lg font-semibold">{solo.position}</div>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-surface-light/50 rounded-xl">
                              <div className="text-sm text-muted mb-1">Primary Weapon</div>
                              <div className="text-lg font-semibold">{solo.primaryWeapon}</div>
                            </div>
                            <div className="p-4 bg-surface-light/50 rounded-xl">
                              <div className="text-sm text-muted mb-1">Playstyle</div>
                              <div className="text-lg font-semibold">{solo.playstyle}</div>
                            </div>
                          </div>

                          <div className="p-4 bg-green-950/30 border border-green-800/30 rounded-xl">
                            <div className="text-sm text-green-400 mb-2 font-semibold">💡 Tips for Your Role</div>
                            <ul className="space-y-2">
                              {solo.tips.map((tip, idx) => (
                                <li key={idx} className="text-sm text-muted flex items-start gap-2">
                                  <span className="text-green-400">•</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {solo.counters && solo.counters.length > 0 && (
                            <div className="p-4 bg-red-950/30 border border-red-800/30 rounded-xl">
                              <div className="text-sm text-red-400 mb-2 font-semibold">⚠️ Watch Out For</div>
                              <ul className="space-y-2">
                                {solo.counters.map((counter, idx) => (
                                  <li key={idx} className="text-sm text-muted flex items-start gap-2">
                                    <span className="text-red-400">•</span>
                                    {counter}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'team' && (
                  <motion.div
                    key="team"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="glass rounded-2xl p-6">
                      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-accent" />
                        Team Strategies
                      </h3>
                      <div className="space-y-6">
                        {analysis.teamStrategies && analysis.teamStrategies.map((team, i) => (
                          <div key={i} className="p-4 bg-surface-light/50 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3 mb-3">
                              <span className={`px-3 py-1 rounded text-sm font-bold ${
                                team.side === 'T' ? 'bg-amber-600/20 text-amber-400' : 'bg-blue-600/20 text-blue-400'
                              }`}>
                                {team.side}
                              </span>
                              <h4 className="text-lg font-semibold">{team.name}</h4>
                            </div>
                            <p className="text-muted mb-4">{team.description}</p>
                            
                            <div className="grid md:grid-cols-3 gap-4">
                              <div className="p-3 bg-surface rounded-lg">
                                <div className="text-xs text-accent mb-2 font-semibold">📋 Setup</div>
                                <ul className="space-y-1">
                                  {team.setup.map((s, idx) => (
                                    <li key={idx} className="text-sm text-muted">• {s}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="p-3 bg-surface rounded-lg">
                                <div className="text-xs text-green-400 mb-2 font-semibold">⚡ Execution</div>
                                <ul className="space-y-1">
                                  {team.execution.map((e, idx) => (
                                    <li key={idx} className="text-sm text-muted">• {e}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="p-3 bg-surface rounded-lg">
                                <div className="text-xs text-yellow-400 mb-2 font-semibold">🔄 Fallbacks</div>
                                <ul className="space-y-1">
                                  {team.fallbacks.map((f, idx) => (
                                    <li key={idx} className="text-sm text-muted">• {f}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            
                            {team.keyPlayers && team.keyPlayers.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-4">
                                <span className="text-xs text-muted">Key Players:</span>
                                {team.keyPlayers.map((kp, idx) => (
                                  <span key={idx} className="text-xs px-2 py-1 bg-accent/20 text-accent rounded">{kp}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'economy' && (
                  <motion.div
                    key="economy"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="glass rounded-2xl p-6">
                      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-accent" />
                        Gun Recommendations by Economy
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {analysis.gunRecommendations && analysis.gunRecommendations.map((gun, i) => (
                          <div key={i} className={`p-4 rounded-xl border ${
                            gun.economy === 'full' ? 'bg-green-950/30 border-green-800/30' :
                            gun.economy === 'force' ? 'bg-yellow-950/30 border-yellow-800/30' :
                            gun.economy === 'eco' ? 'bg-red-950/30 border-red-800/30' :
                            'bg-blue-950/30 border-blue-800/30'
                          }`}>
                            <div className={`text-sm font-bold mb-2 ${
                              gun.economy === 'full' ? 'text-green-400' :
                              gun.economy === 'force' ? 'text-yellow-400' :
                              gun.economy === 'eco' ? 'text-red-400' :
                              'text-blue-400'
                            }`}>
                              {gun.economy.toUpperCase()} BUY
                            </div>
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {gun.weapons.map((w, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-surface-lighter rounded text-sm font-semibold">{w}</span>
                                ))}
                              </div>
                              <p className="text-sm text-muted">{gun.reason}</p>
                              {gun.alternatives && gun.alternatives.length > 0 && (
                                <div className="text-xs text-muted">
                                  <span className="text-muted/70">Alt: </span>
                                  {gun.alternatives.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pick Order */}
                    {analysis.pickOrder && analysis.pickOrder.length > 0 && (
                      <div className="glass rounded-2xl p-6">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <Map className="w-5 h-5 text-accent" />
                          Map Veto Order
                        </h3>
                        <div className="space-y-2">
                          {analysis.pickOrder.map((po, i) => (
                            <div key={i} className={`p-3 rounded-lg flex items-center gap-3 ${
                              po.includes('BAN') ? 'bg-red-950/30 border border-red-800/30' : 'bg-green-950/30 border border-green-800/30'
                            }`}>
                              <span className="text-lg font-bold text-muted">{i + 1}.</span>
                              <span className={`font-semibold ${po.includes('BAN') ? 'text-red-400' : 'text-green-400'}`}>{po}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-8 w-full max-w-md mx-4"
            >
              <h2 className="text-2xl font-bold mb-6">Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted mb-2">Your FACEIT Username</label>
                  <input
                    type="text"
                    value={settings.faceitUsername}
                    onChange={(e) => setSettings({ ...settings, faceitUsername: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-light rounded-xl border border-white/10 outline-none focus:border-accent transition-colors"
                    placeholder="Enter your username"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-2">FACEIT API Key (Optional)</label>
                  <input
                    type="password"
                    value={settings.apiKey}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-light rounded-xl border border-white/10 outline-none focus:border-accent transition-colors"
                    placeholder="For enhanced data access"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-surface-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  className="flex-1 py-3 rounded-xl bg-accent hover:bg-accent-light transition-colors font-semibold"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
