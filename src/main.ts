import './style.css'
import { SnakeGame } from './game.ts'
import { GameRenderer } from './render.ts'
import { playFart, unlockAudio } from './audio.ts'

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <main class="handheld">
    <header class="hud">
      <div>
        <p class="label">Score</p>
        <p id="score" class="value">0</p>
      </div>
      <div class="titleblock">
        <p class="beta-pill">Beta</p>
        <h1>GrokShitSnake 0.1.6</h1>
        <p class="credit">Proudly presented to you by Trashbird</p>
        <p class="soul">Heart and soul edition. Next stop is 1.0.</p>
        <p class="versions"><a href="play/">All versions</a></p>
      </div>
      <div>
        <p class="label">Best</p>
        <p id="best" class="value">0</p>
      </div>
    </header>

    <div class="gear">
      <div class="wing left">
        <button type="button" id="turn-left" aria-label="Turn left">L</button>
        <div class="speaker" aria-hidden="true"></div>
        <button type="button" id="action" aria-label="Start or pause">GO</button>
      </div>
      <div class="screen">
        <canvas id="board" width="1280" height="720" aria-label="Poop field"></canvas>
        <div id="overlay" class="overlay">
          <p id="overlay-title">Beta</p>
          <p id="overlay-sub">The poo is 3D. The farts are real. Hold left and right like you mean it.</p>
        </div>
      </div>
      <div class="wing right">
        <div class="speaker" aria-hidden="true"></div>
        <button type="button" id="turn-right" aria-label="Turn right">R</button>
      </div>
    </div>

    <p class="hint">Hold ◀ / ▶ · A / D · mouse buttons · Enter to GO · Space to pause · this is the beta</p>
  </main>
`

const canvas = document.querySelector<HTMLCanvasElement>('#board')!
const scoreEl = document.querySelector('#score')!
const bestEl = document.querySelector('#best')!
const overlay = document.querySelector<HTMLDivElement>('#overlay')!
const overlayTitle = document.querySelector('#overlay-title')!
const overlaySub = document.querySelector('#overlay-sub')!
const actionBtn = document.querySelector('#action')!
const leftBtn = document.querySelector('#turn-left')!
const rightBtn = document.querySelector('#turn-right')!

const game = new SnakeGame()
game.reset()
const view = new GameRenderer(canvas)

let last = performance.now()
let leftHeld = false
let rightHeld = false
let mouseLeft = false
let mouseRight = false

function syncHud(): void {
  scoreEl.textContent = String(game.score)
  bestEl.textContent = String(game.highScore)
  actionBtn.textContent = game.phase === 'playing' ? 'II' : 'GO'
  overlay.classList.toggle('hidden', game.phase === 'playing')
  if (game.phase === 'playing') return
  if (game.phase === 'ready') {
    overlayTitle.textContent = 'Beta'
    overlaySub.textContent = 'The poo is 3D. The farts are real. Hold left and right like you mean it.'
  } else if (game.phase === 'paused') {
    overlayTitle.textContent = 'Bathroom break'
    overlaySub.textContent = 'Space or GO when you have the guts to continue.'
  } else {
    overlayTitle.textContent = 'Game over'
    overlaySub.textContent = `YOU SUCK!  Score ${game.score} · Enter if you've got another one in you`
  }
}

function applyTurn(): void {
  const left = leftHeld || mouseLeft
  const right = rightHeld || mouseRight
  if (left && !right) game.turn = -1
  else if (right && !left) game.turn = 1
  else game.turn = 0
}

function begin(): void {
  unlockAudio()
  game.start()
  last = performance.now()
  syncHud()
}

function loop(now: number): void {
  const dt = (now - last) / 1000
  last = now
  applyTurn()
  const ate = game.update(dt, now)
  if (ate) playFart()
  if (game.phase === 'dead') syncHud()
  view.sync(game, now, game.phase === 'playing')
  view.render()
  requestAnimationFrame(loop)
}

function hold(side: 'left' | 'right', down: boolean): void {
  unlockAudio()
  if (side === 'left') leftHeld = down
  else rightHeld = down
  applyTurn()
  if (down && game.phase === 'ready') begin()
}

function bindKeys(): void {
  window.addEventListener('keydown', (event) => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      event.preventDefault()
      hold('left', true)
    }
    if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      event.preventDefault()
      hold('right', true)
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
  window.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') hold('left', false)
    if (event.code === 'ArrowRight' || event.code === 'KeyD') hold('right', false)
  })
}

function bindButtons(): void {
  const bindHold = (el: Element, side: 'left' | 'right') => {
    el.addEventListener('pointerdown', (event) => {
      event.preventDefault()
      ;(el as HTMLElement).setPointerCapture((event as PointerEvent).pointerId)
      hold(side, true)
    })
    el.addEventListener('pointerup', () => hold(side, false))
    el.addEventListener('pointercancel', () => hold(side, false))
    el.addEventListener('lostpointercapture', () => hold(side, false))
  }
  bindHold(leftBtn, 'left')
  bindHold(rightBtn, 'right')

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
  canvas.addEventListener('contextmenu', (event) => event.preventDefault())
  canvas.addEventListener('pointerdown', (event) => {
    unlockAudio()
    if (game.phase === 'ready' || game.phase === 'dead') begin()
    if (game.phase !== 'playing') return
    event.preventDefault()
    if (event.button === 2) mouseRight = true
    else mouseLeft = true
    applyTurn()
  })
  window.addEventListener('pointerup', (event) => {
    if (event.button === 2) mouseRight = false
    else mouseLeft = false
    applyTurn()
  })
}

async function boot(): Promise<void> {
    overlayTitle.textContent = 'Warming up'
    overlaySub.textContent = 'Lighting the 3D poo. This is the beta. Treat it with love.'
  try {
    await view.init()
  } catch (err) {
    overlayTitle.textContent = 'Could not load'
    overlaySub.textContent = err instanceof Error ? err.message : 'Missing 3D assets'
    throw err
  }
  view.resize()
  window.addEventListener('resize', () => view.resize())
  bindKeys()
  bindButtons()
  syncHud()
  requestAnimationFrame((t) => {
    last = t
    loop(t)
  })
}

void boot()
