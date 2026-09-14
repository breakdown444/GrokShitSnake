import './style.css'
import { SnakeGame, type Dir } from './game.ts'
import { drawGame } from './render.ts'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <main class="cabinet">
    <header class="hud">
      <div>
        <p class="label">Score</p>
        <p id="score" class="value">0</p>
      </div>
      <div class="titleblock">
        <h1>GrokShitSnake 0.1.1</h1>
        <p class="credit">Proudly presented to you by Trashbird</p>
      </div>
      <div>
        <p class="label">Best</p>
        <p id="best" class="value">0</p>
      </div>
    </header>

    <div class="screen">
      <canvas id="board" width="1300" height="1300" aria-label="Snake board"></canvas>
      <div id="overlay" class="overlay">
        <p id="overlay-title">Ready</p>
        <p id="overlay-sub">Enter, tap, or mash GO. Try not to eat yourself.</p>
        <p id="you-suck" class="you-suck" hidden>YOU SUCK!</p>
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

    <p class="hint">Arrows / WASD to steer · Space to pause · Enter to start</p>
  </main>
`

const canvas = document.querySelector<HTMLCanvasElement>('#board')!
const ctx = canvas.getContext('2d')!
const scoreEl = document.querySelector('#score')!
const bestEl = document.querySelector('#best')!
const overlay = document.querySelector<HTMLDivElement>('#overlay')!
const overlayTitle = document.querySelector('#overlay-title')!
const overlaySub = document.querySelector('#overlay-sub')!
const youSuck = document.querySelector<HTMLParagraphElement>('#you-suck')!
const actionBtn = document.querySelector('#action')!

const game = new SnakeGame()
game.reset()

let lastTick = 0
let suckForDeath = false
let touchStart: { x: number; y: number } | null = null

function resizeCanvas(): void {
  const size = Math.min(1300, Math.floor(canvas.parentElement!.clientWidth))
  canvas.width = size
  canvas.height = size
}

function flashYouSuck(): void {
  youSuck.hidden = false
  youSuck.classList.remove('flash')
  void youSuck.offsetWidth
  youSuck.classList.add('flash')
}

function syncHud(): void {
  scoreEl.textContent = String(game.score)
  bestEl.textContent = String(game.highScore)
  actionBtn.textContent = game.phase === 'playing' ? 'II' : 'GO'

  if (game.phase === 'playing') {
    overlay.classList.add('hidden')
    youSuck.hidden = true
    youSuck.classList.remove('flash')
    suckForDeath = false
    return
  }
  overlay.classList.remove('hidden')
  if (game.phase === 'ready') {
    overlayTitle.textContent = 'Ready'
    overlaySub.textContent = 'Enter, tap, or mash GO. Try not to eat yourself.'
    youSuck.hidden = true
    youSuck.classList.remove('flash')
    suckForDeath = false
  } else if (game.phase === 'paused') {
    overlayTitle.textContent = 'Paused'
    overlaySub.textContent = 'Space or GO to continue'
    youSuck.hidden = true
    youSuck.classList.remove('flash')
  } else {
    overlayTitle.textContent = 'Game over'
    overlaySub.textContent = `Score ${game.score} · Enter to play again`
    if (!suckForDeath) {
      suckForDeath = true
      flashYouSuck()
    }
  }
}

function loop(now: number): void {
  if (game.phase === 'playing' && now - lastTick >= game.tickMs) {
    game.step(now)
    lastTick = now
    syncHud()
  }
  drawGame(ctx, game, now)
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
      game.start()
      lastTick = performance.now()
      syncHud()
    }
  })
}

function bindPad(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-dir]').forEach((btn) => {
    const dir = btn.dataset.dir as Dir
    const press = (event: Event) => {
      event.preventDefault()
      game.turn(dir)
      syncHud()
    }
    btn.addEventListener('click', press)
    btn.addEventListener('pointerdown', press)
  })

  actionBtn.addEventListener('click', () => {
    if (game.phase === 'playing') game.togglePause()
    else game.start()
    lastTick = performance.now()
    syncHud()
  })

  canvas.addEventListener('click', () => {
    if (game.phase !== 'playing') {
      game.start()
      lastTick = performance.now()
      syncHud()
    }
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
