'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Target, Users, Map, Shield, Crosshair, Zap, ChevronRight, Loader2, Trophy, Sword, User, Layers, AlertTriangle, Gamepad2, DollarSign, RefreshCw, X, Flame, BarChart3, TrendingUp, Eye, Move, Skull, Download, Settings, Wifi, WifiOff, Volume2, VolumeX, MessageCircle, Clock, MapPin, Mic, MicOff, AlertOctagon, Star, ThumbsDown } from 'lucide-react'

// ===== VISUAL COMPONENT: Pie Chart =====
const PieChart = ({ data, size = 120, innerRadius = 0.5 }: { 
  data: { value: number; color: string; label: string }[]; 
  size?: number;
  innerRadius?: number;
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = -90

  const createPieSlice = (startAngle: number, endAngle: number, color: string) => {
    const start = (startAngle * Math.PI) / 180
    const end = (endAngle * Math.PI) / 180
    const radius = size / 2
    const inner = radius * innerRadius

    const x1 = radius + radius * Math.cos(start)
    const y1 = radius + radius * Math.sin(start)
    const x2 = radius + radius * Math.cos(end)
    const y2 = radius + radius * Math.sin(end)
    const x3 = radius + inner * Math.cos(end)
    const y3 = radius + inner * Math.sin(end)
    const x4 = radius + inner * Math.cos(start)
    const y4 = radius + inner * Math.sin(start)

    const largeArc = endAngle - startAngle > 180 ? 1 : 0

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${largeArc} 0 ${x4} ${y4} Z`
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {data.map((item, i) => {
          const angle = (item.value / total) * 360
          const startAngle = currentAngle
          currentAngle += angle
          return (
            <motion.path
              key={i}
              d={createPieSlice(startAngle, startAngle + angle - 0.5, item.color)}
              fill={item.color}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold">{total.toFixed(0)}</div>
          <div className="text-[10px] text-muted">TOTAL</div>
        </div>
      </div>
    </div>
  )
}

// ===== VISUAL COMPONENT: Progress Ring =====
const ProgressRing = ({ value, max, size = 80, strokeWidth = 8, color = '#f97316', label, sublabel }: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = Math.min(value / max, 1)
  const offset = circumference - progress * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold">{value}</span>
        </div>
      </div>
      {label && <div className="text-xs font-semibold mt-1">{label}</div>}
      {sublabel && <div className="text-[10px] text-muted">{sublabel}</div>}
    </div>
  )
}

// ===== VISUAL COMPONENT: Radar Chart =====
const RadarChart = ({ data, size = 160 }: {
  data: { label: string; value: number; max: number }[];
  size?: number;
}) => {
  const center = size / 2
  const radius = size / 2 - 20
  const angleStep = (2 * Math.PI) / data.length

  const getPoint = (angle: number, value: number, max: number) => {
    const r = (value / max) * radius
    return {
      x: center + r * Math.cos(angle - Math.PI / 2),
      y: center + r * Math.sin(angle - Math.PI / 2),
    }
  }

  const getLabelPoint = (angle: number) => ({
    x: center + (radius + 15) * Math.cos(angle - Math.PI / 2),
    y: center + (radius + 15) * Math.sin(angle - Math.PI / 2),
  })

  const polygon = data
    .map((item, i) => {
      const p = getPoint(i * angleStep, item.value, item.max)
      return `${p.x},${p.y}`
    })
    .join(' ')

  return (
    <svg width={size} height={size}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={data
            .map((_, i) => {
              const p = getPoint(i * angleStep, scale * 100, 100)
              return `${p.x},${p.y}`
            })
            .join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      ))}
      {/* Axis lines */}
      {data.map((_, i) => {
        const p = getPoint(i * angleStep, 100, 100)
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        )
      })}
      {/* Data polygon */}
      <motion.polygon
        points={polygon}
        fill="rgba(249, 115, 22, 0.3)"
        stroke="#f97316"
        strokeWidth="2"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ transformOrigin: 'center' }}
      />
      {/* Data points */}
      {data.map((item, i) => {
        const p = getPoint(i * angleStep, item.value, item.max)
        return (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#f97316"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
          />
        )
      })}
      {/* Labels */}
      {data.map((item, i) => {
        const p = getLabelPoint(i * angleStep)
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted text-[9px]"
          >
            {item.label}
          </text>
        )
      })}
    </svg>
  )
}

// ===== VISUAL COMPONENT: Strategy Mini Map =====
const StrategyMiniMap = ({ mapName, positions, side }: {
  mapName: string;
  positions: { x: number; y: number; label: string; role: string }[];
  side: 'T' | 'CT';
}) => {
  const mapColors = {
    T: { bg: 'rgba(217, 119, 6, 0.2)', border: 'rgba(217, 119, 6, 0.5)', dot: '#f59e0b' },
    CT: { bg: 'rgba(37, 99, 235, 0.2)', border: 'rgba(37, 99, 235, 0.5)', dot: '#3b82f6' },
  }

  return (
    <div 
      className="relative rounded-xl overflow-hidden"
      style={{ 
        width: 200, 
        height: 200, 
        background: `linear-gradient(135deg, ${mapColors[side].bg}, transparent)`,
        border: `1px solid ${mapColors[side].border}`
      }}
    >
      {/* Grid overlay */}
      <svg className="absolute inset-0" width="200" height="200">
        {[1, 2, 3].map(i => (
          <g key={i}>
            <line x1={50 * i} y1="0" x2={50 * i} y2="200" stroke="rgba(255,255,255,0.05)" />
            <line x1="0" y1={50 * i} x2="200" y2={50 * i} stroke="rgba(255,255,255,0.05)" />
          </g>
        ))}
      </svg>
      
      {/* Map name */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-xs font-semibold">
        {mapName}
      </div>

      {/* Site markers */}
      <div className="absolute top-8 left-8 w-8 h-8 border-2 border-dashed border-white/20 rounded flex items-center justify-center text-xs text-white/30">A</div>
      <div className="absolute bottom-8 right-8 w-8 h-8 border-2 border-dashed border-white/20 rounded flex items-center justify-center text-xs text-white/30">B</div>
      
      {/* Player positions */}
      {positions.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute flex flex-col items-center"
          style={{ left: pos.x, top: pos.y }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.15 }}
        >
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ backgroundColor: mapColors[side].dot }}
          >
            {i + 1}
          </div>
          <span className="text-[8px] text-white/70 mt-0.5 whitespace-nowrap">{pos.label}</span>
        </motion.div>
      ))}

      {/* Arrow showing execute direction */}
      <svg className="absolute inset-0 pointer-events-none" width="200" height="200">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={mapColors[side].dot} />
          </marker>
        </defs>
        <motion.line
          x1="100"
          y1="180"
          x2="100"
          y2="60"
          stroke={mapColors[side].dot}
          strokeWidth="2"
          strokeDasharray="5,5"
          markerEnd="url(#arrowhead)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </svg>
    </div>
  )
}

// ===== VISUAL COMPONENT: Threat Meter =====
const ThreatMeter = ({ level, name }: { level: string; name: string }) => {
  const levels = ['low', 'medium', 'high', 'extreme']
  const activeIndex = levels.indexOf(level.toLowerCase())
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-muted mb-1">{name}</div>
      <div className="flex gap-1">
        {levels.map((l, i) => (
          <motion.div
            key={l}
            className={`w-2 h-6 rounded-sm ${
              i <= activeIndex 
                ? i === 3 ? 'bg-red-500' : i === 2 ? 'bg-orange-500' : i === 1 ? 'bg-yellow-500' : 'bg-green-500'
                : 'bg-white/10'
            }`}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.1 }}
            style={{ transformOrigin: 'bottom' }}
          />
        ))}
      </div>
    </div>
  )
}

// ===== VISUAL COMPONENT: Team Comparison Bar =====
const ComparisonBar = ({ yourValue, enemyValue, label, format = 'number' }: {
  yourValue: number;
  enemyValue: number;
  label: string;
  format?: 'number' | 'percent';
}) => {
  const total = yourValue + enemyValue
  const yourPercent = (yourValue / total) * 100
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-green-400">{format === 'percent' ? `${yourValue}%` : yourValue}</span>
        <span className="text-muted">{label}</span>
        <span className="text-red-400">{format === 'percent' ? `${enemyValue}%` : enemyValue}</span>
      </div>
      <div className="h-2 bg-surface-lighter rounded-full overflow-hidden flex">
        <motion.div 
          className="bg-gradient-to-r from-green-600 to-green-400 h-full"
          initial={{ width: 0 }}
          animate={{ width: `${yourPercent}%` }}
          transition={{ duration: 0.8 }}
        />
        <motion.div 
          className="bg-gradient-to-r from-red-400 to-red-600 h-full"
          initial={{ width: 0 }}
          animate={{ width: `${100 - yourPercent}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  )
}

// ===== VISUAL COMPONENT: Action Card =====
const ActionCard = ({ icon: Icon, title, description, color, steps }: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  steps?: string[];
}) => (
  <motion.div
    className="rounded-xl p-4 border"
    style={{ backgroundColor: `${color}15`, borderColor: `${color}40` }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
  >
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}30` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <h4 className="font-semibold" style={{ color }}>{title}</h4>
    </div>
    <p className="text-sm text-muted mb-3">{description}</p>
    {steps && steps.length > 0 && (
      <div className="space-y-1">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `${color}30`, color }}>{i + 1}</span>
            <span className="text-muted">{step}</span>
          </div>
        ))}
      </div>
    )}
  </motion.div>
)

// ===== VISUAL COMPONENT: Player Heatmap =====
const PlayerHeatmap = ({ 
  killPositions, 
  deathPositions, 
  mapName,
  playerName,
  size = 280 
}: {
  killPositions: { x: number; y: number }[];
  deathPositions: { x: number; y: number }[];
  mapName: string;
  playerName: string;
  size?: number;
}) => {
  // Normalize positions to 0-1 range based on CS2 map coordinates
  // Typical CS2 coordinates range from about -2000 to 2000
  const normalizePos = (pos: { x: number; y: number }) => ({
    x: ((pos.x + 3000) / 6000) * size,
    y: ((pos.y + 3000) / 6000) * size,
  })

  const [showKills, setShowKills] = useState(true)
  const [showDeaths, setShowDeaths] = useState(true)

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h4 className="font-semibold text-sm">{playerName}</h4>
          <span className="text-xs text-muted">{mapName} Heatmap</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowKills(!showKills)}
            className={`px-2 py-1 rounded text-xs ${showKills ? 'bg-green-600/30 text-green-400' : 'bg-surface-lighter text-muted'}`}
          >
            Kills ({killPositions.length})
          </button>
          <button
            onClick={() => setShowDeaths(!showDeaths)}
            className={`px-2 py-1 rounded text-xs ${showDeaths ? 'bg-red-600/30 text-red-400' : 'bg-surface-lighter text-muted'}`}
          >
            Deaths ({deathPositions.length})
          </button>
        </div>
      </div>
      
      <div 
        className="relative rounded-lg overflow-hidden bg-surface-lighter"
        style={{ width: size, height: size }}
      >
        {/* Grid */}
        <svg className="absolute inset-0" width={size} height={size}>
          {[1, 2, 3, 4, 5].map(i => (
            <g key={i}>
              <line x1={size / 6 * i} y1="0" x2={size / 6 * i} y2={size} stroke="rgba(255,255,255,0.05)" />
              <line x1="0" y1={size / 6 * i} x2={size} y2={size / 6 * i} stroke="rgba(255,255,255,0.05)" />
            </g>
          ))}
        </svg>

        {/* Map label */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-xs font-semibold z-10">
          {mapName.toUpperCase()}
        </div>

        {/* Site markers */}
        <div className="absolute top-8 left-8 w-10 h-10 border-2 border-dashed border-white/20 rounded flex items-center justify-center text-sm text-white/30 font-bold">A</div>
        <div className="absolute bottom-8 right-8 w-10 h-10 border-2 border-dashed border-white/20 rounded flex items-center justify-center text-sm text-white/30 font-bold">B</div>

        {/* Kill positions */}
        {showKills && killPositions.map((pos, i) => {
          const norm = normalizePos(pos)
          return (
            <motion.div
              key={`kill-${i}`}
              className="absolute w-3 h-3 rounded-full bg-green-500/70 border border-green-400"
              style={{ left: norm.x - 6, top: norm.y - 6 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.02 }}
            />
          )
        })}

        {/* Death positions */}
        {showDeaths && deathPositions.map((pos, i) => {
          const norm = normalizePos(pos)
          return (
            <motion.div
              key={`death-${i}`}
              className="absolute w-3 h-3"
              style={{ left: norm.x - 6, top: norm.y - 6 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.02 }}
            >
              <X className="w-3 h-3 text-red-500" />
            </motion.div>
          )
        })}

        {/* Legend */}
        <div className="absolute bottom-2 right-2 bg-black/60 rounded px-2 py-1 flex gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Kill</span>
          <span className="flex items-center gap-1"><X className="w-2 h-2 text-red-500" />Death</span>
        </div>
      </div>
    </div>
  )
}

interface MapSpecificStats {
  map: string
  kd: number
  winRate: number
  matches: number
  avgKills: number
  avgDeaths: number
  hsPercent: number
}

interface Player {
  nickname: string
  avatar: string
  level: number
  elo: number
  avgKD: number
  avgHSPercent: number
  winRate: number
  bestMaps: string[]
  worstMaps: string[]
  mapStats: MapSpecificStats[]
  recentForm: 'hot' | 'warm' | 'cold'
  role: string
  playstyle: string
  playerType: string
  weaknesses: string[]
  strengths: string[]
  preferredGuns: string[]
  clutchRate: number
  firstKillRate: number
  utilityDamage: number
  flashAssists: number
  tradingRating: number
  aceRate: number
  quadKillRate: number
  tripleKillRate: number
  multiKillRating: number
  consistency: number
  peakPerformance: string
  threatLevel: string
  // Demo analysis fields
  killPositions?: { x: number; y: number }[]
  deathPositions?: { x: number; y: number }[]
  commonAreas?: string[]
  demoADR?: number
  // Behavior analysis
  isCommunicating?: boolean
  toxicityScore?: number
  teamworkRating?: number
  isCarry?: boolean
  isBottomFrag?: boolean
  matchesPlayed?: number
  recentMatches?: number
  voiceActivity?: 'silent' | 'callouts' | 'talkative'
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
  // Demo analysis fields
  demoAnalysisEnabled?: boolean
  demoUrls?: string[]
  mapPlayed?: string
}

export default function Home() {
  const [matchUrl, setMatchUrl] = useState('')
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'strategy' | 'solo' | 'team' | 'economy' | 'tactical'>('overview')
  const [showTeamSelect, setShowTeamSelect] = useState(false)
  const [pendingAnalysis, setPendingAnalysis] = useState<MatchAnalysis | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<'team1' | 'team2' | null>(null)
  
  // WebSocket and auto-refresh state
  const [wsConnected, setWsConnected] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(15)
  const [matchStatus, setMatchStatus] = useState<'live' | 'finished' | null>(null)
  const [matchExpiresAt, setMatchExpiresAt] = useState<Date | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastRefreshRef = useRef<Date | null>(null)

  // Map callout data for tactical display
  const mapCallouts: Record<string, { aSite: string[], bSite: string[], mid: string[], tSpawn: string[], ctSpawn: string[] }> = {
    'Mirage': { 
      aSite: ['Tetris', 'Stairs', 'Sandwich', 'CT Spawn', 'Jungle', 'Triple Box'],
      bSite: ['Van', 'Market Window', 'Bench', 'Short', 'Apps', 'Kitchen'],
      mid: ['Window', 'Connector', 'Underpass', 'Top Mid', 'Catwalk'],
      tSpawn: ['T Spawn', 'T Ramp', 'Palace'],
      ctSpawn: ['CT', 'Ticket', 'Ladder']
    },
    'Inferno': {
      aSite: ['Pit', 'Graveyard', 'Site', 'Balcony', 'Library', 'Arch'],
      bSite: ['First Orange', 'Dark', 'New Box', 'Fountain', 'Construction', 'CT'],
      mid: ['Top Mid', 'Mexico', 'Alt Mid', 'Underpass'],
      tSpawn: ['T Spawn', 'Banana', 'Car', 'Logs'],
      ctSpawn: ['CT Spawn', 'Speedway', 'Arch']
    },
    'Dust2': {
      aSite: ['Long', 'Car', 'Site', 'Ramp', 'Goose', 'Short'],
      bSite: ['Platform', 'Back Site', 'Big Box', 'Window', 'Double Door', 'Tunnel'],
      mid: ['Mid Doors', 'Xbox', 'Catwalk', 'Palm'],
      tSpawn: ['T Spawn', 'Long Doors', 'Upper Tunnels'],
      ctSpawn: ['CT Spawn', 'Short Stairs', 'Ramp']
    },
    'Nuke': {
      aSite: ['Heaven', 'Hell', 'Hut', 'Squeaky', 'Main', 'Vent'],
      bSite: ['Ramp', 'Control Room', 'Secret', 'Decon', 'Dark', 'Window'],
      mid: ['Lobby', 'Radio', 'Trophy'],
      tSpawn: ['T Spawn', 'Outside', 'Garage', 'Silo'],
      ctSpawn: ['CT Spawn', 'Heaven', 'Yard']
    },
    'Overpass': {
      aSite: ['Long', 'Toilets', 'Truck', 'Van', 'Default', 'Bank'],
      bSite: ['Monster', 'Pillar', 'Water', 'Heaven', 'Graffiti', 'Construction'],
      mid: ['Connector', 'Playground'],
      tSpawn: ['T Spawn', 'Fountain'],
      ctSpawn: ['CT Spawn', 'Stairs']
    },
    'Ancient': {
      aSite: ['Main', 'Donut', 'Red', 'Temple', 'Back Site'],
      bSite: ['Ramp', 'Alley', 'Cave', 'Tile'],
      mid: ['Mid', 'House', 'T Mid', 'Elbow'],
      tSpawn: ['T Spawn', 'T Main'],
      ctSpawn: ['CT Spawn', 'CT']
    },
    'Anubis': {
      aSite: ['Main', 'Heaven', 'Alley', 'Palace', 'Water', 'Default'],
      bSite: ['Main', 'Canal', 'Pillar', 'Bridge', 'Site'],
      mid: ['Mid', 'Connector', 'Ruins'],
      tSpawn: ['T Spawn', 'Street'],
      ctSpawn: ['CT Spawn', 'Boat']
    },
    'Vertigo': {
      aSite: ['Ramp', 'Elevator', 'Headshot', 'Default', 'Generator'],
      bSite: ['Stairs', 'CT', 'Scaffolding', 'T Balcony', 'Site'],
      mid: ['Mid', 'Mid Boost', 'Sandbags'],
      tSpawn: ['T Spawn', 'T Stairs'],
      ctSpawn: ['CT Spawn', 'Big Box']
    }
  }

  // WebSocket connection
  const connectWebSocket = useCallback((matchId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close()
    }

    const ws = new WebSocket(`ws://localhost:8080/ws?matchId=${matchId}&username=${username}`)
    
    ws.onopen = () => {
      console.log('[WS] Connected')
      setWsConnected(true)
    }
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        console.log('[WS] Message:', msg.type)
        
        if (msg.type === 'match_update' || msg.type === 'match_state') {
          if (msg.payload.analysis) {
            setAnalysis(msg.payload.analysis)
          }
          setMatchStatus(msg.payload.status)
          if (msg.payload.expiresAt) {
            setMatchExpiresAt(new Date(msg.payload.expiresAt))
          }
        } else if (msg.type === 'match_expired') {
          setError('Match data has expired')
          setAnalysis(null)
        }
      } catch (e) {
        console.error('[WS] Parse error:', e)
      }
    }
    
    ws.onclose = () => {
      console.log('[WS] Disconnected')
      setWsConnected(false)
    }
    
    ws.onerror = (e) => {
      console.error('[WS] Error:', e)
      setWsConnected(false)
    }
    
    wsRef.current = ws
  }, [username])

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh && analysis && matchStatus === 'live') {
      refreshTimerRef.current = setInterval(() => {
        console.log('[Auto-refresh] Refreshing...')
        lastRefreshRef.current = new Date()
        analyzeMatch()
      }, refreshInterval * 1000)
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [autoRefresh, analysis, matchStatus, refreshInterval])

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Download match results
  const downloadResults = async () => {
    if (!analysis) return
    
    try {
      const response = await fetch(`http://localhost:8080/api/match/${analysis.matchId}/download`)
      const data = await response.json()
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `match_${analysis.matchId}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Download failed:', e)
    }
  }

  useEffect(() => {
    const savedUsername = localStorage.getItem('faceit-username')
    if (savedUsername) {
      setUsername(savedUsername)
    }
  }, [])

  useEffect(() => {
    if (username) {
      localStorage.setItem('faceit-username', username)
    }
  }, [username])

  // Handle team selection confirmation
  const confirmTeamSelection = (team: 'team1' | 'team2') => {
    if (!pendingAnalysis) return
    
    // If team2 is selected, swap the teams
    if (team === 'team2') {
      setAnalysis({
        ...pendingAnalysis,
        yourTeam: pendingAnalysis.enemyTeam,
        enemyTeam: pendingAnalysis.yourTeam,
        // Recalculate win probability (inverse)
        winProbability: 100 - pendingAnalysis.winProbability,
      })
    } else {
      setAnalysis(pendingAnalysis)
    }
    
    setShowTeamSelect(false)
    setPendingAnalysis(null)
    setSelectedTeam(team)
  }

  const analyzeMatch = async () => {
    if (!matchUrl) return
    
    setIsLoading(true)
    setError(null)
    setShowTeamSelect(false)
    lastRefreshRef.current = new Date()
    
    try {
      const response = await fetch('http://localhost:8080/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          matchUrl, 
          username
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Connect WebSocket for real-time updates
        if (data.matchId) {
          connectWebSocket(data.matchId)
        }
        
        // If no username set, show team selection
        if (!username.trim()) {
          setPendingAnalysis(data)
          setShowTeamSelect(true)
        } else {
          setAnalysis(data)
          setMatchStatus('live')
        }
      } else {
        setError(data.error || 'Failed to analyze match')
      }
    } catch (err) {
      // Show error when backend is unavailable
      setError('Could not connect to server. Please make sure the backend is running on localhost:8080')
    }
    
    setIsLoading(false)
  }

  return (
    <main className="min-h-screen">
      {/* Team Selection Modal */}
      <AnimatePresence>
        {showTeamSelect && pendingAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-3xl p-8 max-w-4xl w-full border border-white/10"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Which team are you on?</h2>
                <p className="text-muted">Select your team to get personalized strategies</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Team 1 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => confirmTeamSelection('team1')}
                  className="group relative p-6 rounded-2xl bg-gradient-to-br from-green-950/50 to-green-900/20 border border-green-500/30 hover:border-green-500/60 transition-all text-left"
                >
                  <div className="absolute top-4 right-4 px-3 py-1 bg-green-500/20 rounded-full text-xs text-green-400 font-semibold">
                    TEAM 1
                  </div>
                  <h3 className="text-lg font-semibold mb-4 text-green-400">Your Team</h3>
                  <div className="space-y-2">
                    {pendingAnalysis.yourTeam.players.slice(0, 5).map((player, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-black/20">
                        <div className="relative">
                          <img 
                            src={player.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${player.nickname}`} 
                            alt={player.nickname}
                            className="w-8 h-8 rounded-lg object-cover bg-surface-lighter"
                          />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center border border-surface ${
                            player.level >= 8 ? 'bg-amber-600 text-white' :
                            player.level >= 6 ? 'bg-purple-600 text-white' :
                            'bg-surface-lighter text-muted'
                          }`}>
                            {player.level}
                          </div>
                        </div>
                        <span className="text-sm">{player.nickname}</span>
                        <span className="text-xs text-muted ml-auto">{player.elo} ELO</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted">Avg ELO</span>
                    <span className="font-semibold text-green-400">{pendingAnalysis.yourTeam.avgElo}</span>
                  </div>
                </motion.button>

                {/* Team 2 */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => confirmTeamSelection('team2')}
                  className="group relative p-6 rounded-2xl bg-gradient-to-br from-red-950/50 to-red-900/20 border border-red-500/30 hover:border-red-500/60 transition-all text-left"
                >
                  <div className="absolute top-4 right-4 px-3 py-1 bg-red-500/20 rounded-full text-xs text-red-400 font-semibold">
                    TEAM 2
                  </div>
                  <h3 className="text-lg font-semibold mb-4 text-red-400">Enemy Team</h3>
                  <div className="space-y-2">
                    {pendingAnalysis.enemyTeam.players.slice(0, 5).map((player, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-black/20">
                        <div className="relative">
                          <img 
                            src={player.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${player.nickname}`} 
                            alt={player.nickname}
                            className="w-8 h-8 rounded-lg object-cover bg-surface-lighter"
                          />
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center border border-surface ${
                            player.level >= 8 ? 'bg-amber-600 text-white' :
                            player.level >= 6 ? 'bg-purple-600 text-white' :
                            'bg-surface-lighter text-muted'
                          }`}>
                            {player.level}
                          </div>
                        </div>
                        <span className="text-sm">{player.nickname}</span>
                        <span className="text-xs text-muted ml-auto">{player.elo} ELO</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted">Avg ELO</span>
                    <span className="font-semibold text-red-400">{pendingAnalysis.enemyTeam.avgElo}</span>
                  </div>
                </motion.button>
              </div>

              <p className="text-center text-xs text-muted mt-6">
                Tip: Set your FACEIT username in the header to skip this step next time
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl p-6 max-w-md w-full border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </h2>
                <button onClick={() => setShowSettings(false)} className="p-2 rounded-lg hover:bg-surface-light">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Auto-refresh toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-lighter">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Auto-Refresh
                    </div>
                    <div className="text-sm text-muted">Refresh analysis every {refreshInterval}s</div>
                  </div>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`w-14 h-8 rounded-full transition-colors ${autoRefresh ? 'bg-accent' : 'bg-surface-light'}`}
                  >
                    <motion.div
                      className="w-6 h-6 rounded-full bg-white shadow-lg"
                      animate={{ x: autoRefresh ? 28 : 4 }}
                    />
                  </button>
                </div>
                
                {/* Refresh interval */}
                <div className="p-4 rounded-xl bg-surface-lighter">
                  <div className="font-semibold mb-2">Refresh Interval</div>
                  <div className="flex gap-2">
                    {[10, 15, 30, 60].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setRefreshInterval(sec)}
                        className={`px-4 py-2 rounded-lg ${refreshInterval === sec ? 'bg-accent text-white' : 'bg-surface-light hover:bg-surface'}`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* WebSocket status */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-lighter">
                  <div className="flex items-center gap-2">
                    {wsConnected ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-red-400" />}
                    <span>WebSocket</span>
                  </div>
                  <span className={`text-sm ${wsConnected ? 'text-green-400' : 'text-red-400'}`}>
                    {wsConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            
            {/* Status indicators */}
            {analysis && (
              <div className="flex items-center gap-2 ml-4">
                {wsConnected ? (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-900/30 text-green-400 text-xs">
                    <Wifi className="w-3 h-3" />
                    <span>Live</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-900/30 text-red-400 text-xs">
                    <WifiOff className="w-3 h-3" />
                  </div>
                )}
                {autoRefresh && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-900/30 text-blue-400 text-xs">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>{refreshInterval}s</span>
                  </div>
                )}
                {matchStatus === 'finished' && matchExpiresAt && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-900/30 text-amber-400 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>Expires in {Math.max(0, Math.floor((matchExpiresAt.getTime() - Date.now()) / 60000))}m</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Download button */}
            {analysis && matchStatus === 'finished' && (
              <button
                onClick={downloadResults}
                className="p-2 rounded-lg bg-green-900/30 text-green-400 hover:bg-green-900/50 transition-colors"
                title="Download Results"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            
            {/* Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-surface-light transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your FACEIT username"
                className="bg-surface-light/50 px-4 py-2 rounded-lg border border-white/10 outline-none focus:border-accent transition-colors text-sm w-48"
              />
            </div>
          </div>
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
            
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 flex items-center gap-3"
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
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
              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end gap-3 mb-6"
              >
                <button
                  onClick={analyzeMatch}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-surface-light rounded-xl hover:bg-surface-light/80 transition-all border border-white/10 group"
                >
                  <RefreshCw className={`w-4 h-4 text-accent group-hover:rotate-180 transition-transform duration-500 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Analysis</span>
                </button>
                <button
                  onClick={() => {
                    setAnalysis(null)
                    setMatchUrl('')
                    setError(null)
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500/20 rounded-xl hover:bg-red-500/30 transition-all border border-red-500/50 text-red-400"
                >
                  <X className="w-4 h-4" />
                  <span>Finished</span>
                </button>
              </motion.div>

              {/* Win Probability Card with Visuals */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-3xl p-8 mb-8"
              >
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Trophy className="w-8 h-8 text-accent" />
                  <span className="text-2xl font-semibold">Match Analysis</span>
                </div>
                
                {/* Main win probability visual */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
                  <div className="text-center">
                    <ProgressRing 
                      value={analysis.winProbability} 
                      max={100} 
                      size={140} 
                      strokeWidth={12}
                      color={analysis.winProbability >= 60 ? '#22c55e' : analysis.winProbability >= 45 ? '#f97316' : '#ef4444'}
                      label="WIN CHANCE"
                    />
                  </div>
                  
                  {/* Team comparison pie chart */}
                  <div className="flex items-center gap-4">
                    <PieChart 
                      data={[
                        { value: analysis.yourTeam.teamStrength, color: '#22c55e', label: 'Your Team' },
                        { value: analysis.enemyTeam.teamStrength, color: '#ef4444', label: 'Enemy Team' },
                      ]}
                      size={100}
                      innerRadius={0.6}
                    />
                    <div className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 rounded bg-green-500" />
                        <span>Your Team ({analysis.yourTeam.teamStrength}%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-red-500" />
                        <span>Enemy ({analysis.enemyTeam.teamStrength}%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <ProgressRing value={analysis.yourTeam.avgElo} max={3000} size={70} strokeWidth={6} color="#3b82f6" label="YOUR ELO" />
                  <ProgressRing value={analysis.enemyTeam.avgElo} max={3000} size={70} strokeWidth={6} color="#ef4444" label="ENEMY ELO" />
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold text-accent">{analysis.recommendedMap}</div>
                    <div className="text-xs text-muted">PICK THIS MAP</div>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className={`text-2xl font-bold ${analysis.recommendedSide === 'CT' ? 'text-blue-400' : 'text-amber-400'}`}>{analysis.recommendedSide}</div>
                    <div className="text-xs text-muted">START SIDE</div>
                  </div>
                </div>

                {/* Team Comparison Bars */}
                <div className="space-y-3 max-w-lg mx-auto">
                  <ComparisonBar yourValue={analysis.yourTeam.avgElo} enemyValue={analysis.enemyTeam.avgElo} label="ELO" />
                  <ComparisonBar yourValue={analysis.yourTeam.teamStrength} enemyValue={analysis.enemyTeam.teamStrength} label="STRENGTH" format="percent" />
                </div>
              </motion.div>

              {/* Key to Victory */}
              {analysis.keyToVictory && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-6 mb-8 border border-accent/30"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-6 h-6 text-accent" />
                    <span className="text-lg font-semibold">Key to Victory</span>
                  </div>
                  <p className="text-muted mb-6">{analysis.keyToVictory}</p>
                  
                  {/* Visual Action Cards */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <ActionCard 
                      icon={Target}
                      title="Focus Target"
                      description={analysis.enemyWeaknesses?.[0]?.player || 'Weakest enemy'}
                      color="#ef4444"
                      steps={[
                        'Push their position early',
                        'Force them into duels',
                        'Exploit cold form'
                      ]}
                    />
                    <ActionCard 
                      icon={Map}
                      title="Map Control"
                      description={`Secure ${analysis.recommendedMap} mid first`}
                      color="#3b82f6"
                      steps={[
                        'Take mid control T-side',
                        'Use utility to take space',
                        'Call rotations fast'
                      ]}
                    />
                    <ActionCard 
                      icon={Users}
                      title="Team Play"
                      description="Trade kills, never die alone"
                      color="#22c55e"
                      steps={[
                        'Always have a trade partner',
                        'Communicate enemy positions',
                        'Play for crossfires'
                      ]}
                    />
                  </div>
                </motion.div>
              )}

              {/* Tabs */}
              <div className="flex gap-2 mb-8 flex-wrap">
                {(['overview', 'players', 'strategy', 'solo', 'team', 'economy', 'tactical'] as const).map((tab) => (
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
                    {tab === 'tactical' && <MapPin className="w-4 h-4" />}
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
                    className="space-y-6"
                  >
                    {/* Visual Strategy Preview */}
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      <div className="glass rounded-2xl p-6">
                        <h4 className="text-sm font-semibold mb-4 text-accent">T-SIDE EXECUTE</h4>
                        <StrategyMiniMap 
                          mapName={analysis.recommendedMap}
                          side="T"
                          positions={[
                            { x: 40, y: 140, label: 'Entry', role: 'entry' },
                            { x: 80, y: 150, label: 'Flash', role: 'support' },
                            { x: 60, y: 100, label: 'AWP', role: 'awp' },
                            { x: 140, y: 160, label: 'Lurk', role: 'lurk' },
                            { x: 100, y: 130, label: 'Trade', role: 'support' },
                          ]}
                        />
                      </div>
                      
                      {/* Team Radar Comparison */}
                      <div className="glass rounded-2xl p-6">
                        <h4 className="text-sm font-semibold mb-4 text-center">YOUR TEAM SKILLS</h4>
                        <div className="flex justify-center">
                          <RadarChart 
                            data={[
                              { label: 'AIM', value: Math.round(analysis.yourTeam.players.reduce((a, p) => a + p.avgHSPercent, 0) / 5), max: 100 },
                              { label: 'CLUTCH', value: Math.round(analysis.yourTeam.players.reduce((a, p) => a + p.clutchRate, 0) / 5), max: 50 },
                              { label: 'ENTRY', value: Math.round(analysis.yourTeam.players.reduce((a, p) => a + p.firstKillRate, 0) / 5), max: 100 },
                              { label: 'MULTI-K', value: Math.round(analysis.yourTeam.players.reduce((a, p) => a + p.multiKillRating, 0) / 5), max: 100 },
                              { label: 'TRADE', value: Math.round(analysis.yourTeam.players.reduce((a, p) => a + p.tradingRating, 0) / 5), max: 100 },
                            ]}
                            size={140}
                          />
                        </div>
                      </div>
                      
                      <div className="glass rounded-2xl p-6">
                        <h4 className="text-sm font-semibold mb-4 text-accent">CT-SIDE SETUP</h4>
                        <StrategyMiniMap 
                          mapName={analysis.recommendedMap}
                          side="CT"
                          positions={[
                            { x: 35, y: 50, label: 'A Site', role: 'anchor' },
                            { x: 70, y: 60, label: 'A Sup', role: 'support' },
                            { x: 100, y: 100, label: 'Mid', role: 'awp' },
                            { x: 150, y: 140, label: 'B Site', role: 'anchor' },
                            { x: 130, y: 100, label: 'Rotator', role: 'lurk' },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Enemy Threat Overview */}
                    <div className="glass rounded-2xl p-6 mb-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Skull className="w-5 h-5 text-red-400" />
                        Enemy Threat Levels
                      </h3>
                      <div className="flex flex-wrap justify-center gap-6">
                        {analysis.enemyTeam.players.map((player) => (
                          <ThreatMeter key={player.nickname} level={player.threatLevel} name={player.nickname} />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              {/* Avatar with Level Badge */}
                              <div className="relative">
                                <img 
                                  src={player.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${player.nickname}`} 
                                  alt={player.nickname}
                                  className="w-14 h-14 rounded-xl object-cover bg-surface-lighter"
                                />
                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold border-2 border-surface ${
                                  player.level >= 8 ? 'bg-amber-600 text-white' :
                                  player.level >= 6 ? 'bg-purple-600 text-white' :
                                  'bg-surface-lighter text-muted'
                                }`}>
                                  {player.level}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold flex items-center gap-2 flex-wrap">
                                  {player.nickname}
                                  {player.recentForm === 'hot' && <Flame className="w-4 h-4 text-orange-400" />}
                                  {/* Behavior badges */}
                                  {player.isCarry && <span title="Usually carries"><Star className="w-4 h-4 text-yellow-400" /></span>}
                                  {player.voiceActivity === 'talkative' && <span title="Good comms"><Mic className="w-4 h-4 text-green-400" /></span>}
                                  {player.voiceActivity === 'callouts' && <span title="Callouts only"><MessageCircle className="w-4 h-4 text-blue-400" /></span>}
                                  {player.voiceActivity === 'silent' && <span title="No comms"><MicOff className="w-4 h-4 text-red-400" /></span>}
                                  {player.toxicityScore && player.toxicityScore > 50 && <span title="Can be toxic"><AlertOctagon className="w-4 h-4 text-orange-400" /></span>}
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    player.playerType?.includes('Star') || player.playerType?.includes('AWP') ? 'bg-yellow-600/20 text-yellow-400' :
                                    player.playerType?.includes('Entry') ? 'bg-red-600/20 text-red-400' :
                                    player.playerType?.includes('Support') ? 'bg-blue-600/20 text-blue-400' :
                                    player.playerType?.includes('Lurk') ? 'bg-purple-600/20 text-purple-400' :
                                    'bg-green-600/20 text-green-400'
                                  }`}>
                                    {player.playerType || player.role?.toUpperCase()}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    player.threatLevel === 'extreme' ? 'bg-red-600/30 text-red-300' :
                                    player.threatLevel === 'high' ? 'bg-orange-600/30 text-orange-300' :
                                    player.threatLevel === 'medium' ? 'bg-yellow-600/30 text-yellow-300' :
                                    'bg-gray-600/30 text-gray-300'
                                  }`}>
                                    {player.threatLevel?.toUpperCase()} THREAT
                                  </span>
                                </div>
                                <div className="text-sm text-muted flex items-center gap-2">
                                  {player.elo} ELO · {player.playstyle} · Peak: {player.peakPerformance} game
                                  {player.matchesPlayed && <span className="text-xs">· {player.matchesPlayed} matches</span>}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-7 gap-3 text-center mb-3">
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
                                <div className="text-xs text-muted">Clutch</div>
                                <div className="font-semibold">{player.clutchRate}%</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted">4K%</div>
                                <div className={`font-semibold ${player.quadKillRate >= 2 ? 'text-accent' : ''}`}>
                                  {player.quadKillRate?.toFixed(1)}%
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted">Multi-K</div>
                                <div className={`font-semibold ${player.multiKillRating >= 70 ? 'text-accent' : ''}`}>
                                  {player.multiKillRating}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted">Consist.</div>
                                <div className="font-semibold">{player.consistency}%</div>
                              </div>
                            </div>
                            {/* Map Stats */}
                            {player.mapStats && player.mapStats.length > 0 && (
                              <div className="mb-3">
                                <div className="text-xs text-muted mb-2 flex items-center gap-1">
                                  <BarChart3 className="w-3 h-3" /> Map Performance (K/D)
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {player.mapStats.slice(0, 5).map((ms) => (
                                    <span key={ms.map} className={`text-xs px-2 py-1 rounded ${
                                      ms.kd >= 1.2 ? 'bg-green-950/50 text-green-400' :
                                      ms.kd >= 1.0 ? 'bg-surface-light text-white' :
                                      'bg-red-950/50 text-red-400'
                                    }`}>
                                      {ms.map}: {ms.kd.toFixed(2)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {player.strengths && player.strengths.length > 0 && (
                              <div className="flex flex-wrap gap-2">
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
                            className={`glass rounded-xl p-4 ${player.recentForm === 'cold' || player.avgKD < 0.95 ? 'border border-red-500/30' : player.threatLevel === 'extreme' ? 'border border-orange-500/30' : ''}`}
                          >
                            <div className="flex items-center gap-4 mb-3">
                              {/* Avatar with Level Badge */}
                              <div className="relative">
                                <img 
                                  src={player.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${player.nickname}`} 
                                  alt={player.nickname}
                                  className="w-14 h-14 rounded-xl object-cover bg-surface-lighter"
                                />
                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold border-2 border-surface ${
                                  player.level >= 8 ? 'bg-amber-600 text-white' :
                                  player.level >= 6 ? 'bg-purple-600 text-white' :
                                  'bg-surface-lighter text-muted'
                                }`}>
                                  {player.level}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold flex items-center gap-2 flex-wrap">
                                  {player.nickname}
                                  {(player.recentForm === 'cold' || player.avgKD < 0.95) && <span className="text-xs bg-red-600/30 text-red-300 px-2 py-0.5 rounded animate-pulse">TARGET</span>}
                                  {player.threatLevel === 'extreme' && <span className="text-xs bg-orange-600/30 text-orange-300 px-2 py-0.5 rounded">⚠️ DANGER</span>}
                                  {/* Behavior badges */}
                                  {player.isBottomFrag && <span title="Usually bottom frag"><ThumbsDown className="w-4 h-4 text-red-400" /></span>}
                                  {player.voiceActivity === 'silent' && <span title="No comms - easy target"><MicOff className="w-4 h-4 text-gray-400" /></span>}
                                  {player.toxicityScore && player.toxicityScore > 40 && <span title="May tilt easily"><AlertOctagon className="w-4 h-4 text-orange-400" /></span>}
                                  {player.isCarry && <span title="Team's carry"><Star className="w-4 h-4 text-yellow-400" /></span>}
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    player.playerType?.includes('Star') || player.playerType?.includes('AWP') ? 'bg-yellow-600/20 text-yellow-400' :
                                    player.playerType?.includes('Entry') ? 'bg-red-600/20 text-red-400' :
                                    player.playerType?.includes('Support') ? 'bg-blue-600/20 text-blue-400' :
                                    player.playerType?.includes('Lurk') ? 'bg-purple-600/20 text-purple-400' :
                                    'bg-green-600/20 text-green-400'
                                  }`}>
                                    {player.playerType || player.role?.toUpperCase()}
                                  </span>
                                </div>
                                <div className="text-sm text-muted flex items-center gap-2">
                                  {player.elo} ELO · {player.playstyle} · Peak: {player.peakPerformance} game
                                  {player.matchesPlayed && <span className="text-xs">· {player.matchesPlayed} matches</span>}
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-7 gap-3 text-center mb-3">
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
                                <div className="text-xs text-muted">Clutch</div>
                                <div className="font-semibold">{player.clutchRate}%</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted">4K%</div>
                                <div className={`font-semibold ${player.quadKillRate >= 2 ? 'text-orange-400' : ''}`}>
                                  {player.quadKillRate?.toFixed(1)}%
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted">Multi-K</div>
                                <div className={`font-semibold ${player.multiKillRating >= 70 ? 'text-orange-400' : ''}`}>
                                  {player.multiKillRating}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted">Threat</div>
                                <div className={`font-semibold ${
                                  player.threatLevel === 'extreme' ? 'text-red-400' :
                                  player.threatLevel === 'high' ? 'text-orange-400' :
                                  player.threatLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
                                }`}>
                                  {player.threatLevel?.charAt(0).toUpperCase()}
                                </div>
                              </div>
                            </div>
                            {/* Map Stats - Show weakest maps */}
                            {player.mapStats && player.mapStats.length > 0 && (
                              <div className="mb-3">
                                <div className="text-xs text-muted mb-2 flex items-center gap-1">
                                  <BarChart3 className="w-3 h-3" /> Weak Maps (exploit these!)
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {[...player.mapStats].sort((a, b) => a.kd - b.kd).slice(0, 3).map((ms) => (
                                    <span key={ms.map} className="text-xs px-2 py-1 rounded bg-red-950/50 text-red-400">
                                      {ms.map}: {ms.kd.toFixed(2)} K/D ({ms.winRate}% WR)
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {player.weaknesses && player.weaknesses.length > 0 && (
                              <div className="flex flex-wrap gap-2">
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
                    {/* Visual Position Guide */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="glass rounded-2xl p-6">
                        <h4 className="text-sm font-semibold mb-4 text-amber-400 flex items-center gap-2">
                          <Move className="w-4 h-4" /> YOUR T-SIDE POSITION
                        </h4>
                        <StrategyMiniMap 
                          mapName={analysis.recommendedMap}
                          side="T"
                          positions={[
                            { x: 80, y: 140, label: 'YOU', role: 'you' },
                          ]}
                        />
                        <p className="text-xs text-muted mt-3 text-center">
                          {analysis.soloStrategies?.[0]?.position || 'Main entry point'}
                        </p>
                      </div>
                      <div className="glass rounded-2xl p-6">
                        <h4 className="text-sm font-semibold mb-4 text-blue-400 flex items-center gap-2">
                          <Eye className="w-4 h-4" /> YOUR CT-SIDE POSITION
                        </h4>
                        <StrategyMiniMap 
                          mapName={analysis.recommendedMap}
                          side="CT"
                          positions={[
                            { x: 100, y: 80, label: 'YOU', role: 'you' },
                          ]}
                        />
                        <p className="text-xs text-muted mt-3 text-center">
                          Hold angle, wait for info
                        </p>
                      </div>
                    </div>

                    <div className="glass rounded-2xl p-6">
                      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-accent" />
                        Your Solo Strategy
                      </h3>
                      {analysis.soloStrategies && analysis.soloStrategies.map((solo, i) => (
                        <div key={i} className="space-y-6">
                          {/* Role Visual Card */}
                          <div className="flex items-center justify-center gap-8 py-4">
                            <ProgressRing value={analysis.yourTeam.players[0]?.clutchRate || 25} max={50} size={90} strokeWidth={8} color="#22c55e" label="CLUTCH" sublabel="RATE" />
                            <div className="text-center">
                              <div className="text-4xl font-bold text-accent mb-1">{solo.role}</div>
                              <div className="text-sm text-muted">Your assigned role</div>
                            </div>
                            <ProgressRing value={analysis.yourTeam.players[0]?.firstKillRate || 50} max={100} size={90} strokeWidth={8} color="#f97316" label="ENTRY" sublabel="RATE" />
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-surface-light/50 rounded-xl">
                              <div className="text-sm text-muted mb-1">Position</div>
                              <div className="text-lg font-semibold">{solo.position}</div>
                            </div>
                            <div className="p-4 bg-surface-light/50 rounded-xl">
                              <div className="text-sm text-muted mb-1">Primary Weapon</div>
                              <div className="text-lg font-semibold">{solo.primaryWeapon}</div>
                            </div>
                          </div>
                          
                          <div className="p-4 bg-surface-light/50 rounded-xl">
                            <div className="text-sm text-muted mb-1">Playstyle</div>
                            <div className="text-lg font-semibold">{solo.playstyle}</div>
                          </div>

                          {/* Action Steps Visual */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <ActionCard 
                              icon={TrendingUp}
                              title="Do This"
                              description="Key actions for success"
                              color="#22c55e"
                              steps={solo.tips.slice(0, 3)}
                            />
                            <ActionCard 
                              icon={AlertTriangle}
                              title="Avoid This"
                              description="Common mistakes"
                              color="#ef4444"
                              steps={solo.counters?.slice(0, 3) || ['Pushing alone', 'Wasting utility', 'Over-peeking']}
                            />
                          </div>
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
                            
                            {/* Strategy Visual */}
                            <div className="flex flex-col md:flex-row gap-4 mb-4">
                              <StrategyMiniMap 
                                mapName={analysis.recommendedMap}
                                side={team.side as 'T' | 'CT'}
                                positions={
                                  team.name.includes('Split') 
                                    ? [
                                        { x: 40, y: 60, label: '2', role: 'entry' },
                                        { x: 80, y: 130, label: '3', role: 'support' },
                                      ]
                                    : team.name.includes('Execute') || team.name.includes('B')
                                    ? [
                                        { x: 140, y: 120, label: '4', role: 'entry' },
                                        { x: 100, y: 100, label: '1', role: 'lurk' },
                                      ]
                                    : [
                                        { x: 60, y: 100, label: '5', role: 'default' },
                                      ]
                                }
                              />
                              <div className="flex-1">
                                <p className="text-muted mb-4">{team.description}</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="p-3 bg-surface rounded-lg">
                                    <div className="text-xs text-accent mb-2 font-semibold">📋 Setup</div>
                                    <ul className="space-y-1">
                                      {team.setup.map((s, idx) => (
                                        <li key={idx} className="text-xs text-muted">• {s}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="p-3 bg-surface rounded-lg">
                                    <div className="text-xs text-green-400 mb-2 font-semibold">⚡ Execution</div>
                                    <ul className="space-y-1">
                                      {team.execution.map((e, idx) => (
                                        <li key={idx} className="text-xs text-muted">• {e}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="p-3 bg-surface rounded-lg">
                                    <div className="text-xs text-yellow-400 mb-2 font-semibold">🔄 Fallbacks</div>
                                    <ul className="space-y-1">
                                      {team.fallbacks.map((f, idx) => (
                                        <li key={idx} className="text-xs text-muted">• {f}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
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

                {/* Tactical Map Tab */}
                {activeTab === 'tactical' && (
                  <motion.div
                    key="tactical"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Map Overview */}
                    <div className="glass rounded-2xl p-6">
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-accent" />
                        Tactical Overview - {analysis.recommendedMap}
                      </h3>
                      
                      {/* Map Layout Visualization */}
                      <div className="relative bg-gradient-to-br from-surface-lighter to-surface rounded-2xl p-6 mb-6 overflow-hidden">
                        {/* Grid Background */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute inset-0" style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                          }} />
                        </div>
                        
                        {/* Map Name Watermark */}
                        <div className="absolute top-4 right-4 text-6xl font-black text-white/5 select-none">
                          {analysis.recommendedMap.toUpperCase()}
                        </div>

                        <div className="relative grid grid-cols-3 gap-4">
                          {/* T Side */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center font-bold text-lg shadow-lg shadow-orange-600/20">T</div>
                              <span className="font-semibold">T Side Spawn</span>
                            </div>
                            {mapCallouts[analysis.recommendedMap]?.tSpawn.map((spot, i) => (
                              <div key={i} className="px-3 py-2 rounded-lg bg-orange-950/30 border border-orange-800/30 text-sm">
                                <span className="text-orange-400">{spot}</span>
                              </div>
                            ))}
                          </div>

                          {/* Mid */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-4 justify-center">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center font-bold shadow-lg shadow-green-600/20">
                                <Crosshair className="w-5 h-5" />
                              </div>
                              <span className="font-semibold">Mid Control</span>
                            </div>
                            {mapCallouts[analysis.recommendedMap]?.mid.map((spot, i) => (
                              <div key={i} className="px-3 py-2 rounded-lg bg-green-950/30 border border-green-800/30 text-sm text-center">
                                <span className="text-green-400">{spot}</span>
                              </div>
                            ))}
                          </div>

                          {/* CT Side */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-4 justify-end">
                              <span className="font-semibold">CT Side Spawn</span>
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-600/20">CT</div>
                            </div>
                            {mapCallouts[analysis.recommendedMap]?.ctSpawn.map((spot, i) => (
                              <div key={i} className="px-3 py-2 rounded-lg bg-blue-950/30 border border-blue-800/30 text-sm text-right">
                                <span className="text-blue-400">{spot}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Site Callouts Row */}
                        <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-white/10">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded bg-amber-600 flex items-center justify-center font-bold">A</div>
                              <span className="font-semibold text-amber-400">A Site Callouts</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {mapCallouts[analysis.recommendedMap]?.aSite.map((spot, i) => (
                                <span key={i} className="px-2 py-1 rounded bg-amber-950/40 border border-amber-700/30 text-xs text-amber-300">{spot}</span>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 justify-end">
                              <span className="font-semibold text-blue-400">B Site Callouts</span>
                              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold">B</div>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-end">
                              {mapCallouts[analysis.recommendedMap]?.bSite.map((spot, i) => (
                                <span key={i} className="px-2 py-1 rounded bg-blue-950/40 border border-blue-700/30 text-xs text-blue-300">{spot}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recommended Side Banner */}
                      <div className={`rounded-xl p-4 ${
                        analysis.recommendedSide === 'T' 
                          ? 'bg-gradient-to-r from-orange-950/50 to-orange-900/20 border border-orange-700/30' 
                          : 'bg-gradient-to-r from-blue-950/50 to-blue-900/20 border border-blue-700/30'
                      }`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-2xl ${
                            analysis.recommendedSide === 'T' ? 'bg-orange-600' : 'bg-blue-600'
                          }`}>
                            {analysis.recommendedSide}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">Start {analysis.recommendedSide} Side</span>
                              <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-semibold">RECOMMENDED</span>
                            </div>
                            <p className="text-sm text-muted">{analysis.keyToVictory}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-green-400">{analysis.winProbability}%</div>
                            <div className="text-xs text-muted">Win Probability</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Site-specific strategies */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* A Site Strategy */}
                      <div className="glass rounded-2xl p-6 border-l-4 border-amber-500">
                        <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center font-bold">A</div>
                          A Site Strategy
                        </h4>
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-surface-lighter">
                            <div className="text-sm font-semibold text-amber-400 mb-1">Execute</div>
                            <p className="text-sm text-muted">2 smokes, 1 flash, 1 molly → Fast take with entry fragger first</p>
                          </div>
                          <div className="p-3 rounded-lg bg-surface-lighter">
                            <div className="text-sm font-semibold text-blue-400 mb-1">Hold</div>
                            <p className="text-sm text-muted">AWP on site, 1 player connector, crossfire setup</p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <span className="px-2 py-1 bg-green-900/30 rounded text-xs text-green-400">Strong site for team</span>
                          </div>
                        </div>
                      </div>

                      {/* B Site Strategy */}
                      <div className="glass rounded-2xl p-6 border-l-4 border-blue-500">
                        <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold">B</div>
                          B Site Strategy
                        </h4>
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-surface-lighter">
                            <div className="text-sm font-semibold text-amber-400 mb-1">Execute</div>
                            <p className="text-sm text-muted">3 smokes, 2 flashes → Slow take with lurker late</p>
                          </div>
                          <div className="p-3 rounded-lg bg-surface-lighter">
                            <div className="text-sm font-semibold text-blue-400 mb-1">Hold</div>
                            <p className="text-sm text-muted">2 players on site, aggressive peek on eco rounds</p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <span className="px-2 py-1 bg-yellow-900/30 rounded text-xs text-yellow-400">Enemy weak here</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Player Assignments */}
                    <div className="glass rounded-2xl p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-accent" />
                        Player Role Assignments
                      </h3>
                      <div className="grid gap-3">
                        {analysis.yourTeam.players.map((player, i) => (
                          <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-surface-lighter">
                            <img 
                              src={player.avatar} 
                              alt={player.nickname}
                              className="w-10 h-10 rounded-lg"
                            />
                            <div className="flex-1">
                              <div className="font-semibold flex items-center gap-2">
                                {player.nickname}
                                {player.isCarry && <Star className="w-4 h-4 text-yellow-400" />}
                                {player.voiceActivity === 'talkative' && <Mic className="w-4 h-4 text-green-400" />}
                                {player.voiceActivity === 'silent' && <MicOff className="w-4 h-4 text-red-400" />}
                              </div>
                              <div className="text-sm text-muted">{player.playerType}</div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-semibold ${
                                player.role === 'entry' ? 'text-red-400' :
                                player.role === 'awp' ? 'text-yellow-400' :
                                player.role === 'support' ? 'text-blue-400' :
                                player.role === 'lurk' ? 'text-purple-400' :
                                'text-green-400'
                              }`}>
                                {player.role?.toUpperCase()}
                              </div>
                              <div className="text-xs text-muted">
                                {i === 0 ? 'Site A / Entry' :
                                 i === 1 ? 'Mid Control' :
                                 i === 2 ? 'AWP / Angles' :
                                 i === 3 ? 'Site B' :
                                 'Lurk / Rotator'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Enemy Tendencies */}
                    <div className="glass rounded-2xl p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <AlertOctagon className="w-5 h-5 text-red-400" />
                        Enemy Tendencies to Exploit
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {analysis.enemyTeam.players.filter(p => p.isBottomFrag || (p.toxicityScore && p.toxicityScore > 40)).slice(0, 4).map((player, i) => (
                          <div key={i} className="p-4 rounded-xl bg-red-950/20 border border-red-900/30">
                            <div className="flex items-center gap-3 mb-2">
                              <img src={player.avatar} alt={player.nickname} className="w-8 h-8 rounded-lg" />
                              <span className="font-semibold">{player.nickname}</span>
                              {player.isBottomFrag && <ThumbsDown className="w-4 h-4 text-red-400" />}
                              {player.toxicityScore && player.toxicityScore > 40 && <AlertOctagon className="w-4 h-4 text-orange-400" />}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {player.isBottomFrag && <span className="px-2 py-1 bg-red-900/40 rounded text-xs text-red-300">Usually bottom frag</span>}
                              {player.toxicityScore && player.toxicityScore > 40 && <span className="px-2 py-1 bg-orange-900/40 rounded text-xs text-orange-300">May tilt</span>}
                              {player.voiceActivity === 'silent' && <span className="px-2 py-1 bg-gray-900/40 rounded text-xs text-gray-300">No comms</span>}
                            </div>
                            <p className="text-xs text-muted mt-2">
                              {player.isBottomFrag ? 'Target this player, likely to tilt.' : ''}
                              {player.toxicityScore && player.toxicityScore > 40 ? ' Aggressive plays may tilt them.' : ''}
                            </p>
                          </div>
                        ))}
                        {analysis.enemyTeam.players.filter(p => p.isBottomFrag || (p.toxicityScore && p.toxicityScore > 40)).length === 0 && (
                          <div className="col-span-2 text-center text-muted py-4">
                            No obvious weak points detected in enemy team
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  )
}
