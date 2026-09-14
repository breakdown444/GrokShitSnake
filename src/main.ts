import './style.css'
import { SnakeGame, type Dir, type Point } from './game.ts'
import { drawGame, resetFx } from './render.ts'
import { playFart, unlockAudio } from './audio.ts'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <main class="cabinet">
    <header class="hud">
      <div>
        <p class="label">Score</p>
        <p id="score" class="value">0</p>
      </div>
      <div class="titleblock">
        <h1>GrokShitSnake 0.1.4</h1>
        <p class="credit">Proudly presented to you by Trashbird</p>
      </div>
      <div>
        <p class="label">Best</p>
        <p id="best" class="value">0</p>
      </div>
    </header>

    <div class="screen">
      <canvas id="board" width="1600" height="1600" aria-label="Snake board"></canvas>
      <div id="overlay" class="overlay">
        <p id="overlay-title">Ready</p>
        <p id="overlay-sub">Enter, tap, or mash GO. Try not to eat yourself.</p>
        <p id="you-suck" class="you-suck">YOU SUCK!</p>
      </div>
    </div>

    <div class="pad" aria-label="Direction pad">
      <button type="button" data-dir="up" aria-label="Up">▲</button>
      <div class="pad-mid">
        <button type="button" data-dir="left" aria-label="Left">◀</button>
        <button type="button" id="action" aria-label="Start or pause">GO</button>
        <button type="button" data-dir="right" aria-label="Right">▶</button>
      </div>
      <button type="button" data-dir="down" aria-label="Down">▼</button>
    </div>

    <p class="hint">Arrows / WASD to steer · Space to pause · Enter to start · Sound on first GO</p>
  </main>
`

const canvas = document.querySelector<HTMLCanvasElement>('#board')!
const ctx = canvas.getContext('2d', { alpha: false })!
const scoreEl = document.querySelector('#score')!
const bestEl = document.querySelector('#best')!
const overlay = document.querySelector<HTMLDivElement>('#overlay')!
const overlayTitle = document.querySelector('#overlay-title')!
const overlaySub = document.querySelector('#overlay-sub')!
const actionBtn = document.querySelector('#action')!

const game = new SnakeGame()
game.reset()

let lastTick = 0
let touchStart: { x: number; y: number } | null = null
let fromSnake: Point[] = game.snake.map((p) => ({ ...p }))
let toSnake: Point[] = game.snake.map((p) => ({ ...p }))

function copyPts(pts: Point[]): Point[] {
  return pts.map((p) => ({ x: p.x, y: p.y }))
}

function lockInterp(before: Point[], after: Point[]): void {
  fromSnake = after.length > before.length && before[0]
    ? [{ ...before[0] }, ...copyPts(before)]
    : copyPts(before.length ? before : after)
  toSnake = copyPts(after)
}

function visuals(now: number): Point[] {
  const t = game.phase === 'playing'
    ? Math.min(1, (now - lastTick) / game.tickMs)
    : 1
  const e = t * t * (3 - 2 * t)
  return toSnake.map((p, i) => {
    const a = fromSnake[i] ?? p
    return { x: a.x + (p.x - a.x) * e, y: a.y + (p.y - a.y) * e }
  })
}

function resizeCanvas(): void {
  const css = Math.min(1360, Math.floor(canvas.parentElement!.clientWidth))
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.style.width = `${css}px`
  canvas.style.height = `${css}px`
  canvas.width = Math.max(1, Math.floor(css * dpr))
  canvas.height = Math.max(1, Math.floor(css * dpr))
}

function syncHud(): void {
  scoreEl.textContent = String(game.score)
  bestEl.textContent = String(game.highScore)
  actionBtn.textContent = game.phase === 'playing' ? 'II' : 'GO'
  overlay.classList.toggle('hidden', game.phase === 'playing')
  overlay.classList.toggle('is-dead', game.phase === 'dead')

  if (game.phase === 'playing') {
    return
  }
  if (game.phase === 'ready') {
    overlayTitle.textContent = 'Ready'
    overlaySub.textContent = 'Enter, tap, or mash GO. Try not to eat yourself.'
  } else if (game.phase === 'paused') {
    overlayTitle.textContent = 'Paused'
    overlaySub.textContent = 'Space or GO to continue'
  } else {
    overlayTitle.textContent = 'Game over'
    overlaySub.textContent = `Score ${game.score} · Enter to play again`
  }
}

function begin(): void {
  unlockAudio()
  if (game.phase === 'paused') {
    game.start()
    syncHud()
    return
  }
  const before = copyPts(game.snake)
  game.start()
  lockInterp(before, game.snake)
  resetFx()
  lastTick = performance.now()
  syncHud()
}

function loop(now: number): void {
  if (game.phase === 'playing' && now - lastTick >= game.tickMs) {
    const before = copyPts(game.snake)
    const ate = game.step(now)
    lockInterp(before, game.snake)
    lastTick = now
    if (ate) playFart()
    syncHud()
  }
  drawGame(ctx, game, now, visuals(now), game.phase === 'playing')
  requestAnimationFrame(loop)
}

function bindKeys(): void {
  const map: Record<string, Dir> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    KeyW: 'up',
    KeyS: 'down',
    KeyA: 'left',
    KeyD: 'right',
  }

  window.addEventListener('keydown', (event) => {
    const dir = map[event.code]
    if (dir) {
      event.preventDefault()
      unlockAudio()
      game.turn(dir)
      syncHud()
      return
    }
    if (event.code === 'Space') {
      event.preventDefault()
      game.togglePause()
      syncHud()
    }
    if (event.code === 'Enter') {
      event.preventDefault()
      begin()
    }
  })
}

function bindPad(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach((btn) => {
    const dir = btn.dataset.dir as Dir
    const press = (event: Event) => {
      event.preventDefault()
      unlockAudio()
      game.turn(dir)
      syncHud()
    }
    btn.addEventListener('click', press)
    btn.addEventListener('pointerdown', press)
  })

  actionBtn.addEventListener('click', () => {
    unlockAudio()
    if (game.phase === 'playing') {
      game.togglePause()
      syncHud()
    } else {
      begin()
    }
  })

  canvas.addEventListener('click', () => {
    if (game.phase !== 'playing') begin()
  })
}

function bindSwipe(): void {
  canvas.addEventListener('touchstart', (event) => {
    const t = event.changedTouches[0]
    touchStart = { x: t.clientX, y: t.clientY }
  }, { passive: true })

  canvas.addEventListener('touchend', (event) => {
    if (!touchStart) return
    const t = event.changedTouches[0]
    const dx = t.clientX - touchStart.x
    const dy = t.clientY - touchStart.y
    touchStart = null
    if (Math.hypot(dx, dy) < 24) return
    unlockAudio()
    if (Math.abs(dx) > Math.abs(dy)) game.turn(dx > 0 ? 'right' : 'left')
    else game.turn(dy > 0 ? 'down' : 'up')
    syncHud()
  }, { passive: true })
}

resizeCanvas()
window.addEventListener('resize', resizeCanvas)
bindKeys()
bindPad()
bindSwipe()
syncHud()
requestAnimationFrame(loop)
