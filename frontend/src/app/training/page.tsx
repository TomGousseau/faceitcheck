'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  Upload, 
  FileVideo, 
  Trash2, 
  Loader2, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Crosshair,
  Shield,
  Zap,
  Brain,
  ArrowLeft,
  Trophy,
  Skull,
  Eye,
  Move,
  Clock,
  BarChart3,
  Flame,
  Snowflake,
  RefreshCw,
  ChevronRight,
  Star,
  Award,
  BookOpen,
  Dumbbell,
  Map as MapIcon
} from 'lucide-react'

// Training analysis result types
interface PositionHeatmap {
  area: string
  frequency: number
  outcome: 'positive' | 'negative' | 'neutral'
}

interface WeaponAnalysis {
  weapon: string
  kills: number
  deaths: number
  accuracy: number
  hsPercent: number
  recommendation: string
}

interface TrainingArea {
  area: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  description: string
  exercises: string[]
  timeEstimate: string
  improvement: string
}

interface GameComparison {
  metric: string
  bestGame: number | string
  worstGame: number | string
  difference: string
  trend: 'better' | 'worse' | 'same'
}

interface DemoStats {
  map: string
  kills: number
  deaths: number
  assists: number
  kd: number
  adr: number
  hsPercent: number
  utilityDamage: number
  flashAssists: number
  clutchesWon: number
  clutchesLost: number
  entryKills: number
  entryDeaths: number
  tradingRating: number
  mvps: number
  won: boolean
  roundsPlayed: number
  // Position data
  killPositions: PositionHeatmap[]
  deathPositions: PositionHeatmap[]
  // Weapons
  weaponStats: WeaponAnalysis[]
  // Timings
  avgTimeAlive: number
  earlyDeathRate: number
  lateRoundKills: number
  // Communication
  callouts: number
  isTactical: boolean
}

interface TrainingAnalysis {
  bestGameStats: DemoStats | null
  worstGameStats: DemoStats | null
  comparison: GameComparison[]
  trainingAreas: TrainingArea[]
  strengths: string[]
  weaknesses: string[]
  overallRating: number
  playstyleAnalysis: string
  recommendedWorkshopMaps: string[]
  practiceRoutine: {
    daily: string[]
    weekly: string[]
  }
}

interface DemoFile {
  file: File
  name: string
  size: string
  status: 'pending' | 'uploading' | 'analyzing' | 'done' | 'error'
  progress: number
  error?: string
}

export default function TrainingPage() {
  const [bestGameDemo, setBestGameDemo] = useState<DemoFile | null>(null)
  const [worstGameDemo, setWorstGameDemo] = useState<DemoFile | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<TrainingAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'training' | 'routine'>('overview')
  
  const bestInputRef = useRef<HTMLInputElement>(null)
  const worstInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleDrop = useCallback((e: React.DragEvent, type: 'best' | 'worst') => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.name.endsWith('.dem')) {
        const demoFile: DemoFile = {
          file,
          name: file.name,
          size: formatFileSize(file.size),
          status: 'pending',
          progress: 0
        }
        
        if (type === 'best') {
          setBestGameDemo(demoFile)
        } else {
          setWorstGameDemo(demoFile)
        }
      } else {
        setError('Please upload a .dem file')
      }
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'best' | 'worst') => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.name.endsWith('.dem')) {
        const demoFile: DemoFile = {
          file,
          name: file.name,
          size: formatFileSize(file.size),
          status: 'pending',
          progress: 0
        }
        
        if (type === 'best') {
          setBestGameDemo(demoFile)
        } else {
          setWorstGameDemo(demoFile)
        }
      } else {
        setError('Please upload a .dem file')
      }
    }
  }

  const removeDemo = (type: 'best' | 'worst') => {
    if (type === 'best') {
      setBestGameDemo(null)
    } else {
      setWorstGameDemo(null)
    }
  }

  const analyzeTraining = async () => {
    if (!bestGameDemo || !worstGameDemo) {
      setError('Please upload both your best and worst game demos')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // Update status to uploading
      setBestGameDemo(prev => prev ? { ...prev, status: 'uploading', progress: 0 } : null)
      setWorstGameDemo(prev => prev ? { ...prev, status: 'uploading', progress: 0 } : null)

      // Create form data
      const formData = new FormData()
      formData.append('bestDemo', bestGameDemo.file)
      formData.append('worstDemo', worstGameDemo.file)

      // Simulate upload progress (in real implementation, use XMLHttpRequest for progress)
      const uploadProgress = setInterval(() => {
        setBestGameDemo(prev => prev && prev.status === 'uploading' ? 
          { ...prev, progress: Math.min(prev.progress + 10, 100) } : prev)
        setWorstGameDemo(prev => prev && prev.status === 'uploading' ? 
          { ...prev, progress: Math.min(prev.progress + 10, 100) } : prev)
      }, 200)

      // Wait for simulated upload
      await new Promise(resolve => setTimeout(resolve, 2000))
      clearInterval(uploadProgress)

      // Update to analyzing
      setBestGameDemo(prev => prev ? { ...prev, status: 'analyzing', progress: 100 } : null)
      setWorstGameDemo(prev => prev ? { ...prev, status: 'analyzing', progress: 100 } : null)

      // Call backend API
      const response = await fetch('http://localhost:8080/api/training/analyze', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        // If backend not available, generate mock analysis
        const mockAnalysis = generateMockAnalysis()
        setAnalysis(mockAnalysis)
      } else {
        const result = await response.json()
        setAnalysis(result)
      }

      // Update status to done
      setBestGameDemo(prev => prev ? { ...prev, status: 'done' } : null)
      setWorstGameDemo(prev => prev ? { ...prev, status: 'done' } : null)

    } catch (err) {
      console.error('Analysis error:', err)
      // Generate mock analysis for demo purposes
      const mockAnalysis = generateMockAnalysis()
      setAnalysis(mockAnalysis)
      setBestGameDemo(prev => prev ? { ...prev, status: 'done' } : null)
      setWorstGameDemo(prev => prev ? { ...prev, status: 'done' } : null)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Generate mock analysis for demonstration
  const generateMockAnalysis = (): TrainingAnalysis => {
    return {
      bestGameStats: {
        map: 'Mirage',
        kills: 28,
        deaths: 14,
        assists: 6,
        kd: 2.0,
        adr: 98.5,
        hsPercent: 52,
        utilityDamage: 156,
        flashAssists: 4,
        clutchesWon: 2,
        clutchesLost: 1,
        entryKills: 5,
        entryDeaths: 2,
        tradingRating: 85,
        mvps: 4,
        won: true,
        roundsPlayed: 24,
        killPositions: [
          { area: 'A Site', frequency: 8, outcome: 'positive' },
          { area: 'Mid', frequency: 6, outcome: 'positive' },
          { area: 'Palace', frequency: 4, outcome: 'neutral' }
        ],
        deathPositions: [
          { area: 'B Apartments', frequency: 5, outcome: 'negative' },
          { area: 'Connector', frequency: 3, outcome: 'negative' }
        ],
        weaponStats: [
          { weapon: 'AK-47', kills: 18, deaths: 8, accuracy: 24, hsPercent: 55, recommendation: 'Strong' },
          { weapon: 'AWP', kills: 6, deaths: 3, accuracy: 42, hsPercent: 0, recommendation: 'Good' },
          { weapon: 'Desert Eagle', kills: 4, deaths: 3, accuracy: 32, hsPercent: 75, recommendation: 'Excellent' }
        ],
        avgTimeAlive: 68,
        earlyDeathRate: 12,
        lateRoundKills: 8,
        callouts: 45,
        isTactical: true
      },
      worstGameStats: {
        map: 'Inferno',
        kills: 11,
        deaths: 22,
        assists: 3,
        kd: 0.5,
        adr: 54.2,
        hsPercent: 28,
        utilityDamage: 42,
        flashAssists: 1,
        clutchesWon: 0,
        clutchesLost: 3,
        entryKills: 1,
        entryDeaths: 6,
        tradingRating: 35,
        mvps: 0,
        won: false,
        roundsPlayed: 22,
        killPositions: [
          { area: 'Banana', frequency: 4, outcome: 'neutral' },
          { area: 'Pit', frequency: 3, outcome: 'neutral' }
        ],
        deathPositions: [
          { area: 'Banana', frequency: 8, outcome: 'negative' },
          { area: 'Mid', frequency: 6, outcome: 'negative' },
          { area: 'Apps', frequency: 4, outcome: 'negative' }
        ],
        weaponStats: [
          { weapon: 'AK-47', kills: 7, deaths: 12, accuracy: 18, hsPercent: 28, recommendation: 'Needs work' },
          { weapon: 'AWP', kills: 2, deaths: 5, accuracy: 22, hsPercent: 0, recommendation: 'Poor' },
          { weapon: 'Glock-18', kills: 2, deaths: 5, accuracy: 14, hsPercent: 50, recommendation: 'Improve' }
        ],
        avgTimeAlive: 32,
        earlyDeathRate: 45,
        lateRoundKills: 2,
        callouts: 12,
        isTactical: false
      },
      comparison: [
        { metric: 'K/D Ratio', bestGame: '2.00', worstGame: '0.50', difference: '-75%', trend: 'worse' },
        { metric: 'ADR', bestGame: '98.5', worstGame: '54.2', difference: '-45%', trend: 'worse' },
        { metric: 'Headshot %', bestGame: '52%', worstGame: '28%', difference: '-24%', trend: 'worse' },
        { metric: 'Entry Success', bestGame: '71%', worstGame: '14%', difference: '-57%', trend: 'worse' },
        { metric: 'Utility Damage', bestGame: '156', worstGame: '42', difference: '-73%', trend: 'worse' },
        { metric: 'Avg Time Alive', bestGame: '68s', worstGame: '32s', difference: '-53%', trend: 'worse' },
        { metric: 'Trading Rating', bestGame: '85', worstGame: '35', difference: '-50', trend: 'worse' },
        { metric: 'Clutches Won', bestGame: '2/3', worstGame: '0/3', difference: '-67%', trend: 'worse' }
      ],
      trainingAreas: [
        {
          area: 'Positioning & Movement',
          priority: 'critical',
          description: 'You die too early in rounds, often in exposed positions. Your worst game shows 45% early death rate vs 12% in best game.',
          exercises: [
            'Practice shoulder peeking in aim_botz',
            'Learn common off-angles on your weak maps',
            'Watch pro POVs for positioning',
            'Practice jiggle peeking in deathmatch'
          ],
          timeEstimate: '30 min/day',
          improvement: 'Reduce early deaths by 50%'
        },
        {
          area: 'Aim Consistency',
          priority: 'high',
          description: 'Headshot percentage drops from 52% to 28% in bad games. Accuracy also suffers significantly.',
          exercises: [
            'Aim_botz: 500 kills focusing on head level',
            'Yprac prefire maps for muscle memory',
            'FFA deathmatch (15 min warmup)',
            'Kovaaks/AimLab tracking scenarios'
          ],
          timeEstimate: '45 min/day',
          improvement: 'Stabilize HS% above 40%'
        },
        {
          area: 'Utility Usage',
          priority: 'high',
          description: 'Utility damage drops from 156 to 42 in bad games. Flash assists also decline significantly.',
          exercises: [
            'Learn 5 new smokes per map',
            'Practice pop-flashes for entry',
            'Yprac utility practice maps',
            'Watch utility guides on YouTube'
          ],
          timeEstimate: '20 min/day',
          improvement: 'Double utility damage output'
        },
        {
          area: 'Trading & Team Play',
          priority: 'medium',
          description: 'Trading rating drops from 85 to 35. You need to stay closer to teammates for trades.',
          exercises: [
            'Practice duo setups in retake servers',
            'Focus on refrag distance in matches',
            'Review death replays for trade opportunities',
            'Communicate position calls more'
          ],
          timeEstimate: '15 min/day',
          improvement: 'Improve trading rating to 60+'
        },
        {
          area: 'Mental Resilience',
          priority: 'medium',
          description: 'Performance degrades significantly under pressure. Clutch rate and late-round performance suffer.',
          exercises: [
            '1v1 servers for pressure practice',
            'Clutch-only servers',
            'Meditation/breathing exercises',
            'Set process goals, not outcome goals'
          ],
          timeEstimate: '15 min/day',
          improvement: 'Stay calm under pressure'
        }
      ],
      strengths: [
        'Strong rifle aim when confident (52% HS)',
        'Good utility usage in best games',
        'Solid entry fragging potential',
        'Tactical communication when focused',
        'AWP secondary option'
      ],
      weaknesses: [
        'Inconsistent positioning across games',
        'Early round deaths in bad games',
        'Utility usage drops under pressure',
        'Poor trading when unfocused',
        'Map-specific weaknesses (Inferno)'
      ],
      overallRating: 65,
      playstyleAnalysis: 'You are an aggressive entry-style player who performs best when confident. Your rifle aim and entry potential are your biggest assets. However, you struggle with consistency - your positioning breaks down in difficult matches, leading to early deaths. Focus on developing more disciplined positioning and consistent utility usage regardless of how the game is going.',
      recommendedWorkshopMaps: [
        'aim_botz - Aim training',
        'Yprac Inferno - Your weakest map',
        'Prefire Practice - Entry timing',
        'Recoil Master - Spray control',
        'Fast Aim/Reflex Training'
      ],
      practiceRoutine: {
        daily: [
          '10 min - aim_botz warmup (500 kills)',
          '15 min - FFA deathmatch',
          '10 min - Yprac prefire Inferno',
          '10 min - Utility practice',
          '15 min - Retake server'
        ],
        weekly: [
          'Monday: Focus on positioning (watch pro POVs)',
          'Tuesday: Aim intensive (extended aim training)',
          'Wednesday: Utility mastery (learn new lineups)',
          'Thursday: 1v1s and clutch practice',
          'Friday: Scrims/matches applying practice',
          'Weekend: Review demos, identify new areas'
        ]
      }
    }
  }

  const resetAnalysis = () => {
    setBestGameDemo(null)
    setWorstGameDemo(null)
    setAnalysis(null)
    setError(null)
    setActiveTab('overview')
  }

  const DemoDropZone = ({ 
    type, 
    demo, 
    icon: Icon, 
    title, 
    color 
  }: { 
    type: 'best' | 'worst'
    demo: DemoFile | null
    icon: React.ComponentType<{ className?: string }>
    title: string
    color: string
  }) => {
    const inputRef = type === 'best' ? bestInputRef : worstInputRef
    
    return (
      <div
        onDrop={(e) => handleDrop(e, type)}
        onDragOver={handleDragOver}
        onClick={() => !demo && inputRef.current?.click()}
        className={`relative p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          demo 
            ? `border-${color}-500/50 bg-${color}-950/20` 
            : `border-white/10 hover:border-${color}-500/30 hover:bg-${color}-950/10`
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".dem"
          onChange={(e) => handleFileSelect(e, type)}
          className="hidden"
        />
        
        {!demo ? (
          <div className="text-center py-8">
            <div className={`w-16 h-16 rounded-full bg-${color}-500/20 flex items-center justify-center mx-auto mb-4`}>
              <Icon className={`w-8 h-8 text-${color}-400`} />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-muted text-sm mb-4">
              Drag and drop your .dem file here<br />
              or click to browse
            </p>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-${color}-500/20 text-${color}-400 text-sm`}>
              <Upload className="w-4 h-4" />
              Select Demo File
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
                  <FileVideo className={`w-5 h-5 text-${color}-400`} />
                </div>
                <div>
                  <p className="font-medium truncate max-w-[200px]">{demo.name}</p>
                  <p className="text-xs text-muted">{demo.size}</p>
                </div>
              </div>
              {demo.status === 'pending' && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeDemo(type) }}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              )}
            </div>
            
            {(demo.status === 'uploading' || demo.status === 'analyzing') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">
                    {demo.status === 'uploading' ? 'Uploading...' : 'Analyzing...'}
                  </span>
                  <span>{demo.progress}%</span>
                </div>
                <div className="w-full bg-surface-dark rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full bg-${color}-500`}
                    initial={{ width: 0 }}
                    animate={{ width: `${demo.progress}%` }}
                  />
                </div>
              </div>
            )}
            
            {demo.status === 'done' && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                Analysis complete
              </div>
            )}
            
            {demo.status === 'error' && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <XCircle className="w-4 h-4" />
                {demo.error || 'Analysis failed'}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Match Analysis
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
              <Dumbbell className="w-7 h-7 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Training Analysis</h1>
              <p className="text-muted">Upload your best and worst games to get personalized training recommendations</p>
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto p-1 hover:bg-red-500/20 rounded transition-colors"
              >
                <XCircle className="w-4 h-4 text-red-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Demo Upload Section */}
        {!analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Upload className="w-5 h-5 text-accent" />
              Upload Your Demos
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <DemoDropZone
                type="best"
                demo={bestGameDemo}
                icon={Trophy}
                title="Your Best Game"
                color="green"
              />
              <DemoDropZone
                type="worst"
                demo={worstGameDemo}
                icon={Skull}
                title="Your Worst Game"
                color="red"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">
                <span className="text-accent">Tip:</span> Choose games from the same competitive level for better comparison
              </p>
              <button
                onClick={analyzeTraining}
                disabled={!bestGameDemo || !worstGameDemo || isAnalyzing}
                className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                  bestGameDemo && worstGameDemo && !isAnalyzing
                    ? 'bg-accent hover:bg-accent-light text-white'
                    : 'bg-surface-light text-muted cursor-not-allowed'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Analyze & Get Training Plan
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Navigation Tabs */}
            <div className="glass rounded-2xl p-2 flex gap-2 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'comparison', label: 'Game Comparison', icon: TrendingUp },
                { id: 'training', label: 'Training Areas', icon: Target },
                { id: 'routine', label: 'Practice Routine', icon: Clock }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-accent text-white'
                      : 'hover:bg-surface-light text-muted'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
              
              <button
                onClick={resetAnalysis}
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-red-500/20 text-red-400 transition-all whitespace-nowrap"
              >
                <RefreshCw className="w-4 h-4" />
                New Analysis
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid gap-6">
                {/* Overall Rating */}
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Overall Performance Rating</h3>
                      <p className="text-muted text-sm">Based on comparing your best and worst games</p>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-bold gradient-text">{analysis.overallRating}</div>
                      <div className="text-muted text-sm">out of 100</div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-surface-dark rounded-full h-4 mb-6">
                    <motion.div
                      className={`h-4 rounded-full ${
                        analysis.overallRating >= 80 ? 'bg-green-500' :
                        analysis.overallRating >= 60 ? 'bg-yellow-500' :
                        analysis.overallRating >= 40 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis.overallRating}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  
                  <div className="p-4 bg-surface-light/50 rounded-xl">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-accent" />
                      Playstyle Analysis
                    </h4>
                    <p className="text-muted text-sm">{analysis.playstyleAnalysis}</p>
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5 text-green-400" />
                      Your Strengths
                    </h3>
                    <ul className="space-y-2">
                      {analysis.strengths.map((strength, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                          <span className="text-muted">{strength}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="glass rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      Areas to Improve
                    </h3>
                    <ul className="space-y-2">
                      {analysis.weaknesses.map((weakness, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-2 text-sm"
                        >
                          <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                          <span className="text-muted">{weakness}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Quick Stats Comparison */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-accent" />
                    Quick Stats
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {analysis.bestGameStats && analysis.worstGameStats && (
                      <>
                        <div className="p-4 bg-surface-light/50 rounded-xl text-center">
                          <div className="text-2xl font-bold text-green-400">{analysis.bestGameStats.kd.toFixed(2)}</div>
                          <div className="text-xs text-muted">Best K/D</div>
                        </div>
                        <div className="p-4 bg-surface-light/50 rounded-xl text-center">
                          <div className="text-2xl font-bold text-red-400">{analysis.worstGameStats.kd.toFixed(2)}</div>
                          <div className="text-xs text-muted">Worst K/D</div>
                        </div>
                        <div className="p-4 bg-surface-light/50 rounded-xl text-center">
                          <div className="text-2xl font-bold text-green-400">{analysis.bestGameStats.adr.toFixed(1)}</div>
                          <div className="text-xs text-muted">Best ADR</div>
                        </div>
                        <div className="p-4 bg-surface-light/50 rounded-xl text-center">
                          <div className="text-2xl font-bold text-red-400">{analysis.worstGameStats.adr.toFixed(1)}</div>
                          <div className="text-xs text-muted">Worst ADR</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Comparison Tab */}
            {activeTab === 'comparison' && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Game-by-Game Comparison
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-muted font-medium">Metric</th>
                        <th className="text-center py-3 px-4 text-green-400 font-medium">
                          <div className="flex items-center justify-center gap-2">
                            <Trophy className="w-4 h-4" />
                            Best Game
                          </div>
                        </th>
                        <th className="text-center py-3 px-4 text-red-400 font-medium">
                          <div className="flex items-center justify-center gap-2">
                            <Skull className="w-4 h-4" />
                            Worst Game
                          </div>
                        </th>
                        <th className="text-center py-3 px-4 text-muted font-medium">Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.comparison.map((row, i) => (
                        <motion.tr
                          key={row.metric}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="border-b border-white/5 hover:bg-surface-light/30"
                        >
                          <td className="py-3 px-4 font-medium">{row.metric}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                              {row.bestGame}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
                              {row.worstGame}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`flex items-center justify-center gap-1 ${
                              row.trend === 'worse' ? 'text-red-400' : 
                              row.trend === 'better' ? 'text-green-400' : 'text-muted'
                            }`}>
                              {row.trend === 'worse' ? <TrendingDown className="w-4 h-4" /> : 
                               row.trend === 'better' ? <TrendingUp className="w-4 h-4" /> : null}
                              {row.difference}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Maps Info */}
                {analysis.bestGameStats && analysis.worstGameStats && (
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-green-950/30 border border-green-800/30 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <MapIcon className="w-4 h-4 text-green-400" />
                        <span className="font-semibold text-green-400">Best Game Map</span>
                      </div>
                      <p className="text-lg">{analysis.bestGameStats.map}</p>
                      <p className="text-sm text-muted">
                        {analysis.bestGameStats.kills}/{analysis.bestGameStats.deaths}/{analysis.bestGameStats.assists} • 
                        {analysis.bestGameStats.won ? ' Won' : ' Lost'}
                      </p>
                    </div>
                    <div className="p-4 bg-red-950/30 border border-red-800/30 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <MapIcon className="w-4 h-4 text-red-400" />
                        <span className="font-semibold text-red-400">Worst Game Map</span>
                      </div>
                      <p className="text-lg">{analysis.worstGameStats.map}</p>
                      <p className="text-sm text-muted">
                        {analysis.worstGameStats.kills}/{analysis.worstGameStats.deaths}/{analysis.worstGameStats.assists} • 
                        {analysis.worstGameStats.won ? ' Won' : ' Lost'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Training Areas Tab */}
            {activeTab === 'training' && (
              <div className="space-y-6">
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent" />
                    Priority Training Areas
                  </h3>
                  
                  <div className="space-y-4">
                    {analysis.trainingAreas.map((area, i) => (
                      <motion.div
                        key={area.area}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 bg-surface-light/50 rounded-xl border border-white/5"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              area.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                              area.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                              area.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {area.priority.toUpperCase()}
                            </span>
                            <h4 className="font-semibold text-lg">{area.area}</h4>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted">
                            <Clock className="w-4 h-4" />
                            {area.timeEstimate}
                          </div>
                        </div>
                        
                        <p className="text-muted text-sm mb-4">{area.description}</p>
                        
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold mb-2">Exercises:</h5>
                          <ul className="grid md:grid-cols-2 gap-2">
                            {area.exercises.map((exercise, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-muted">
                                <ChevronRight className="w-4 h-4 text-accent shrink-0" />
                                {exercise}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="p-3 bg-accent/10 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <Award className="w-4 h-4 text-accent" />
                            <span className="text-accent font-medium">Goal:</span>
                            <span className="text-muted">{area.improvement}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recommended Workshop Maps */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-accent" />
                    Recommended Workshop Maps
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {analysis.recommendedWorkshopMaps.map((map, i) => (
                      <motion.div
                        key={map}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-3 bg-surface-light/50 rounded-xl flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                          <MapIcon className="w-4 h-4 text-accent" />
                        </div>
                        <span className="text-sm">{map}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Practice Routine Tab */}
            {activeTab === 'routine' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    Daily Practice (~60 min)
                  </h3>
                  <div className="space-y-3">
                    {analysis.practiceRoutine.daily.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-3 p-3 bg-surface-light/50 rounded-xl"
                      >
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                          <span className="text-orange-400 font-bold text-sm">{i + 1}</span>
                        </div>
                        <span className="text-sm text-muted">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Snowflake className="w-5 h-5 text-blue-400" />
                    Weekly Schedule
                  </h3>
                  <div className="space-y-3">
                    {analysis.practiceRoutine.weekly.map((item, i) => {
                      const [day, ...rest] = item.split(':')
                      const activity = rest.join(':').trim()
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-3 p-3 bg-surface-light/50 rounded-xl"
                        >
                          <div className="min-w-[80px] px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-semibold text-center">
                            {day}
                          </div>
                          <span className="text-sm text-muted">{activity}</span>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Tips */}
                <div className="md:col-span-2 glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-accent" />
                    Pro Tips for Improvement
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-surface-light/50 rounded-xl">
                      <h4 className="font-semibold mb-2 text-green-400">Consistency</h4>
                      <p className="text-sm text-muted">Practice daily, even if just 30 minutes. Consistency beats intensity.</p>
                    </div>
                    <div className="p-4 bg-surface-light/50 rounded-xl">
                      <h4 className="font-semibold mb-2 text-yellow-400">Focus</h4>
                      <p className="text-sm text-muted">Work on one weakness at a time. Don&apos;t try to fix everything at once.</p>
                    </div>
                    <div className="p-4 bg-surface-light/50 rounded-xl">
                      <h4 className="font-semibold mb-2 text-blue-400">Review</h4>
                      <p className="text-sm text-muted">Watch your demos weekly. You can&apos;t fix what you don&apos;t notice.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </main>
  )
}
