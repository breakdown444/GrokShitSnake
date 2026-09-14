import { COLS, ROWS, type SnakeGame } from './game.ts'

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
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

  game.snake.forEach((seg, i) => {
    const t = i / Math.max(game.snake.length - 1, 1)
    const g = Math.round(255 - t * 90)
    const b = Math.round(138 - t * 60)
    ctx.fillStyle = i === 0 ? '#b8ffd4' : `rgb(46, ${g}, ${b})`
    ctx.shadowColor = i === 0 ? 'rgba(61, 255, 138, 0.55)' : 'transparent'
    ctx.shadowBlur = i === 0 ? 14 : 0
    roundRect(
      ctx,
      ox + seg.x * cell + cell * 0.08,
      oy + seg.y * cell + cell * 0.08,
      cell * 0.84,
      cell * 0.84,
      cell * 0.22,
    )
    ctx.fill()
    ctx.shadowBlur = 0
  })

  const head = game.snake[0]
  if (head) {
    const hx = ox + head.x * cell
    const hy = oy + head.y * cell
    const eye = cell * 0.12
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
    ctx.fillStyle = '#07140c'
    for (const [ex, ey] of offsets) {
      ctx.beginPath()
      ctx.arc(hx + cell * ex, hy + cell * ey, eye, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}
