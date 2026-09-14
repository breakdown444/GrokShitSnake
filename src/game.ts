export type Point = { x: number; y: number }
export type Dir = 'up' | 'down' | 'left' | 'right'
export type Phase = 'ready' | 'playing' | 'paused' | 'dead'
export type Stain = {
  x: number
  y: number
  fromX: number
  fromY: number
  at: number
  seed: number
}

export const COLS = 50
export const ROWS = 50
export const START_TICK_MS = 140
export const MIN_TICK_MS = 70
export const STAIN_MS = 3000

const OPPOSITE: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

function same(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

function randomEmpty(occupied: Point[]): Point {
  const free: Point[] = []
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = { x, y }
      if (!occupied.some((p) => same(p, cell))) free.push(cell)
    }
  }
  return free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 }
}

export class SnakeGame {
  snake: Point[] = []
  food: Point = { x: 25, y: 10 }
  dir: Dir = 'right'
  queued: Dir | null = null
  phase: Phase = 'ready'
  score = 0
  highScore = Number(localStorage.getItem('grok-shit-snake-high-score') ?? '0')
  tickMs = START_TICK_MS
  stains: Stain[] = []

  reset(): void {
    this.snake = [
      { x: 20, y: 25 },
      { x: 19, y: 25 },
      { x: 18, y: 25 },
    ]
    this.dir = 'right'
    this.queued = null
    this.score = 0
    this.tickMs = START_TICK_MS
    this.food = randomEmpty(this.snake)
    this.phase = 'ready'
    this.stains = []
  }

  start(): void {
    if (this.phase === 'dead' || this.phase === 'ready') {
      this.reset()
      this.phase = 'playing'
      this.markTrail(performance.now())
    } else if (this.phase === 'paused') {
      this.phase = 'playing'
    }
  }

  togglePause(): void {
    if (this.phase === 'playing') this.phase = 'paused'
    else if (this.phase === 'paused') this.phase = 'playing'
  }

  turn(next: Dir): void {
    if (this.phase === 'ready') {
      this.phase = 'playing'
      this.markTrail(performance.now())
    }
    if (this.phase !== 'playing') return
    const current = this.queued ?? this.dir
    if (next === OPPOSITE[current]) return
    this.queued = next
  }

  markTrail(at: number): void {
    for (const point of this.snake) this.dropStain(point, point, at)
  }

  dropStain(point: Point, from: Point, at: number): void {
    this.stains.push({
      x: point.x,
      y: point.y,
      fromX: from.x,
      fromY: from.y,
      at,
      seed: (point.x * 131 + point.y * 17 + Math.floor(at)) % 997,
    })
  }

  expireStains(now: number): void {
    this.stains = this.stains.filter((stain) => now - stain.at < STAIN_MS)
  }

  step(now = performance.now()): boolean {
    if (this.phase !== 'playing') return false
    if (this.queued) {
      this.dir = this.queued
      this.queued = null
    }

    const head = this.snake[0]
    const next: Point = {
      x: head.x + (this.dir === 'left' ? -1 : this.dir === 'right' ? 1 : 0),
      y: head.y + (this.dir === 'up' ? -1 : this.dir === 'down' ? 1 : 0),
    }

    const hitWall = next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS
    const hitSelf = this.snake.some((p) => same(p, next))
    if (hitWall || hitSelf) {
      this.phase = 'dead'
      if (this.score > this.highScore) {
        this.highScore = this.score
        localStorage.setItem('grok-shit-snake-high-score', String(this.highScore))
      }
      return false
    }

    this.snake.unshift(next)
    this.dropStain(next, head, now)
    let ate = false
    if (same(next, this.food)) {
      ate = true
      this.score += 10
      this.tickMs = Math.max(MIN_TICK_MS, START_TICK_MS - Math.floor(this.score / 40) * 8)
      this.food = randomEmpty(this.snake)
    } else {
      this.snake.pop()
    }
    this.expireStains(now)
    return ate
  }
}
