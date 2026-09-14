import { COLS, ROWS, STAIN_MS, type SnakeGame } from './game.ts'

export type VisualPoint = { x: number; y: number }

type Steam = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  born: number
  life: number
  size: number
  seed: number
}

const steam: Steam[] = []
const MAX_STEAM = 86

function frac(n: number): number {
  return n - Math.floor(n)
}

function rnd(x: number, y: number, k: number): number {
  return frac(Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453)
}

function midiish(n: number): number {
  return n - Math.floor(n)
}

export function resetFx(): void {
  steam.length = 0
}

function cellPx(ox: number, oy: number, cell: number, x: number, y: number): { cx: number; cy: number } {
  return { cx: ox + (x + 0.5) * cell, cy: oy + (y + 0.5) * cell }
}

function catmull(p0: VisualPoint, p1: VisualPoint, p2: VisualPoint, p3: VisualPoint, t: number): VisualPoint {
  const t2 = t * t
  const t3 = t2 * t
  return {
    x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  }
}

function spineOf(points: VisualPoint[], ox: number, oy: number, cell: number): { x: number; y: number; tx: number; ty: number; r: number }[] {
  if (points.length === 0) return []
  const pts = points.map((p) => cellPx(ox, oy, cell, p.x, p.y)).map((p) => ({ x: p.cx, y: p.cy }))
  if (pts.length === 1) return [{ x: pts[0].x, y: pts[0].y, tx: 1, ty: 0, r: cell * 0.7 }]
  const out: { x: number; y: number; tx: number; ty: number; r: number }[] = []
  const segs = pts.length - 1
  const per = pts.length > 40 ? 4 : 7
  for (let i = 0; i < segs; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    for (let s = 0; s < per; s++) {
      const t = s / per
      const a = catmull(p0, p1, p2, p3, t)
      const b = catmull(p0, p1, p2, p3, Math.min(1, t + 0.05))
      let tx = b.x - a.x
      let ty = b.y - a.y
      const len = Math.hypot(tx, ty) || 1
      tx /= len
      ty /= len
      const along = (i + t) / segs
      const r = cell * (0.72 - along * 0.28)
      out.push({ x: a.x, y: a.y, tx, ty, r })
    }
  }
  const tail = pts[pts.length - 1]
  const prev = pts[pts.length - 2]
  const tx = tail.x - prev.x
  const ty = tail.y - prev.y
  const len = Math.hypot(tx, ty) || 1
  out.push({ x: tail.x, y: tail.y, tx: tx / len, ty: ty / len, r: cell * 0.4 })
  return out
}

function drawFloor(ctx: CanvasRenderingContext2D, ox: number, oy: number, cell: number, w: number, h: number): void {
  ctx.fillStyle = '#08140e'
  ctx.fillRect(0, 0, w, h)
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const even = (x + y) % 2 === 0
      ctx.fillStyle = even ? '#102318' : '#0c1c13'
      ctx.fillRect(ox + x * cell, oy + y * cell, cell + 0.5, cell + 0.5)
    }
  }
  const glow = ctx.createRadialGradient(ox + cell * COLS * 0.5, oy + cell * ROWS * 0.42, cell * 4, ox + cell * COLS * 0.5, oy + cell * ROWS * 0.5, cell * COLS * 0.72)
  glow.addColorStop(0, 'rgba(36, 72, 48, 0.18)')
  glow.addColorStop(1, 'rgba(0, 0, 0, 0.38)')
  ctx.fillStyle = glow
  ctx.fillRect(ox, oy, cell * COLS, cell * ROWS)

  ctx.strokeStyle = 'rgba(90, 160, 110, 0.16)'
  ctx.lineWidth = Math.max(2, cell * 0.08)
  ctx.strokeRect(ox + 1, oy + 1, cell * COLS - 2, cell * ROWS - 2)
}

function drawStains(
  ctx: CanvasRenderingContext2D,
  game: SnakeGame,
  now: number,
  ox: number,
  oy: number,
  cell: number,
): void {
  for (const stain of game.stains) {
    const life = 1 - (now - stain.at) / STAIN_MS
    if (life <= 0) continue
    const a = cellPx(ox, oy, cell, stain.fromX, stain.fromY)
    const b = cellPx(ox, oy, cell, stain.x, stain.y)
    const s = stain.seed
    const wob = rnd(stain.x, stain.y, s)
    const steps = 5
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const cx = a.cx + (b.cx - a.cx) * t + (rnd(stain.x, stain.y, s + i) - 0.5) * cell * 0.22
      const cy = a.cy + (b.cy - a.cy) * t + (rnd(stain.x, stain.y, s + i + 9) - 0.5) * cell * 0.18
      const rad = cell * (0.55 + wob * 0.28) * (0.75 + t * 0.45)
      const g = ctx.createRadialGradient(cx, cy, rad * 0.12, cx, cy, rad)
      const fade = life * (0.55 - t * 0.12)
      g.addColorStop(0, `rgba(${88 + wob * 20}, ${52 + wob * 10}, 16, ${fade * 0.85})`)
      g.addColorStop(0.45, `rgba(${140 + wob * 30}, ${96 + wob * 16}, 28, ${fade * 0.42})`)
      g.addColorStop(1, 'rgba(170, 130, 50, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.ellipse(cx, cy, rad, rad * (0.62 + wob * 0.12), (wob - 0.5) * 1.1, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
    ctx.save()
    ctx.globalAlpha = life * 0.22
    ctx.fillStyle = `rgb(${190 + wob * 20}, ${150 + wob * 16}, 70)`
    ctx.beginPath()
    ctx.ellipse(b.cx, b.cy, cell * 0.38, cell * 0.22, wob, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

function tickSteam(spine: { x: number; y: number; tx: number; ty: number }[], now: number, playing: boolean, cell: number): void {
  if (playing && spine.length) {
    const spawn = 2
    for (let n = 0; n < spawn && steam.length < MAX_STEAM; n++) {
      const along = Math.random()
      const i = Math.min(spine.length - 1, Math.floor(along * spine.length))
      const p = spine[i]
      const behind = -p.tx * cell * (0.15 + Math.random() * 0.4)
      const side = (Math.random() - 0.5) * cell * 0.55
      steam.push({
        x: p.x + behind + -p.ty * side,
        y: p.y - p.ty * behind * 0.2 + p.tx * side,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.12,
        vy: -0.18 - Math.random() * 0.22,
        vz: (Math.random() - 0.5) * 0.01,
        born: now,
        life: 900 + Math.random() * 1100,
        size: cell * (0.14 + Math.random() * 0.18),
        seed: Math.random() * 100,
      })
    }
  }
  for (let i = steam.length - 1; i >= 0; i--) {
    const p = steam[i]
    const age = now - p.born
    if (age > p.life) {
      steam.splice(i, 1)
      continue
    }
    p.x += p.vx + Math.sin((now + p.seed * 40) / 280) * 0.12
    p.y += p.vy
    p.z = Math.max(0, Math.min(1, p.z + p.vz))
    p.vy *= 0.995
  }
}

function drawSteam(ctx: CanvasRenderingContext2D, now: number, layer: 'back' | 'front'): void {
  for (const p of steam) {
    const front = p.z >= 0.46
    if (layer === 'back' && front) continue
    if (layer === 'front' && !front) continue
    const t = 1 - (now - p.born) / p.life
    if (t <= 0) continue
    const depth = 0.45 + p.z * 0.9
    const alpha = t * (front ? 0.16 : 0.1) * (0.55 + p.z * 0.45)
    const rx = p.size * depth * (1.1 + (1 - t) * 0.8)
    const ry = rx * 1.45
    ctx.save()
    ctx.globalAlpha = alpha
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y - ry * 0.2, ry)
    g.addColorStop(0, 'rgba(230, 220, 200, 0.85)')
    g.addColorStop(0.45, 'rgba(196, 186, 168, 0.35)')
    g.addColorStop(1, 'rgba(160, 150, 130, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(p.x, p.y - (1 - p.z) * 3, rx, ry, Math.sin(p.seed) * 0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

function drawPoop(
  ctx: CanvasRenderingContext2D,
  spine: { x: number; y: number; tx: number; ty: number; r: number }[],
): void {
  for (let i = spine.length - 1; i >= 0; i--) {
    const p = spine[i]
    const nx = -p.ty
    const ny = p.tx
    const light = 0.55 + 0.45 * Math.max(0, nx * -0.55 + ny * -0.72)
    const cx = p.x + nx * p.r * 0.06
    const cy = p.y + p.r * 0.16
    const rx = p.r
    const ry = p.r * 0.72
    const rot = Math.atan2(p.ty, p.tx)

    ctx.save()
    ctx.fillStyle = 'rgba(12, 6, 2, 0.38)'
    ctx.beginPath()
    ctx.ellipse(p.x + 3, p.y + p.r * 0.42, rx * 1.05, ry * 0.55, rot * 0.15, 0, Math.PI * 2)
    ctx.fill()

    const body = ctx.createRadialGradient(cx - rx * 0.28, cy - ry * 0.38, rx * 0.08, cx, cy, rx * 1.15)
    const r = Math.round(78 + light * 58)
    const g = Math.round(46 + light * 38)
    const b = Math.round(18 + light * 14)
    body.addColorStop(0, `rgb(${Math.min(210, r + 48)}, ${Math.min(160, g + 36)}, ${b + 18})`)
    body.addColorStop(0.35, `rgb(${r + 18}, ${g + 10}, ${b + 6})`)
    body.addColorStop(0.72, `rgb(${Math.round(r * 0.78)}, ${Math.round(g * 0.72)}, ${Math.round(b * 0.7)})`)
    body.addColorStop(1, `rgb(${Math.round(r * 0.42)}, ${Math.round(g * 0.38)}, 10)`)
    ctx.fillStyle = body
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2)
    ctx.fill()

    if (i % 5 === 0) {
      ctx.strokeStyle = `rgba(40, 24, 12, ${0.18 + (1 - light) * 0.2})`
      ctx.lineWidth = Math.max(1, p.r * 0.06)
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx * 0.92, ry * 0.78, rot, -0.6, 0.6)
      ctx.stroke()
    }

    const spec = ctx.createRadialGradient(cx - rx * 0.32, cy - ry * 0.42, 0, cx - rx * 0.32, cy - ry * 0.42, rx * 0.45)
    spec.addColorStop(0, `rgba(232, 210, 170, ${0.16 + light * 0.18})`)
    spec.addColorStop(1, 'rgba(232, 210, 170, 0)')
    ctx.fillStyle = spec
    ctx.beginPath()
    ctx.ellipse(cx - rx * 0.18, cy - ry * 0.28, rx * 0.42, ry * 0.22, rot - 0.4, 0, Math.PI * 2)
    ctx.fill()

    const speck = rnd(p.x, p.y, i)
    if (speck > 0.62) {
      ctx.fillStyle = `rgba(40, 24, 10, ${0.12 + speck * 0.12})`
      ctx.beginPath()
      ctx.ellipse(cx + (speck - 0.75) * rx, cy + (midiish(speck * 7) - 0.5) * ry * 0.5, rx * 0.07, ry * 0.05, rot, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  const head = spine[0]
  if (head) {
    const hx = head.x + head.tx * head.r * 0.35
    const hy = head.y + head.ty * head.r * 0.35
    const cap = ctx.createRadialGradient(hx - head.r * 0.2, hy - head.r * 0.28, head.r * 0.05, hx, hy, head.r * 0.95)
    cap.addColorStop(0, 'rgb(176, 122, 68)')
    cap.addColorStop(0.45, 'rgb(122, 76, 38)')
    cap.addColorStop(1, 'rgb(52, 30, 14)')
    ctx.fillStyle = cap
    ctx.beginPath()
    ctx.ellipse(hx, hy + head.r * 0.1, head.r * 0.92, head.r * 0.7, Math.atan2(head.ty, head.tx), 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(236, 214, 168, 0.28)'
    ctx.beginPath()
    ctx.ellipse(hx - head.r * 0.22, hy - head.r * 0.22, head.r * 0.22, head.r * 0.12, -0.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawFood(ctx: CanvasRenderingContext2D, game: SnakeGame, now: number, ox: number, oy: number, cell: number): void {
  const { cx, cy } = cellPx(ox, oy, cell, game.food.x, game.food.y)
  const pulse = 0.5 + 0.5 * Math.sin(now / 180)
  const r = cell * (0.32 + pulse * 0.03)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.beginPath()
  ctx.ellipse(cx, cy + r * 0.55, r * 0.9, r * 0.35, 0, 0, Math.PI * 2)
  ctx.fill()
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.08, cx, cy, r)
  g.addColorStop(0, '#ffd0d8')
  g.addColorStop(0.35, '#ff5a76')
  g.addColorStop(1, '#8f1230')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
  ctx.beginPath()
  ctx.ellipse(cx - r * 0.28, cy - r * 0.32, r * 0.22, r * 0.14, -0.5, 0, Math.PI * 2)
  ctx.fill()
}

export function drawGame(
  ctx: CanvasRenderingContext2D,
  game: SnakeGame,
  now: number,
  visuals: VisualPoint[],
  playing: boolean,
): void {
  const { width, height } = ctx.canvas
  const cell = Math.min(width / COLS, height / ROWS)
  const ox = (width - cell * COLS) / 2
  const oy = (height - cell * ROWS) / 2

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  drawFloor(ctx, ox, oy, cell, width, height)
  game.expireStains(now)
  drawStains(ctx, game, now, ox, oy, cell)

  const spine = spineOf(visuals, ox, oy, cell)
  tickSteam(spine, now, playing, cell)
  drawSteam(ctx, now, 'back')
  drawFood(ctx, game, now, ox, oy, cell)
  drawPoop(ctx, spine)
  drawSteam(ctx, now, 'front')
}
