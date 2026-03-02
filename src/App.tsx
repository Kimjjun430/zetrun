import type { CSSProperties, RefObject } from 'react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

const MIN_PLANES = 2
const MAX_PLANES = 120
const DEFAULT_PLANES = 6
const STORAGE_KEY = 'air-race-settings-v2'
const PAGE_SIZE = 10
const BOARD_UPDATE_MS = 120

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
  finishOrder: number[]
  finishRanks: number[]
  lastBoardUpdate: number
  lastFrame: number
  positions: number[]
  speeds: number[]
  winner: number | null
}

type RankingItem = {
  finishRank: number | null
  index: number
  name: string
  progress: number
}

type BoardSnapshot = {
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

const spriteVariantFromCount = (count: number): SpriteVariant => {
  if (count > 70) return 'dot'
  if (count > 24) return 'compact'
  return 'full'
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
  names: string[]
  registerRunner: (index: number, node: HTMLDivElement | null) => void
  running: boolean
  stageRef: RefObject<HTMLDivElement | null>
}

const SkyTrack = memo(function SkyTrack({ names, registerRunner, running, stageRef }: SkyTrackProps) {
  const variant = spriteVariantFromCount(names.length)
  const sidePadding = names.length > 70 ? 1.5 : names.length > 30 ? 2.2 : 3.2
  const span = 100 - sidePadding * 2

  return (
    <div
      ref={stageRef}
      className="sky-track relative h-[68vh] min-h-[420px] max-h-[760px] overflow-hidden rounded-2xl border border-cyan-300/20"
    >
      <div className="pointer-events-none absolute inset-0 opacity-75" />

      <div className="finish-band absolute inset-x-2 top-2 z-30 rounded-md px-3 py-1 text-center">
        <span className="title-font text-xs font-black tracking-[0.28em] text-slate-950">FINISH LINE</span>
      </div>

      <div className="start-band absolute inset-x-2 bottom-2 z-30 rounded-md px-3 py-1 text-center">
        <span className="title-font text-xs font-black tracking-[0.24em] text-slate-950">START ZONE</span>
      </div>

      <div className="absolute inset-x-3 bottom-12 top-11 rounded-xl border border-cyan-200/10" />

      {names.map((name, index) => {
        const left = sidePadding + ((index + 0.5) / names.length) * span

        return (
          <div
            key={`runner-${index}`}
            className="pointer-events-none absolute bottom-4 z-20"
            style={{ left: `${left.toFixed(3)}%` }}
            title={name}
          >
            <div ref={(node) => registerRunner(index, node)} className="runner-node will-change-transform">
              <PlaneSprite
                color={PLANE_COLORS[index % PLANE_COLORS.length]}
                name={name}
                running={running}
                variant={variant}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
})

function App() {
  const initialSettings = useMemo(loadSettings, [])

  const [planeNames, setPlaneNames] = useState<string[]>(initialSettings.names)
  const [batchInput, setBatchInput] = useState('비행기1 * 10')
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [racePhase, setRacePhase] = useState<RacePhase>('idle')
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null)
  const [confettiBurst, setConfettiBurst] = useState(0)
  const [boardSnapshot, setBoardSnapshot] = useState<BoardSnapshot>({
    finishOrder: [],
    positions: Array(initialSettings.names.length).fill(0),
  })

  const raceRef = useRef<RacePhysics | null>(null)
  const rafRef = useRef<number | null>(null)
  const runnerRefs = useRef<Array<HTMLDivElement | null>>([])
  const progressFillRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const travelPxRef = useRef(320)
  const boardPositionsRef = useRef<number[]>(Array(initialSettings.names.length).fill(0))

  const planeCount = planeNames.length
  const namesForRace = useMemo(() => normalizeNames(planeNames), [planeNames])

  const ranking = useMemo(
    () => buildRanking(namesForRace, boardSnapshot.positions, boardSnapshot.finishOrder),
    [boardSnapshot, namesForRace],
  )

  const winnerName = winnerIndex !== null ? namesForRace[winnerIndex] : null
  const totalPages = Math.max(1, Math.ceil(planeCount / PAGE_SIZE))
  const pageStart = page * PAGE_SIZE
  const pageRows = planeNames.slice(pageStart, pageStart + PAGE_SIZE)
  const canRace = planeCount >= MIN_PLANES

  const previewCount = useMemo(() => parseBatchInput(batchInput, MAX_PLANES).length, [batchInput])
  const confettiPieces = useMemo(() => createConfetti(), [confettiBurst])

  const confettiStyle = (piece: ConfettiPiece): CSSProperties & Record<'--drift', string> => ({
    animationDelay: piece.delay,
    animationDuration: piece.duration,
    backgroundColor: piece.color,
    left: piece.left,
    rotate: piece.rotate,
    '--drift': piece.drift,
  })

  const measureTravelDistance = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return

    travelPxRef.current = Math.max(180, stage.clientHeight - 116)
  }, [])

  const paintRunners = useCallback((positions: number[]) => {
    const travelPx = travelPxRef.current

    positions.forEach((raw, index) => {
      const node = runnerRefs.current[index]
      if (!node) return

      const progress = clamp(raw, 0, 1)
      const y = -progress * travelPx
      node.style.transform = `translate3d(-50%, ${y.toFixed(2)}px, 0)`
    })
  }, [])

  const paintProgressBar = useCallback((positions: number[]) => {
    if (!progressFillRef.current) return

    const average = positions.length > 0 ? positions.reduce((sum, value) => sum + value, 0) / positions.length : 0
    progressFillRef.current.style.width = `${(average * 100).toFixed(2)}%`
  }, [])

  const stopRaceLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    raceRef.current = null
  }, [])

  const resetBoard = useCallback(
    (count: number) => {
      const zeroPositions = Array(count).fill(0)
      setBoardSnapshot({ finishOrder: [], positions: zeroPositions })

      requestAnimationFrame(() => {
        measureTravelDistance()
        paintRunners(zeroPositions)
        paintProgressBar(zeroPositions)
      })
    },
    [measureTravelDistance, paintProgressBar, paintRunners],
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ names: planeNames }))
  }, [planeNames])

  useEffect(() => {
    runnerRefs.current.length = planeCount
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
    boardPositionsRef.current = boardSnapshot.positions
  }, [boardSnapshot.positions])

  useEffect(() => {
    measureTravelDistance()
    const onResize = () => {
      measureTravelDistance()
      const race = raceRef.current
      if (race) {
        paintRunners(race.positions)
      } else {
        paintRunners(boardPositionsRef.current)
      }
    }

    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [measureTravelDistance, paintRunners])

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

    setRacePhase('running')
    setWinnerIndex(null)
    setBoardSnapshot({ finishOrder: [], positions: zeroPositions })
    paintRunners(zeroPositions)
    paintProgressBar(zeroPositions)

    raceRef.current = {
      baseSpeeds: Array.from({ length: total }, () => randomBetween(0.11, 0.165)),
      finishOrder: [],
      finishRanks: Array(total).fill(-1),
      lastBoardUpdate: performance.now(),
      lastFrame: performance.now(),
      positions: zeroPositions,
      speeds: Array.from({ length: total }, () => randomBetween(0.09, 0.155)),
      winner: null,
    }

    const tick = (timestamp: number) => {
      const race = raceRef.current
      if (!race) return

      const dt = Math.min((timestamp - race.lastFrame) / 1000, 0.05)
      race.lastFrame = timestamp

      for (let index = 0; index < total; index += 1) {
        if (race.finishRanks[index] !== -1) continue

        const jitter = randomBetween(-0.18, 0.18)
        race.speeds[index] += ((race.baseSpeeds[index] - race.speeds[index]) * 0.9 + jitter) * dt
        race.speeds[index] = clamp(race.speeds[index], 0.07, 0.22)
        race.positions[index] += race.speeds[index] * dt

        if (race.positions[index] >= 1) {
          race.positions[index] = 1
          race.finishRanks[index] = race.finishOrder.length + 1
          race.finishOrder.push(index)

          if (race.winner === null) {
            race.winner = index
            setWinnerIndex(index)
            setConfettiBurst((value) => value + 1)
          }
        }
      }

      paintRunners(race.positions)
      paintProgressBar(race.positions)

      if (timestamp - race.lastBoardUpdate >= BOARD_UPDATE_MS || race.finishOrder.length === total) {
        race.lastBoardUpdate = timestamp
        setBoardSnapshot({
          finishOrder: [...race.finishOrder],
          positions: [...race.positions],
        })
      }

      if (race.finishOrder.length >= total) {
        setRacePhase('finished')
        raceRef.current = null
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
    <div className="relative min-h-screen overflow-hidden px-4 py-6 md:px-8">
      {winnerName && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {confettiPieces.map((piece, index) => (
            <span key={`${confettiBurst}-${index}`} className="confetti-piece" style={confettiStyle(piece)} />
          ))}
        </div>
      )}

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 md:gap-6">
        <header className="panel-glow rounded-2xl border border-cyan-300/30 bg-slate-900/70 p-4 md:p-6">
          <p className="title-font text-sm font-bold uppercase tracking-[0.28em] text-cyan-300/85">Air Arcade</p>
          <h1 className="title-font mt-2 text-3xl font-black tracking-tight text-cyan-100 md:text-5xl">비행기 레이스</h1>
          <p className="mt-3 text-slate-200/90">
            {winnerName ? (
              <span className="title-font text-2xl font-black text-amber-300 md:text-4xl">우승: {winnerName}</span>
            ) : (
              <span className="text-base md:text-lg">모든 비행기가 하단에서 출발해 상단 결승선으로 돌진합니다.</span>
            )}
          </p>
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
                names={namesForRace}
                registerRunner={registerRunner}
                running={racePhase === 'running'}
                stageRef={stageRef}
              />
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
                        {item.finishRank !== null ? '도착' : racePhase === 'running' ? '상승중' : '대기'}
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

export default App
