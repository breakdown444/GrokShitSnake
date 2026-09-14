export type Vec2 = { x: number; y: number }
export type Phase = 'ready' | 'playing' | 'paused' | 'dead'
export type Lump = {
  x: number
  y: number
  tx: number
  ty: number
  r: number
  seed: number
  along: number
}
export type Stain = {
  x: number
  y: number
  heading: number
  at: number
  seed: number
  scale: number
}

/** Landscape playfield, world units. Wider than tall so it fits a laptop. */
export const WORLD_W = 22
export const WORLD_H = 12.4
export const STAIN_MS = 3200
export const LUMP_SPACING = 0.4
export const START_LENGTH = 2.55
export const START_SPEED = 4.15
export const TURN_RATE = 3.05

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n))
}

function dist2(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

export class SnakeGame {
  heading = 0
  /** -1 left (CCW), +1 right (CW), 0 straight */
  turn = 0
  speed = START_SPEED
  head: Vec2 = { x: 0, y: 0 }
  trail: Vec2[] = []
  lumps: Lump[] = []
  food: Vec2 = { x: 4, y: 0 }
  length = START_LENGTH
  phase: Phase = 'ready'
  score = 0
  highScore = Number(localStorage.getItem('grok-shit-snake-high-score') ?? '0')
  stains: Stain[] = []
  private distSinceStain = 0
  private traveled = 0

  reset(): void {
    this.heading = 0
    this.turn = 0
    this.speed = START_SPEED
    this.head = { x: -4.2, y: 0 }
    this.length = START_LENGTH
    this.score = 0
    this.phase = 'ready'
    this.stains = []
    this.distSinceStain = 0
    this.traveled = 0
    this.trail = []
    const n = 28
    for (let i = 0; i < n; i++) {
      this.trail.push({ x: this.head.x - i * 0.12, y: this.head.y })
    }
    this.rebuildLumps()
    this.placeFood()
  }

  start(): void {
    if (this.phase === 'dead' || this.phase === 'ready') {
      this.reset()
      this.phase = 'playing'
    } else if (this.phase === 'paused') {
      this.phase = 'playing'
    }
  }

  togglePause(): void {
    if (this.phase === 'playing') this.phase = 'paused'
    else if (this.phase === 'paused') this.phase = 'playing'
  }

  expireStains(now: number): void {
    this.stains = this.stains.filter((s) => now - s.at < STAIN_MS)
  }

  private placeFood(): void {
    const pad = 1.35
    for (let attempt = 0; attempt < 40; attempt++) {
      const p = {
        x: (Math.random() * 2 - 1) * (WORLD_W / 2 - pad),
        y: (Math.random() * 2 - 1) * (WORLD_H / 2 - pad),
      }
      const hitBody = this.lumps.some((l) => dist2(p, l) < (l.r + 0.7) ** 2)
      if (!hitBody && dist2(p, this.head) > 2.8) {
        this.food = p
        return
      }
    }
    this.food = { x: 5.5, y: -2.2 }
  }

  private rebuildLumps(): void {
    const lumps: Lump[] = []
    if (this.trail.length < 2) {
      this.lumps = lumps
      return
    }
    let remain = 0
    let along = 0
    for (let i = 0; i < this.trail.length - 1 && along <= this.length; i++) {
      const a = this.trail[i]
      const b = this.trail[i + 1]
      const seg = Math.hypot(a.x - b.x, a.y - b.y)
      if (seg < 1e-6) continue
      let t = remain
      while (t <= seg && along <= this.length) {
        const u = t / seg
        const x = a.x + (b.x - a.x) * u
        const y = a.y + (b.y - a.y) * u
        let tx = a.x - b.x
        let ty = a.y - b.y
        const len = Math.hypot(tx, ty) || 1
        tx /= len
        ty /= len
        const taper = 1 - (along / Math.max(this.length, 0.001)) * 0.34
        const seed = (Math.sin(along * 17.13 + this.traveled * 0.01) * 10000) % 1
        lumps.push({
          x,
          y,
          tx,
          ty,
          r: 0.3 * taper * (0.88 + Math.abs(seed) * 0.28),
          seed: Math.abs(seed),
          along,
        })
        t += LUMP_SPACING
        along += LUMP_SPACING
      }
      remain = t - seg
    }
    this.lumps = lumps
  }

  private dropStain(now: number): void {
    this.stains.push({
      x: this.head.x,
      y: this.head.y,
      heading: this.heading,
      at: now,
      seed: Math.random(),
      scale: 0.55 + Math.random() * 0.55,
    })
    if (this.stains.length > 140) this.stains.splice(0, this.stains.length - 140)
  }

  update(dt: number, now: number): boolean {
    if (this.phase !== 'playing') return false
    dt = clamp(dt, 0, 0.05)

    this.heading += -this.turn * TURN_RATE * dt
    const dx = Math.cos(this.heading) * this.speed * dt
    const dy = Math.sin(this.heading) * this.speed * dt
    this.head.x += dx
    this.head.y += dy
    const step = Math.hypot(dx, dy)
    this.traveled += step
    this.distSinceStain += step

    this.trail.unshift({ x: this.head.x, y: this.head.y })
    let kept = 0
    let acc = 0
    for (let i = 1; i < this.trail.length; i++) {
      acc += Math.hypot(this.trail[i].x - this.trail[i - 1].x, this.trail[i].y - this.trail[i - 1].y)
      kept = i
      if (acc > this.length + 1.2) break
    }
    this.trail.length = Math.max(2, kept + 1)

    this.rebuildLumps()

    const hw = WORLD_W / 2 - 0.32
    const hh = WORLD_H / 2 - 0.32
    const hitWall = Math.abs(this.head.x) > hw || Math.abs(this.head.y) > hh
    let hitSelf = false
    for (let i = 8; i < this.lumps.length; i++) {
      const l = this.lumps[i]
      if (dist2(this.head, l) < (l.r * 0.78 + 0.12) ** 2) {
        hitSelf = true
        break
      }
    }

    if (hitWall || hitSelf) {
      this.phase = 'dead'
      if (this.score > this.highScore) {
        this.highScore = this.score
        localStorage.setItem('grok-shit-snake-high-score', String(this.highScore))
      }
      return false
    }

    if (this.distSinceStain > 0.22) {
      this.dropStain(now)
      this.distSinceStain = 0
    }
    this.expireStains(now)

    if (dist2(this.head, this.food) < 0.48 ** 2) {
      this.score += 10
      this.length += 0.52
      this.speed = Math.min(6.4, START_SPEED + this.score * 0.012)
      this.placeFood()
      return true
    }
    return false
  }
}
