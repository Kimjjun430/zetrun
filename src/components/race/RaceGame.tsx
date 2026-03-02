import type { CSSProperties, RefObject } from 'react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

const MIN_PLANES = 2
const MAX_PLANES = 120
const DEFAULT_PLANES = 6
const STORAGE_KEY = 'air-race-settings-v2'
const PAGE_SIZE = 10
const BOARD_UPDATE_MS = 120
const SCROLL_BOARD_UPDATE_MS = 320
const SCROLL_IDLE_MS = 160
const MIN_OBSTACLES = 4
const MAX_OBSTACLES = 9

const PLANE_COLORS = [
  '#38bdf8',
  '#f97316',
  '#10b981',
  '#f43f5e',
  '#eab308',
  '#a78bfa',
  '#22d3ee',
  '#84cc16',
  '#fb7185',
  '#60a5fa',
  '#f59e0b',
  '#4ade80',
]

const CONFETTI_COLORS = ['#f97316', '#38bdf8', '#eab308', '#22c55e', '#f43f5e', '#a78bfa']

type RacePhase = 'idle' | 'running' | 'finished'

type StoredSettings = {
  names: string[]
}

type RacePhysics = {
  baseSpeeds: number[]
  cameraKick: number
  crashDrops: number[]
  crashOrder: number[]
  crashed: boolean[]
  finishOrder: number[]
  finishRanks: number[]
  lastBoardUpdate: number
  lastFrame: number
  lastRenderAt: number
  laneXs: number[]
  obstacles: ObstacleField[]
  positions: number[]
  renderSways: number[]
  swayOffsets: number[]
  swayPhases: number[]
  speeds: number[]
  tiltAngles: number[]
  winner: number | null
}

type RankingItem = {
  finishRank: number | null
  index: number
  name: string
  progress: number
}

type BoardSnapshot = {
  crashOrder: number[]
  crashed: number[]
  finishOrder: number[]
  positions: number[]
}

type ConfettiPiece = {
  color: string
  delay: string
  drift: string
  duration: string
  left: string
  rotate: string
}

type SpriteVariant = 'full' | 'compact' | 'dot'
type ObstacleKind = 'storm' | 'tailwind' | 'updraft'

type ObstacleField = {
  drift: number
  id: string
  kind: ObstacleKind
  power: number
  radius: number
  width: number
  x: number
  y: number
}

type CameraFocus = {
  leaderLaneX: number
  leaderProgress: number
  laneMax: number
  laneMin: number
  packCenterLaneX: number
  packCenterProgress: number
  packSpread: number
  progressMax: number
  progressMin: number
}

type CameraFrameInput = CameraFocus & {
  averageProgress: number
  averageSpeed: number
  kick: number
}

type CameraPose = {
  originX: number
  originY: number
  panX: number
  panY: number
  shakeX: number
  shakeY: number
  zoom: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min

const defaultPlaneName = (index: number) => `비행기 ${index + 1}`

const fillDefaultNames = (count: number) =>
  Array.from({ length: count }, (_, index) => defaultPlaneName(index))

const normalizeNames = (names: string[]) =>
  names.map((name, index) => {
    const trimmed = name.trim()
    return trimmed.length > 0 ? trimmed : defaultPlaneName(index)
  })

const compactLabel = (name: string, maxLength: number) => {
  const condensed = name.replace(/\s+/g, '')
  if (!condensed) return 'AIR'
  return condensed.slice(0, maxLength)
}

const splitFormulaTokens = (input: string) =>
  input
    .split(/[\n,]+/)
    .map((token) => token.trim())
    .filter(Boolean)

const expandToken = (token: string, maxExpand: number): string[] => {
  if (/[*xX]\s*$/.test(token)) {
    return []
  }

  const multiplierMatch = token.match(/^(.*?)(?:\s*[*xX]\s*(\d+))$/)
  if (/[*xX]/.test(token) && !multiplierMatch) {
    return []
  }

  let base = token
  let count = 1

  if (multiplierMatch) {
    base = multiplierMatch[1].trim()
    count = clamp(Number(multiplierMatch[2]), 1, maxExpand)
  }

  if (!base) {
    base = '비행기'
  }

  if (count === 1) {
    return [base]
  }

  const sequenceMatch = base.match(/^(.*?)(\d+)$/)
  if (sequenceMatch) {
    const prefix = sequenceMatch[1]
    const startNumber = Number(sequenceMatch[2])
    return Array.from({ length: count }, (_, index) => `${prefix}${startNumber + index}`)
  }

  return Array.from({ length: count }, (_, index) => `${base} ${index + 1}`)
}

const parseBatchInput = (input: string, maxTotal: number): string[] => {
  const tokens = splitFormulaTokens(input)
  if (tokens.length === 0) {
    return []
  }

  const output: string[] = []

  for (const token of tokens) {
    if (output.length >= maxTotal) break
    const remain = maxTotal - output.length
    output.push(...expandToken(token, remain))
  }

  return output
}

const buildRanking = (names: string[], positions: number[], finishOrder: number[]): RankingItem[] => {
  const finishRankMap = new Map<number, number>()
  finishOrder.forEach((planeIndex, index) => {
    finishRankMap.set(planeIndex, index + 1)
  })

  return names
    .map((name, index) => ({
      finishRank: finishRankMap.get(index) ?? null,
      index,
      name,
      progress: positions[index] ?? 0,
    }))
    .sort((a, b) => {
      if (a.finishRank !== null && b.finishRank !== null) return a.finishRank - b.finishRank
      if (a.finishRank !== null) return -1
      if (b.finishRank !== null) return 1
      if (b.progress !== a.progress) return b.progress - a.progress
      return a.index - b.index
    })
}

const loadSettings = (): StoredSettings => {
  if (typeof window === 'undefined') {
    return { names: fillDefaultNames(DEFAULT_PLANES) }
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return { names: fillDefaultNames(DEFAULT_PLANES) }
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSettings> & { count?: number }
    const namesFromStorage = Array.isArray(parsed.names)
      ? parsed.names.map((name) => String(name))
      : []

    if (namesFromStorage.length > 0) {
      return { names: namesFromStorage.slice(0, MAX_PLANES) }
    }

    if (typeof parsed.count === 'number') {
      const legacyCount = clamp(Math.round(parsed.count), MIN_PLANES, MAX_PLANES)
      return { names: fillDefaultNames(legacyCount) }
    }

    return { names: fillDefaultNames(DEFAULT_PLANES) }
  } catch {
    return { names: fillDefaultNames(DEFAULT_PLANES) }
  }
}

const createConfetti = (pieces = 40): ConfettiPiece[] =>
  Array.from({ length: pieces }, (_, index) => ({
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    delay: `${randomBetween(0, 0.9).toFixed(2)}s`,
    drift: `${randomBetween(-14, 14).toFixed(2)}vw`,
    duration: `${randomBetween(2.2, 3.4).toFixed(2)}s`,
    left: `${randomBetween(0, 100).toFixed(2)}%`,
    rotate: `${randomBetween(-25, 25).toFixed(1)}deg`,
  }))

const createObstacleSet = (planeCount: number): ObstacleField[] => {
  const count = clamp(Math.round(4 + planeCount / 20), MIN_OBSTACLES, MAX_OBSTACLES)

  return Array.from({ length: count }, (_, index) => {
    const rand = Math.random()
    const kind: ObstacleKind = rand < 0.5 ? 'storm' : rand < 0.8 ? 'tailwind' : 'updraft'
    const yLine = 0.16 + ((index + 1) / (count + 1)) * 0.7 + randomBetween(-0.04, 0.04)

    return {
      drift: kind === 'storm' ? randomBetween(-1.4, 1.4) : kind === 'tailwind' ? randomBetween(-0.45, 0.45) : randomBetween(-0.9, 0.9),
      id: `${kind}-${index}-${Math.round(Math.random() * 1_000_000)}`,
      kind,
      power: kind === 'storm' ? randomBetween(0.16, 0.27) : kind === 'tailwind' ? randomBetween(0.09, 0.18) : randomBetween(0.06, 0.14),
      radius: randomBetween(0.045, 0.085),
      width: randomBetween(0.08, 0.2),
      x: randomBetween(0.08, 0.92),
      y: clamp(yLine, 0.13, 0.9),
    }
  })
}

const spriteVariantFromCount = (count: number): SpriteVariant => {
  if (count > 70) return 'dot'
  if (count > 24) return 'compact'
  return 'full'
}

const laneLayoutForCount = (count: number) => {
  const sidePadding = count > 70 ? 1.5 : count > 30 ? 2.2 : 3.2
  const span = 100 - sidePadding * 2
  return { sidePadding, span }
}

const runnerHeightFromCount = (count: number) => {
  const variant = spriteVariantFromCount(count)
  if (variant === 'full') return 48
  if (variant === 'compact') return 32
  return 20
}

const getCameraFocus = (positions: number[], laneXs: number[], crashed: boolean[]): CameraFocus => {
  if (positions.length === 0) {
    return {
      leaderLaneX: 0.5,
      leaderProgress: 0,
      laneMax: 0.55,
      laneMin: 0.45,
      packCenterLaneX: 0.5,
      packCenterProgress: 0,
      packSpread: 0,
      progressMax: 0,
      progressMin: 0,
    }
  }

  let leaderIndex = -1
  let leaderProgress = -1
  let laneMin = 1
  let laneMax = 0
  let progressMin = 1
  let progressMax = 0
  let sampleCount = 0

  positions.forEach((progress, index) => {
    if (crashed[index]) return
    const safeProgress = clamp(progress, 0, 1)
    const lane = clamp(laneXs[index] ?? 0.5, 0.05, 0.95)
    laneMin = Math.min(laneMin, lane)
    laneMax = Math.max(laneMax, lane)
    progressMin = Math.min(progressMin, safeProgress)
    progressMax = Math.max(progressMax, safeProgress)
    sampleCount += 1

    if (safeProgress > leaderProgress) {
      leaderProgress = safeProgress
      leaderIndex = index
    }
  })

  if (sampleCount === 0 || leaderIndex === -1) {
    laneMin = 1
    laneMax = 0
    progressMin = 1
    progressMax = 0
    sampleCount = 0
    positions.forEach((progress, index) => {
      const safeProgress = clamp(progress, 0, 1)
      const lane = clamp(laneXs[index] ?? 0.5, 0.05, 0.95)
      laneMin = Math.min(laneMin, lane)
      laneMax = Math.max(laneMax, lane)
      progressMin = Math.min(progressMin, safeProgress)
      progressMax = Math.max(progressMax, safeProgress)
      sampleCount += 1

      if (safeProgress > leaderProgress) {
        leaderProgress = safeProgress
        leaderIndex = index
      }
    })
  }

  if (sampleCount === 0) {
    laneMin = 0.45
    laneMax = 0.55
    progressMin = 0
    progressMax = 0
  }

  const safeLeaderIndex = leaderIndex >= 0 ? leaderIndex : 0
  const safeLeaderProgress = leaderProgress >= 0 ? leaderProgress : 0
  const leaderLaneX = clamp(laneXs[safeLeaderIndex] ?? 0.5, 0.05, 0.95)
  const safeLaneMin = clamp(laneMin, 0.05, 0.95)
  const safeLaneMax = clamp(Math.max(laneMax, safeLaneMin), 0.05, 0.95)
  const safeProgressMin = clamp(progressMin, 0, 1)
  const safeProgressMax = clamp(Math.max(progressMax, safeProgressMin), 0, 1)

  return {
    leaderLaneX,
    leaderProgress: clamp(safeLeaderProgress, 0, 1),
    laneMax: safeLaneMax,
    laneMin: safeLaneMin,
    packCenterLaneX: (safeLaneMin + safeLaneMax) * 0.5,
    packCenterProgress: (safeProgressMin + safeProgressMax) * 0.5,
    packSpread: clamp(safeProgressMax - safeProgressMin, 0, 1),
    progressMax: safeProgressMax,
    progressMin: safeProgressMin,
  }
}

function PlaneSprite({
  color,
  name,
  running,
  variant,
}: {
  color: string
  name: string
  running: boolean
  variant: SpriteVariant
}) {
  const sizeClass = variant === 'full' ? 'h-12 w-12' : variant === 'compact' ? 'h-8 w-8' : 'h-5 w-5'
  const label = variant === 'full' ? compactLabel(name, 4) : compactLabel(name, 2)

  return (
    <div className={`relative ${sizeClass} ${running ? 'plane-active' : ''}`}>
      {running && <span className={`plane-thrust ${variant === 'dot' ? 'plane-thrust-dot' : ''}`} />}
      <svg className="h-full w-full" viewBox="0 0 44 56" aria-hidden="true">
        <polygon points="22,2 34,23 28,22 28,51 16,51 16,22 10,23" fill={color} />
        <polygon points="22,8 28,20 16,20" fill="rgba(248,250,252,0.45)" />
        <polygon points="13,33 31,33 36,43 8,43" fill="rgba(2,6,23,0.45)" />
        <circle cx="22" cy="26" r="3.3" fill="rgba(248,250,252,0.85)" />
      </svg>
      {variant !== 'dot' && (
        <span className="pointer-events-none absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 rounded bg-slate-950/65 px-1 text-[8px] font-black tracking-[0.08em] text-cyan-100">
          {label}
        </span>
      )}
    </div>
  )
}

type SkyTrackProps = {
  cameraLayerRef: RefObject<HTMLDivElement | null>
  focusLeaderName: string | null
  isScrolling: boolean
  names: string[]
  obstacles: ObstacleField[]
  racePhase: RacePhase
  registerRunner: (index: number, node: HTMLDivElement | null) => void
  running: boolean
  stageRef: RefObject<HTMLDivElement | null>
  trackCoreRef: RefObject<HTMLDivElement | null>
}

const SkyTrack = memo(function SkyTrack({
  cameraLayerRef,
  focusLeaderName,
  isScrolling,
  names,
  obstacles,
  racePhase,
  registerRunner,
  running,
  stageRef,
  trackCoreRef,
}: SkyTrackProps) {
  const variant = spriteVariantFromCount(names.length)
  const { sidePadding, span } = laneLayoutForCount(names.length)

  return (
    <div
      ref={stageRef}
      className="sky-track relative h-[1100px] min-h-[900px] overflow-visible rounded-2xl border border-cyan-300/20 md:h-[1280px]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-75" />

      <div className="finish-band absolute inset-x-2 top-2 z-30 rounded-md px-3 py-1 text-center">
        <span className="title-font text-xs font-black tracking-[0.28em] text-slate-950">FINISH LINE</span>
      </div>

      <div className="start-band absolute inset-x-2 bottom-2 z-30 rounded-md px-3 py-1 text-center">
        <span className="title-font text-xs font-black tracking-[0.24em] text-slate-950">START ZONE</span>
      </div>

      <div className="absolute inset-x-3 bottom-12 top-11 rounded-xl border border-cyan-200/10" />

      <div ref={trackCoreRef} className="race-core absolute inset-x-3 bottom-12 top-11 overflow-visible rounded-xl">
        <div ref={cameraLayerRef} className="camera-layer absolute inset-0">
          {running && !isScrolling && (
            <div className="speed-lines absolute inset-0 opacity-100">
              {Array.from({ length: 16 }, (_, index) => {
                const delay = (index % 6) * 0.17
                const duration = 0.95 + (index % 5) * 0.18
                const left = ((index + 1) / 17) * 100

                return (
                  <span
                    key={`speed-line-${index}`}
                    className="speed-line"
                    style={{
                      animationDelay: `${delay.toFixed(2)}s`,
                      animationDuration: `${duration.toFixed(2)}s`,
                      left: `${left.toFixed(2)}%`,
                    }}
                  />
                )
              })}
            </div>
          )}

          {obstacles.map((obstacle) => {
            const obstacleHeight = Math.round(20 + obstacle.radius * 280)
            const obstacleWidth = (obstacle.width * 215).toFixed(2)

            return (
              <div
                key={obstacle.id}
                className={`obstacle-field obstacle-${obstacle.kind} ${
                  running && !isScrolling ? 'obstacle-active' : 'obstacle-idle'
                }`}
                style={{
                  bottom: `${(obstacle.y * 100).toFixed(2)}%`,
                  height: `${obstacleHeight}px`,
                  left: `${(obstacle.x * 100).toFixed(2)}%`,
                  width: `${obstacleWidth}%`,
                }}
              >
                <span className="obstacle-core" />
              </div>
            )
          })}

          {names.map((name, index) => {
            const left = sidePadding + ((index + 0.5) / names.length) * span

            return (
              <div
                key={`runner-${index}`}
                className="pointer-events-none absolute bottom-0 z-40"
                style={{ left: `${left.toFixed(3)}%` }}
                title={name}
              >
                <div ref={(node) => registerRunner(index, node)} className="runner-node will-change-transform">
                  <PlaneSprite
                    color={PLANE_COLORS[index % PLANE_COLORS.length]}
                    name={name}
                    running={running && !isScrolling}
                    variant={variant}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute right-3 top-12 z-30 rounded bg-slate-900/55 px-2 py-1 text-[10px] font-semibold text-cyan-100">
        <p>{racePhase === 'running' ? 'CAMERA: LEADER FOCUS' : racePhase === 'finished' ? 'CAMERA: LOCKED' : 'CAMERA: READY'}</p>
        {focusLeaderName && <p className="max-w-[140px] truncate text-[9px] text-cyan-200/90">FOCUS: {focusLeaderName}</p>}
      </div>
    </div>
  )
})

function RaceGame() {
  const initialSettings = useMemo(loadSettings, [])

  const [planeNames, setPlaneNames] = useState<string[]>(initialSettings.names)
  const [batchInput, setBatchInput] = useState('비행기1 * 10')
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [racePhase, setRacePhase] = useState<RacePhase>('idle')
  const [isScrolling, setIsScrolling] = useState(false)
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null)
  const [confettiBurst, setConfettiBurst] = useState(0)
  const [obstacles, setObstacles] = useState<ObstacleField[]>([])
  const [boardSnapshot, setBoardSnapshot] = useState<BoardSnapshot>({
    crashOrder: [],
    crashed: [],
    finishOrder: [],
    positions: Array(initialSettings.names.length).fill(0),
  })

  const raceRef = useRef<RacePhysics | null>(null)
  const rafRef = useRef<number | null>(null)
  const runnerRefs = useRef<Array<HTMLDivElement | null>>([])
  const lastTransformsRef = useRef<string[]>([])
  const lastOpacitiesRef = useRef<string[]>([])
  const progressFillRef = useRef<HTMLDivElement | null>(null)
  const cameraLayerRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const trackCoreRef = useRef<HTMLDivElement | null>(null)
  const travelPxRef = useRef(320)
  const boardPositionsRef = useRef<number[]>(Array(initialSettings.names.length).fill(0))
  const boardCrashedRef = useRef<number[]>([])
  const isUserScrollingRef = useRef(false)
  const lastScrollAtRef = useRef(0)
  const scrollWatchRafRef = useRef<number | null>(null)
  const cameraPoseRef = useRef<CameraPose>({
    originX: 50,
    originY: 84,
    panX: 0,
    panY: 0,
    shakeX: 0,
    shakeY: 0,
    zoom: 1,
  })

  const planeCount = planeNames.length
  const namesForRace = useMemo(() => normalizeNames(planeNames), [planeNames])

  const ranking = useMemo(
    () => buildRanking(namesForRace, boardSnapshot.positions, boardSnapshot.finishOrder),
    [boardSnapshot, namesForRace],
  )

  const winnerName = winnerIndex !== null ? namesForRace[winnerIndex] : null
  const focusLeaderName = ranking[0]?.name ?? null
  const totalPages = Math.max(1, Math.ceil(planeCount / PAGE_SIZE))
  const pageStart = page * PAGE_SIZE
  const pageRows = planeNames.slice(pageStart, pageStart + PAGE_SIZE)
  const canRace = planeCount >= MIN_PLANES

  const previewCount = useMemo(() => parseBatchInput(batchInput, MAX_PLANES).length, [batchInput])
  const confettiPieces = useMemo(() => createConfetti(), [confettiBurst])
  const crashedSet = useMemo(() => new Set(boardSnapshot.crashed), [boardSnapshot.crashed])
  const raceStatusText =
    racePhase === 'running'
      ? '비행기들이 장애물을 돌파하며 결승선을 향해 상승 중입니다. 충돌하면 추락합니다.'
      : racePhase === 'finished'
        ? '레이스 종료. 아래 결과 패널에서 1~3등을 바로 확인하세요.'
        : '모든 비행기가 하단에서 출발해 상단 결승선으로 돌진합니다.'
  const podium = useMemo(() => {
    const finished = boardSnapshot.finishOrder.map((index) => ({ index, state: 'finish' as const }))
    const crashedOnly = boardSnapshot.crashOrder
      .filter((index) => !boardSnapshot.finishOrder.includes(index))
      .map((index) => ({ index, state: 'crash' as const }))
    const merged = [...finished, ...crashedOnly].slice(0, 3)

    return merged.map((item, orderIndex) => ({
      medal: orderIndex === 0 ? '🥇' : orderIndex === 1 ? '🥈' : '🥉',
      name: namesForRace[item.index] ?? defaultPlaneName(item.index),
      rank: orderIndex + 1,
      state: item.state,
    }))
  }, [boardSnapshot.crashOrder, boardSnapshot.finishOrder, namesForRace])

  const confettiStyle = (piece: ConfettiPiece): CSSProperties & Record<'--drift', string> => ({
    animationDelay: piece.delay,
    animationDuration: piece.duration,
    backgroundColor: piece.color,
    left: piece.left,
    rotate: piece.rotate,
    '--drift': piece.drift,
  })

  const measureTravelDistance = useCallback(() => {
    const core = trackCoreRef.current
    if (!core) return

    const runnerSample = runnerRefs.current.find((node) => node !== null)
    const runnerHeight = runnerSample?.offsetHeight ?? runnerHeightFromCount(planeCount)
    const finishPadding = 10
    travelPxRef.current = Math.max(180, core.clientHeight - runnerHeight - finishPadding)
  }, [planeCount])

  const paintRunners = useCallback(
    (positions: number[], sways?: number[], tilts?: number[], drops?: number[], crashed?: boolean[]) => {
      const travelPx = travelPxRef.current

      positions.forEach((raw, index) => {
        const node = runnerRefs.current[index]
        if (!node) return

        const progress = clamp(raw, 0, 1)
        const crashDrop = drops?.[index] ?? 0
        const rawY = -progress * travelPx + crashDrop
        const y = clamp(rawY, -travelPx, 0)
        const swayX = sways?.[index] ?? 0
        const tilt = tilts?.[index] ?? 0
        const transform = `translate3d(-50%, ${y.toFixed(2)}px, 0) translateX(${swayX.toFixed(2)}px) rotate(${tilt.toFixed(2)}deg)`
        const opacity = crashed?.[index] ? '0.58' : '1'

        if (lastTransformsRef.current[index] !== transform) {
          node.style.transform = transform
          lastTransformsRef.current[index] = transform
        }
        if (lastOpacitiesRef.current[index] !== opacity) {
          node.style.opacity = opacity
          lastOpacitiesRef.current[index] = opacity
        }
      })
    },
    [],
  )

  const paintProgressBar = useCallback((positions: number[]) => {
    if (!progressFillRef.current) return

    const average = positions.length > 0 ? positions.reduce((sum, value) => sum + value, 0) / positions.length : 0
    progressFillRef.current.style.width = `${(average * 100).toFixed(2)}%`
  }, [])

  const paintCamera = useCallback(
    ({
      averageProgress,
      averageSpeed,
      kick,
      laneMax,
      laneMin,
      leaderLaneX,
      leaderProgress,
      packCenterLaneX,
      packCenterProgress,
      packSpread,
      progressMax,
      progressMin,
    }: CameraFrameInput) => {
      if (!cameraLayerRef.current) return

      const scrolling = isUserScrollingRef.current
      const pose = cameraPoseRef.current
      const smooth = scrolling ? 0.16 : 0.21

      const packWidth = Math.max(0.08, laneMax - laneMin)
      const packHeight = Math.max(0.08, progressMax - progressMin)
      const xPadding = 0.08
      const yPadding = 0.1
      const zoomCapX = (1 - xPadding * 2) / packWidth
      const zoomCapY = (1 - yPadding * 2) / packHeight
      const maxPackZoom = clamp(Math.min(zoomCapX, zoomCapY), 1, scrolling ? 1.06 : 1.1)

      const followLaneX = leaderLaneX * 0.68 + packCenterLaneX * 0.32
      const followProgress = leaderProgress * 0.72 + packCenterProgress * 0.28
      const targetOriginX = clamp(followLaneX * 100, 20, 80)
      const targetOriginY = clamp(100 - followProgress * 100, 22, 86)

      const panXLimit = Math.max(3, (1 - packWidth) * (scrolling ? 7 : 11))
      const panYLimit = Math.max(4, (1 - packHeight) * (scrolling ? 9 : 15))
      const targetPanX = clamp((0.5 - followLaneX) * (scrolling ? 8 : 13), -panXLimit, panXLimit)
      const targetPanY = clamp((leaderProgress - 0.38) * (scrolling ? 8 : 14), -panYLimit, panYLimit)

      const zoomBase = scrolling
        ? 1 + averageProgress * 0.04 + averageSpeed * 0.015
        : 1.02 + leaderProgress * 0.06 + averageSpeed * 0.02
      const zoomPenalty = packSpread * (scrolling ? 0.11 : 0.18)
      const targetZoom = clamp(zoomBase - zoomPenalty, 1, maxPackZoom)

      pose.originX += (targetOriginX - pose.originX) * smooth
      pose.originY += (targetOriginY - pose.originY) * smooth
      pose.panX += (targetPanX - pose.panX) * smooth
      pose.panY += (targetPanY - pose.panY) * smooth
      pose.zoom += (targetZoom - pose.zoom) * (scrolling ? 0.18 : 0.24)

      const effectiveKick = scrolling || kick < 0.02 ? 0 : kick
      if (effectiveKick === 0) {
        pose.shakeX *= 0.72
        pose.shakeY *= 0.72
      } else {
        const shakeStrength = Math.min(1.1, effectiveKick * 1.6)
        pose.shakeX = pose.shakeX * 0.58 + (Math.random() - 0.5) * shakeStrength
        pose.shakeY = pose.shakeY * 0.58 + (Math.random() - 0.5) * shakeStrength * 0.65
      }

      const coreWidth = trackCoreRef.current?.clientWidth ?? 0
      const coreHeight = trackCoreRef.current?.clientHeight ?? 0
      const maxShiftX = coreWidth > 0 ? clamp((pose.zoom - 1) * coreWidth * 0.35 + 5, 4, 18) : 10
      const maxShiftY = coreHeight > 0 ? clamp((pose.zoom - 1) * coreHeight * 0.22 + 5, 4, 20) : 12
      const renderPanX = clamp(pose.panX + pose.shakeX, -maxShiftX, maxShiftX)
      const renderPanY = clamp(pose.panY + pose.shakeY, -maxShiftY, maxShiftY)

      cameraLayerRef.current.style.transformOrigin = `${pose.originX.toFixed(2)}% ${pose.originY.toFixed(2)}%`
      cameraLayerRef.current.style.transform = `translate3d(${renderPanX.toFixed(2)}px, ${renderPanY.toFixed(2)}px, 0) scale(${pose.zoom.toFixed(4)})`
    },
    [],
  )

  const resetCamera = useCallback(() => {
    if (!cameraLayerRef.current) return
    cameraPoseRef.current = {
      originX: 50,
      originY: 84,
      panX: 0,
      panY: 0,
      shakeX: 0,
      shakeY: 0,
      zoom: 1,
    }
    cameraLayerRef.current.style.transformOrigin = '50% 84%'
    cameraLayerRef.current.style.transform = 'translate3d(0px, 0px, 0px) scale(1)'
  }, [])

  const stopRaceLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    raceRef.current = null
    resetCamera()
  }, [resetCamera])

  const resetBoard = useCallback(
    (count: number) => {
      const zeroPositions = Array(count).fill(0)
      setBoardSnapshot({ crashOrder: [], crashed: [], finishOrder: [], positions: zeroPositions })

      requestAnimationFrame(() => {
        measureTravelDistance()
        paintRunners(zeroPositions)
        paintProgressBar(zeroPositions)
        resetCamera()
      })
    },
    [measureTravelDistance, paintProgressBar, paintRunners, resetCamera],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ names: planeNames }))
  }, [planeNames])

  useEffect(() => {
    runnerRefs.current.length = planeCount
    lastTransformsRef.current.length = planeCount
    lastOpacitiesRef.current.length = planeCount
  }, [planeCount])

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1))
  }, [totalPages])

  useEffect(() => {
    if (racePhase === 'idle') {
      resetBoard(planeCount)
    }
  }, [planeCount, racePhase, resetBoard])

  useEffect(() => {
    if (racePhase === 'running') return
    setObstacles([])
  }, [planeCount, racePhase])

  useEffect(() => {
    const onScroll = () => {
      lastScrollAtRef.current = performance.now()
      if (!isUserScrollingRef.current) {
        isUserScrollingRef.current = true
        setIsScrolling(true)
      }
      if (scrollWatchRafRef.current !== null) return

      const watchScrollIdle = () => {
        if (performance.now() - lastScrollAtRef.current < SCROLL_IDLE_MS) {
          scrollWatchRafRef.current = window.requestAnimationFrame(watchScrollIdle)
          return
        }

        isUserScrollingRef.current = false
        setIsScrolling(false)
        scrollWatchRafRef.current = null
      }

      scrollWatchRafRef.current = window.requestAnimationFrame(watchScrollIdle)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollWatchRafRef.current !== null) {
        window.cancelAnimationFrame(scrollWatchRafRef.current)
      }
    }
  }, [])

  useEffect(() => {
    boardPositionsRef.current = boardSnapshot.positions
    boardCrashedRef.current = boardSnapshot.crashed
  }, [boardSnapshot.crashed, boardSnapshot.positions])

  useEffect(() => {
    if (racePhase === 'finished' && progressFillRef.current) {
      progressFillRef.current.style.width = '100%'
    }
  }, [racePhase])

  useEffect(() => {
    measureTravelDistance()
    const onResize = () => {
      measureTravelDistance()
      const race = raceRef.current
      if (race) {
        paintRunners(race.positions, race.renderSways, race.tiltAngles, race.crashDrops, race.crashed)
        const avgProgress = race.positions.reduce((sum, value) => sum + value, 0) / Math.max(1, race.positions.length)
        const avgSpeed = race.speeds.reduce((sum, value) => sum + value, 0) / Math.max(1, race.speeds.length)
        const focus = getCameraFocus(race.positions, race.laneXs, race.crashed)
        paintCamera({ averageProgress: avgProgress, averageSpeed: avgSpeed, kick: race.cameraKick, ...focus })
      } else {
        const crashedFlags = Array.from({ length: boardPositionsRef.current.length }, (_, index) =>
          boardCrashedRef.current.includes(index),
        )
        paintRunners(boardPositionsRef.current, undefined, undefined, undefined, crashedFlags)
        resetCamera()
      }
    }

    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [measureTravelDistance, paintCamera, paintRunners, resetCamera])

  useEffect(() => {
    return () => {
      stopRaceLoop()
    }
  }, [stopRaceLoop])

  const registerRunner = useCallback((index: number, node: HTMLDivElement | null) => {
    runnerRefs.current[index] = node
  }, [])

  const updateName = (index: number, value: string) => {
    if (racePhase === 'running') return

    setPlaneNames((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const removePlane = (index: number) => {
    if (racePhase === 'running') return

    setPlaneNames((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  const addSinglePlane = () => {
    if (racePhase === 'running') return

    if (planeCount >= MAX_PLANES) {
      setFeedbackMessage(`최대 ${MAX_PLANES}대까지 추가할 수 있습니다.`)
      return
    }

    setPlaneNames((prev) => [...prev, defaultPlaneName(prev.length)])
    setFeedbackMessage('1대를 추가했습니다.')
  }

  const applyFormulaLive = useCallback(
    (formula: string) => {
      if (racePhase === 'running') return

      const generated = parseBatchInput(formula, MAX_PLANES)
      if (generated.length === 0) {
        setFeedbackMessage('수식을 입력하면 실시간으로 적용됩니다. 예: 비행기1 * 10')
        return
      }

      const unchanged =
        planeNames.length === generated.length && planeNames.every((name, index) => name === generated[index])

      if (unchanged) {
        setFeedbackMessage(`실시간 적용: ${generated.length}대`)
        return
      }

      stopRaceLoop()
      setRacePhase('idle')
      setWinnerIndex(null)
      setPage(0)
      setPlaneNames(generated)
      setObstacles([])
      setFeedbackMessage(`실시간 적용: ${generated.length}대`)
    },
    [planeNames, racePhase, stopRaceLoop],
  )

  const onBatchInputChange = (value: string) => {
    setBatchInput(value)
    applyFormulaLive(value)
  }

  const startRace = () => {
    if (racePhase === 'running') return

    const normalized = normalizeNames(planeNames)
    if (normalized.length < MIN_PLANES) {
      setFeedbackMessage(`최소 ${MIN_PLANES}대 이상 필요합니다.`)
      return
    }

    const hasDiff = normalized.some((name, index) => name !== planeNames[index])
    if (hasDiff) {
      setPlaneNames(normalized)
    }

    stopRaceLoop()
    measureTravelDistance()

    const total = normalized.length
    const zeroPositions = Array(total).fill(0)
    const obstacleSet = createObstacleSet(total)
    const { sidePadding, span } = laneLayoutForCount(total)
    const laneXs = Array.from({ length: total }, (_, index) => (sidePadding + ((index + 0.5) / total) * span) / 100)

    setRacePhase('running')
    setWinnerIndex(null)
    setObstacles(obstacleSet)
    setBoardSnapshot({ crashOrder: [], crashed: [], finishOrder: [], positions: zeroPositions })
    paintRunners(zeroPositions)
    paintProgressBar(zeroPositions)
    resetCamera()

    raceRef.current = {
      baseSpeeds: Array.from({ length: total }, () => randomBetween(0.062, 0.102)),
      cameraKick: 0,
      crashDrops: Array(total).fill(0),
      crashOrder: [],
      crashed: Array(total).fill(false),
      finishOrder: [],
      finishRanks: Array(total).fill(-1),
      lastBoardUpdate: performance.now(),
      lastFrame: performance.now(),
      lastRenderAt: performance.now(),
      laneXs,
      obstacles: obstacleSet,
      positions: zeroPositions,
      renderSways: Array(total).fill(0),
      speeds: Array.from({ length: total }, () => randomBetween(0.045, 0.085)),
      swayOffsets: Array(total).fill(0),
      swayPhases: Array.from({ length: total }, () => randomBetween(0, Math.PI * 2)),
      tiltAngles: Array(total).fill(0),
      winner: null,
    }

    const tick = (timestamp: number) => {
      const race = raceRef.current
      if (!race) return

      const dt = Math.min((timestamp - race.lastFrame) / 1000, 0.05)
      race.lastFrame = timestamp

      const scrolling = isUserScrollingRef.current
      const renderIntervalMs = scrolling ? (total > 70 ? 96 : 84) : total > 90 ? 36 : total > 60 ? 28 : total > 36 ? 22 : 16
      const shouldRender = timestamp - race.lastRenderAt >= renderIntervalMs

      race.cameraKick *= scrolling ? 0.86 : 0.92

      let speedSum = 0
      let progressSum = 0

      for (let index = 0; index < total; index += 1) {
        if (race.finishRanks[index] !== -1) {
          race.renderSways[index] = 0
          race.tiltAngles[index] = 0
          speedSum += race.speeds[index]
          progressSum += race.positions[index]
          continue
        }

        if (race.crashed[index]) {
          const crashDropLimit = travelPxRef.current + 24
          race.crashDrops[index] = Math.min(
            crashDropLimit,
            race.crashDrops[index] + dt * (84 + race.crashDrops[index] * 0.48),
          )
          if (shouldRender) {
            race.renderSways[index] *= 0.92
            const crashTiltTarget = race.tiltAngles[index] >= 0 ? 62 : -62
            race.tiltAngles[index] += (crashTiltTarget - race.tiltAngles[index]) * Math.min(1, dt * 3.8)
          }
          progressSum += race.positions[index]
          continue
        }

        const laneX = race.laneXs[index]
        let obstacleBoost = 0
        let lateralTarget = 0
        let collided = false

        for (const obstacle of race.obstacles) {
          const distanceY = Math.abs(race.positions[index] - obstacle.y)
          const distanceX = Math.abs(laneX - obstacle.x)
          if (distanceY > obstacle.radius || distanceX > obstacle.width) continue

          const yFactor = 1 - distanceY / obstacle.radius
          const xFactor = 1 - distanceX / obstacle.width
          const influence = yFactor * xFactor

          if (obstacle.kind === 'storm') {
            obstacleBoost -= obstacle.power * influence
          } else if (obstacle.kind === 'tailwind') {
            obstacleBoost += obstacle.power * influence
          } else {
            obstacleBoost += obstacle.power * 0.45 * influence
          }

          lateralTarget += obstacle.drift * influence
          if (influence > 0.7) {
            race.cameraKick = Math.max(race.cameraKick, 0.4)
          }

          if (influence > 0.62) {
            race.crashed[index] = true
            race.crashOrder.push(index)
            race.speeds[index] = 0
            race.renderSways[index] = randomBetween(-2.4, 2.4)
            race.tiltAngles[index] = randomBetween(-46, 46)
            race.cameraKick = Math.max(race.cameraKick, 1.2)
            collided = true
            break
          }
        }

        if (collided) {
          progressSum += race.positions[index]
          continue
        }

        const jitter = randomBetween(-0.16, 0.16)
        const targetSpeed = race.baseSpeeds[index] + obstacleBoost
        race.speeds[index] += ((targetSpeed - race.speeds[index]) * 0.95 + jitter) * dt
        race.speeds[index] = clamp(race.speeds[index], 0.032, 0.158)
        race.positions[index] += race.speeds[index] * dt

        if (shouldRender) {
          race.swayOffsets[index] += (lateralTarget * 10 - race.swayOffsets[index]) * Math.min(1, dt * 6.5)
          race.swayPhases[index] += dt * (2.5 + race.speeds[index] * 12)
          const naturalSway = Math.sin(race.swayPhases[index]) * (1.4 + race.speeds[index] * 18)
          const sway = clamp(race.swayOffsets[index] + naturalSway, -14, 14)
          race.renderSways[index] = sway
          race.tiltAngles[index] = clamp(sway * 0.62 + obstacleBoost * 42, -13, 13)
        }

        if (race.positions[index] >= 1) {
          race.positions[index] = 1
          race.finishRanks[index] = race.finishOrder.length + 1
          race.finishOrder.push(index)
          race.cameraKick = Math.max(race.cameraKick, 0.8)

          if (race.winner === null) {
            race.winner = index
            setWinnerIndex(index)
            setConfettiBurst((value) => value + 1)
          }
        }

        speedSum += race.speeds[index]
        progressSum += race.positions[index]
      }

      const averageProgress = progressSum / Math.max(1, total)
      const averageSpeed = speedSum / Math.max(1, total)
      const raceResolved = race.finishOrder.length + race.crashOrder.length
      const focus = getCameraFocus(race.positions, race.laneXs, race.crashed)

      if (shouldRender || raceResolved >= total) {
        paintRunners(race.positions, race.renderSways, race.tiltAngles, race.crashDrops, race.crashed)
        if (raceResolved >= total) {
          if (progressFillRef.current) progressFillRef.current.style.width = '100%'
        } else {
          paintProgressBar(race.positions)
        }
        paintCamera({ averageProgress, averageSpeed, kick: race.cameraKick, ...focus })
        race.lastRenderAt = timestamp
      }

      const boardUpdateInterval = scrolling ? SCROLL_BOARD_UPDATE_MS : BOARD_UPDATE_MS
      if (timestamp - race.lastBoardUpdate >= boardUpdateInterval || raceResolved === total) {
        race.lastBoardUpdate = timestamp
        setBoardSnapshot({
          crashOrder: [...race.crashOrder],
          crashed: race.crashed.reduce<number[]>((acc, value, idx) => {
            if (value) acc.push(idx)
            return acc
          }, []),
          finishOrder: [...race.finishOrder],
          positions: [...race.positions],
        })
      }

      if (raceResolved >= total) {
        paintRunners(race.positions, race.renderSways, race.tiltAngles, race.crashDrops, race.crashed)
        if (progressFillRef.current) progressFillRef.current.style.width = '100%'
        setRacePhase('finished')
        raceRef.current = null
        setObstacles([])
        resetCamera()
        rafRef.current = null
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  const resetAll = () => {
    stopRaceLoop()

    const defaults = fillDefaultNames(DEFAULT_PLANES)
    setPlaneNames(defaults)
    setObstacles([])
    setBatchInput('비행기1 * 10')
    setFeedbackMessage('초기 상태로 리셋했습니다.')
    setPage(0)
    setRacePhase('idle')
    setWinnerIndex(null)
    setConfettiBurst(0)
    resetBoard(defaults.length)

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden px-4 py-6 md:px-8">
      {winnerName && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {confettiPieces.map((piece, index) => (
            <span key={`${confettiBurst}-${index}`} className="confetti-piece" style={confettiStyle(piece)} />
          ))}
        </div>
      )}

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:gap-6">
        <header className="panel-glow rounded-2xl border border-cyan-300/30 bg-slate-900/70 p-4 md:p-6">
          <p className="title-font text-sm font-bold uppercase tracking-[0.28em] text-cyan-300/85">zetrun</p>
          <h1 className="title-font mt-2 text-3xl font-black tracking-tight text-cyan-100 md:text-5xl">zetrun</h1>
          <p className="mt-3 text-base text-slate-200/90 md:text-lg">{raceStatusText}</p>
        </header>

        <main className="grid gap-4 lg:grid-cols-[330px_minmax(0,1fr)]">
          <section className="panel-glow rounded-2xl border border-slate-300/15 bg-slate-900/72 p-4">
            <h2 className="title-font text-xl font-bold text-cyan-100">레이스 설정</h2>
            <p className="mt-2 text-sm text-slate-200/90">
              현재 <span className="font-bold text-cyan-300">{planeCount}대</span> / 최대 {MAX_PLANES}대
            </p>

            <div className="mt-4 space-y-2 rounded-lg border border-slate-600/60 bg-slate-900/65 p-3">
              <label className="text-sm font-semibold text-slate-100">수식 입력 (실시간 적용)</label>
              <input
                type="text"
                value={batchInput}
                disabled={racePhase === 'running'}
                onChange={(event) => onBatchInputChange(event.target.value)}
                placeholder="예: 비행기1 * 24, Eagle * 8"
                className="w-full rounded-md border border-slate-500/60 bg-slate-800/90 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
              />
              <p className="text-xs text-slate-300/85">
                실시간 적용중: {previewCount}대 (`*`, `x` 지원, 줄바꿈/쉼표로 여러 수식 입력)
              </p>
              <button
                type="button"
                onClick={addSinglePlane}
                disabled={racePhase === 'running'}
                className="title-font w-full rounded-md bg-emerald-500 px-3 py-2 text-xs font-black tracking-wide text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                1대 추가
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-slate-600/60 bg-slate-900/55 p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-300">
                <span>이름 편집</span>
                <span>
                  페이지 {page + 1} / {totalPages}
                </span>
              </div>

              <div className="mb-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0}
                  className="rounded-md bg-slate-700 px-2 py-1 text-xs text-slate-100 transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-800"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-md bg-slate-700 px-2 py-1 text-xs text-slate-100 transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:bg-slate-800"
                >
                  다음
                </button>
              </div>

              <div className="space-y-2">
                {pageRows.length > 0 ? (
                  pageRows.map((name, localIndex) => {
                    const globalIndex = pageStart + localIndex
                    return (
                      <label key={globalIndex} className="flex items-center gap-2 rounded-md bg-slate-800/70 p-2">
                        <span className="title-font inline-flex w-9 shrink-0 justify-center text-xs font-bold text-cyan-300">
                          {globalIndex + 1}
                        </span>
                        <input
                          value={name}
                          disabled={racePhase === 'running'}
                          onChange={(event) => updateName(globalIndex, event.target.value)}
                          placeholder={defaultPlaneName(globalIndex)}
                          className="w-full rounded-md border border-slate-500/50 bg-slate-900/80 px-2 py-1.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                        />
                        <button
                          type="button"
                          onClick={() => removePlane(globalIndex)}
                          disabled={racePhase === 'running'}
                          className="rounded-md bg-rose-500 px-2 py-1 text-xs font-bold text-slate-100 transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:bg-slate-600"
                        >
                          삭제
                        </button>
                      </label>
                    )
                  })
                ) : (
                  <p className="rounded-md bg-slate-800/70 p-3 text-sm text-slate-300">비행기를 추가해주세요.</p>
                )}
              </div>
            </div>

            <div className="mt-4 min-h-5 text-xs text-amber-200">{feedbackMessage}</div>

            <div className="mt-3 grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={racePhase === 'running' || !canRace}
                onClick={startRace}
                className="title-font rounded-md bg-cyan-500 px-4 py-2 text-sm font-black tracking-wide text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                레이스 시작
              </button>
              <button
                type="button"
                disabled={racePhase === 'running' || !canRace}
                onClick={startRace}
                className="title-font rounded-md bg-emerald-500 px-4 py-2 text-sm font-black tracking-wide text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                재경기
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="title-font rounded-md bg-rose-500 px-4 py-2 text-sm font-black tracking-wide text-slate-100 transition hover:bg-rose-400"
              >
                리셋
              </button>
            </div>

            {!canRace && <p className="mt-2 text-xs text-rose-300">최소 {MIN_PLANES}대 이상 있어야 레이스를 시작할 수 있습니다.</p>}
          </section>

          <section className="flex flex-col gap-4">
            <div className="panel-glow rounded-2xl border border-slate-300/15 bg-slate-900/72 p-3 md:p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="title-font text-xl font-bold text-cyan-100">스카이 레이스</h2>
                <span className="text-sm font-semibold text-slate-200">{planeCount}대 동시 출전</span>
              </div>

              <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-slate-700/90">
                <div
                  ref={progressFillRef}
                  className="h-full w-0 rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-teal-300 transition-[width] duration-100"
                />
              </div>

              <SkyTrack
                cameraLayerRef={cameraLayerRef}
                focusLeaderName={focusLeaderName}
                isScrolling={isScrolling}
                names={namesForRace}
                obstacles={obstacles}
                racePhase={racePhase}
                registerRunner={registerRunner}
                running={racePhase === 'running'}
                stageRef={stageRef}
                trackCoreRef={trackCoreRef}
              />
            </div>

            <div className="panel-glow rounded-2xl border border-slate-300/15 bg-slate-900/72 p-4">
              <h2 className="title-font text-xl font-bold text-cyan-100">레이스 결과</h2>
              {racePhase === 'finished' && podium.length > 0 ? (
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                  {podium.map((item) => (
                    <div
                      key={`podium-${item.rank}`}
                      className={`rounded-lg p-3 ${
                        item.state === 'crash'
                          ? 'bg-rose-300/18 ring-1 ring-rose-300/45'
                          : item.rank === 1
                          ? 'bg-amber-300/20 ring-1 ring-amber-300/45'
                          : item.rank === 2
                            ? 'bg-slate-300/20 ring-1 ring-slate-300/40'
                            : 'bg-orange-300/20 ring-1 ring-orange-300/45'
                      }`}
                    >
                      <p className="title-font text-sm font-black text-slate-50">
                        {item.medal} {item.rank}등
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-100">{item.name}</p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-200/90">
                        {item.state === 'finish' ? '결승 통과' : '장애물 충돌 추락'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-300">
                  {racePhase === 'running' ? '레이스 진행 중... 곧 상위 3대 결과가 표시됩니다.' : '레이스 시작 후 이 자리에서 1~3등 결과를 바로 확인할 수 있습니다.'}
                </p>
              )}
            </div>

            <div className="panel-glow rounded-2xl border border-slate-300/15 bg-slate-900/72 p-4">
              <h2 className="title-font text-xl font-bold text-cyan-100">실시간 순위</h2>
              <ul className="mt-3 max-h-[32vh] space-y-2 overflow-auto pr-1">
                {ranking.map((item, rank) => (
                  <li key={`rank-${item.index}`} className="rounded-lg bg-slate-800/80 p-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-100">
                        {rank + 1}등 - {item.name}
                      </span>
                      <span className="title-font text-xs font-bold text-cyan-300">
                        {item.finishRank !== null
                          ? '도착'
                          : crashedSet.has(item.index)
                            ? '추락'
                            : racePhase === 'running'
                              ? '상승중'
                              : '대기'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default RaceGame
