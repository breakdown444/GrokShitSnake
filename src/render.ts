import { COLS, ROWS, STAIN_MS, type Point, type SnakeGame } from './game.ts'

function frac(n: number): number {
  return n - Math.floor(n)
}

function rnd(x: number, y: number, k: number): number {
  return frac(Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453)
}

function ellipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot = 0,
): void {
  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2)
}

function cellCenter(ox: number, oy: number, cell: number, p: Point): { cx: number; cy: number } {
  return {
    cx: ox + (p.x + 0.5) * cell,
    cy: oy + (p.y + 0.5) * cell,
  }
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
    const { cx, cy } = cellCenter(ox, oy, cell, stain)
    const wobble = rnd(stain.x, stain.y, 1)
    ctx.save()
    ctx.globalAlpha = life * 0.52
    ctx.fillStyle = `rgb(${92 + wobble * 28}, ${58 + wobble * 10}, ${18})`
    ellipse(
      ctx,
      cx + (wobble - 0.5) * cell * 0.12,
      cy + (rnd(stain.x, stain.y, 2) - 0.5) * cell * 0.1,
      cell * (0.42 + wobble * 0.16),
      cell * (0.28 + rnd(stain.x, stain.y, 3) * 0.12),
      (wobble - 0.5) * 0.9,
    )
    ctx.fill()
    ctx.fillStyle = `rgba(58, 34, 12, ${life * 0.35})`
    ellipse(
      ctx,
      cx + cell * 0.08,
      cy + cell * 0.06,
      cell * 0.22,
      cell * 0.16,
      wobble,
    )
    ctx.fill()
    ctx.restore()
  }
}

function drawTurd(
  ctx: CanvasRenderingContext2D,
  seg: Point,
  i: number,
  isHead: boolean,
  ox: number,
  oy: number,
  cell: number,
): void {
  const { cx, cy } = cellCenter(ox, oy, cell, seg)
  const a = rnd(seg.x, seg.y, i)
  const b = rnd(seg.x, seg.y, i + 9)
  const scale = isHead ? 1.08 : 0.92 + a * 0.12
  const brown = 58 + Math.round(a * 36)
  const red = 78 + Math.round(b * 28)

  ctx.save()
  ctx.fillStyle = '#24150e'
  ellipse(ctx, cx, cy + cell * 0.07, cell * 0.46 * scale, cell * 0.34 * scale, (a - 0.5) * 0.5)
  ctx.fill()

  ctx.fillStyle = `rgb(${red}, ${brown}, ${16 + Math.round(a * 8)})`
  ellipse(ctx, cx, cy, cell * 0.44 * scale, cell * 0.33 * scale, (a - 0.5) * 0.55)
  ctx.fill()

  for (let k = 0; k < 3; k++) {
    const u = rnd(seg.x, seg.y, i * 3 + k)
    const v = rnd(seg.x, seg.y, i * 5 + k + 4)
    ctx.fillStyle = `rgb(${70 + Math.round(u * 40)}, ${38 + Math.round(v * 18)}, 14)`
    ellipse(
      ctx,
      cx + (u - 0.5) * cell * 0.28,
      cy + (v - 0.5) * cell * 0.22,
      cell * (0.16 + u * 0.1) * scale,
      cell * (0.12 + v * 0.08) * scale,
      (u - 0.5) * 1.2,
    )
    ctx.fill()
  }

  ctx.fillStyle = isHead ? 'rgba(210, 176, 122, 0.38)' : 'rgba(186, 150, 96, 0.22)'
  ellipse(
    ctx,
    cx - cell * 0.12,
    cy - cell * 0.12,
    cell * 0.14 * scale,
    cell * 0.08 * scale,
    -0.5,
  )
  ctx.fill()
  ctx.restore()
}

export function drawGame(
  ctx: CanvasRenderingContext2D,
  game: SnakeGame,
  now: number,
): void {
  const { width, height } = ctx.canvas
  const cell = Math.min(width / COLS, height / ROWS)
  const ox = (width - cell * COLS) / 2
  const oy = (height - cell * ROWS) / 2

  ctx.fillStyle = '#07140c'
  ctx.fillRect(0, 0, width, height)

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#0b1c12' : '#0a1910'
      ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell)
    }
  }

  ctx.strokeStyle = 'rgba(61, 255, 138, 0.08)'
  ctx.lineWidth = 1
  ctx.strokeRect(ox + 0.5, oy + 0.5, cell * COLS - 1, cell * ROWS - 1)

  game.expireStains(now)
  drawStains(ctx, game, now, ox, oy, cell)

  const pulse = 0.5 + 0.5 * Math.sin(now / 180)
  const foodX = ox + game.food.x * cell
  const foodY = oy + game.food.y * cell
  const pad = cell * 0.18
  ctx.shadowColor = `rgba(255, 77, 109, ${0.45 + pulse * 0.35})`
  ctx.shadowBlur = 12 + pulse * 8
  ctx.fillStyle = '#ff4d6d'
  ctx.beginPath()
  ctx.arc(foodX + cell / 2, foodY + cell / 2, cell / 2 - pad, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle = '#ffe1e6'
  ctx.beginPath()
  ctx.arc(foodX + cell * 0.4, foodY + cell * 0.38, cell * 0.1, 0, Math.PI * 2)
  ctx.fill()

  for (let i = game.snake.length - 1; i >= 0; i--) {
    drawTurd(ctx, game.snake[i], i, i === 0, ox, oy, cell)
  }

  const head = game.snake[0]
  if (head) {
    const hx = ox + head.x * cell
    const hy = oy + head.y * cell
    const eye = cell * 0.11
    const offsets = {
      right: [
        [0.62, 0.32],
        [0.62, 0.62],
      ],
      left: [
        [0.28, 0.32],
        [0.28, 0.62],
      ],
      up: [
        [0.32, 0.28],
        [0.62, 0.28],
      ],
      down: [
        [0.32, 0.62],
        [0.62, 0.62],
      ],
    }[game.dir]
    ctx.fillStyle = '#1a0e08'
    for (const [ex, ey] of offsets) {
      ctx.beginPath()
      ctx.arc(hx + cell * ex, hy + cell * ey, eye, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = 'rgba(232, 196, 120, 0.7)'
    for (const [ex, ey] of offsets) {
      ctx.beginPath()
      ctx.arc(hx + cell * ex - eye * 0.25, hy + cell * ey - eye * 0.25, eye * 0.28, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
