type FartKind =
  | 'squeak'
  | 'toot'
  | 'rip'
  | 'wet'
  | 'flutter'
  | 'rumble'
  | 'long'

const KINDS: FartKind[] = ['squeak', 'toot', 'rip', 'wet', 'flutter', 'rumble', 'long']

let ctx: AudioContext | null = null
let lastKind = -1

function audio(): AudioContext | null {
  const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!C) return null
  if (!ctx) ctx = new C()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function unlockAudio(): void {
  audio()
  startMusic()
}

let musicGain: GainNode | null = null
let musicStarted = false
let musicStep = 0
let nextNote = 0

function midi(n: number): number {
  return 440 * 2 ** ((n - 69) / 12)
}

const BPM = 108
const EIGHTH = 60 / BPM / 2
const BASS = [41, 0, 48, 0, 41, 0, 48, 36, 43, 0, 50, 0, 41, 0, 48, 0]
const TUNE = [72, 76, 79, 76, 77, 74, 72, 69, 72, 69, 65, 67, 69, 72, 74, 72]
const HONK = [0, 0, 84, 0, 0, 83, 0, 0, 0, 84, 0, 0, 79, 0, 76, 0]

function tone(
  ac: AudioContext,
  dest: AudioNode,
  type: OscillatorType,
  freq: number,
  t0: number,
  dur: number,
  peak: number,
  filterHz: number,
): void {
  if (freq <= 0) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  const filter = ac.createBiquadFilter()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  filter.type = 'lowpass'
  filter.frequency.value = filterHz
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(dest)
  env(ac, gain.gain, t0, peak, dur, 0.02)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function tickMusic(ac: AudioContext): void {
  if (!musicGain) return
  const look = 0.18
  while (nextNote < ac.currentTime + look) {
    const i = musicStep % 16
    const t0 = nextNote
    const bass = BASS[i]
    if (bass) tone(ac, musicGain, 'triangle', midi(bass), t0, EIGHTH * 1.6, 0.045, 280)
    const n = TUNE[i]
    if (n) tone(ac, musicGain, 'square', midi(n), t0, EIGHTH * 0.92, 0.028, 1400)
    const h = HONK[i]
    if (h) tone(ac, musicGain, 'sawtooth', midi(h), t0, EIGHTH * 0.55, 0.016, 2200)
    if (i % 4 === 2) {
      const noise = ac.createBufferSource()
      const ng = ac.createGain()
      const f = ac.createBiquadFilter()
      f.type = 'highpass'
      f.frequency.value = 1800
      noise.buffer = noiseBuffer(ac, 0.05)
      noise.connect(f)
      f.connect(ng)
      ng.connect(musicGain)
      env(ac, ng.gain, t0, 0.03, 0.04, 0.005)
      noise.start(t0)
      noise.stop(t0 + 0.05)
    }
    nextNote += EIGHTH
    musicStep += 1
  }
}

export function startMusic(): void {
  const ac = audio()
  if (!ac || musicStarted) return
  musicStarted = true
  musicGain = ac.createGain()
  musicGain.gain.value = 0.11
  musicGain.connect(ac.destination)
  nextNote = ac.currentTime + 0.05
  musicStep = 0
  tickMusic(ac)
  window.setInterval(() => tickMusic(ac), 80)
}

function duckMusic(seconds: number): void {
  if (!musicGain || !ctx) return
  const t = ctx.currentTime
  musicGain.gain.cancelScheduledValues(t)
  musicGain.gain.setValueAtTime(musicGain.gain.value, t)
  musicGain.gain.linearRampToValueAtTime(0.035, t + 0.02)
  musicGain.gain.linearRampToValueAtTime(0.11, t + Math.min(0.55, seconds + 0.12))
}

function noiseBuffer(ac: AudioContext, seconds: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ac.sampleRate * seconds))
  const buffer = ac.createBuffer(1, length, ac.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    last = last * 0.82 + white * 0.18
    data[i] = last
  }
  return buffer
}

function env(_ac: AudioContext, param: AudioParam, start: number, peak: number, dur: number, peakAt = 0.04): void {
  param.cancelScheduledValues(start)
  param.setValueAtTime(0.0001, start)
  param.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + Math.min(peakAt, dur * 0.35))
  param.exponentialRampToValueAtTime(0.0001, start + dur)
}

function pickKind(): FartKind {
  let i = Math.floor(Math.random() * KINDS.length)
  if (i === lastKind) i = (i + 1 + Math.floor(Math.random() * (KINDS.length - 1))) % KINDS.length
  lastKind = i
  return KINDS[i]
}

export function playFart(): void {
  const ac = audio()
  if (!ac) return
  const t0 = ac.currentTime + 0.01
  const kind = pickKind()

  const master = ac.createGain()
  master.gain.value = 0.7
  master.connect(ac.destination)

  const noise = ac.createBufferSource()
  const nGain = ac.createGain()
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  noise.connect(filter)
  filter.connect(nGain)
  nGain.connect(master)

  const osc = ac.createOscillator()
  const oGain = ac.createGain()
  const oFilter = ac.createBiquadFilter()
  oFilter.type = 'lowpass'
  osc.connect(oFilter)
  oFilter.connect(oGain)
  oGain.connect(master)

  let dur = 0.2
  osc.type = 'sawtooth'

  switch (kind) {
    case 'squeak':
      dur = 0.09 + Math.random() * 0.04
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(720 + Math.random() * 280, t0)
      osc.frequency.exponentialRampToValueAtTime(320 + Math.random() * 80, t0 + dur)
      oFilter.frequency.value = 1800
      filter.frequency.value = 1400
      env(ac, oGain.gain, t0, 0.11, dur, 0.012)
      env(ac, nGain.gain, t0, 0.04, dur, 0.01)
      break
    case 'toot':
      dur = 0.13 + Math.random() * 0.05
      osc.type = 'sine'
      osc.frequency.setValueAtTime(240 + Math.random() * 70, t0)
      osc.frequency.exponentialRampToValueAtTime(110 + Math.random() * 30, t0 + dur)
      oFilter.frequency.value = 700
      filter.frequency.value = 500
      env(ac, oGain.gain, t0, 0.16, dur, 0.02)
      env(ac, nGain.gain, t0, 0.05, dur, 0.02)
      break
    case 'rip':
      dur = 0.11 + Math.random() * 0.05
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(420 + Math.random() * 90, t0)
      osc.frequency.exponentialRampToValueAtTime(90 + Math.random() * 25, t0 + dur)
      oFilter.frequency.setValueAtTime(1600, t0)
      oFilter.frequency.exponentialRampToValueAtTime(280, t0 + dur)
      filter.frequency.value = 900
      env(ac, oGain.gain, t0, 0.12, dur, 0.015)
      env(ac, nGain.gain, t0, 0.08, dur, 0.015)
      break
    case 'wet':
      dur = 0.24 + Math.random() * 0.1
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(130 + Math.random() * 40, t0)
      osc.frequency.exponentialRampToValueAtTime(58 + Math.random() * 14, t0 + dur)
      oFilter.frequency.value = 420
      filter.type = 'lowpass'
      filter.Q.value = 2.4
      filter.frequency.setValueAtTime(700, t0)
      filter.frequency.exponentialRampToValueAtTime(180, t0 + dur)
      env(ac, oGain.gain, t0, 0.09, dur, 0.04)
      env(ac, nGain.gain, t0, 0.2, dur, 0.05)
      break
    case 'flutter': {
      dur = 0.2 + Math.random() * 0.08
      osc.type = 'square'
      osc.frequency.setValueAtTime(180 + Math.random() * 50, t0)
      osc.frequency.exponentialRampToValueAtTime(95, t0 + dur)
      oFilter.frequency.value = 500
      filter.frequency.value = 600
      env(ac, nGain.gain, t0, 0.07, dur, 0.03)
      const lfo = ac.createOscillator()
      const lfoGain = ac.createGain()
      lfo.frequency.value = 18 + Math.random() * 10
      lfoGain.gain.value = 0.07
      lfo.connect(lfoGain)
      lfoGain.connect(oGain.gain)
      oGain.gain.setValueAtTime(0.08, t0)
      oGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
      lfo.start(t0)
      lfo.stop(t0 + dur + 0.02)
      break
    }
    case 'rumble':
      dur = 0.38 + Math.random() * 0.12
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(78 + Math.random() * 18, t0)
      osc.frequency.exponentialRampToValueAtTime(36 + Math.random() * 8, t0 + dur)
      oFilter.frequency.value = 220
      oFilter.Q.value = 1.2
      filter.frequency.setValueAtTime(320, t0)
      filter.frequency.exponentialRampToValueAtTime(90, t0 + dur)
      env(ac, oGain.gain, t0, 0.14, dur, 0.06)
      env(ac, nGain.gain, t0, 0.16, dur, 0.08)
      break
    case 'long':
      dur = 0.48 + Math.random() * 0.14
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(96 + Math.random() * 20, t0)
      osc.frequency.linearRampToValueAtTime(42 + Math.random() * 8, t0 + dur)
      oFilter.frequency.value = 260
      filter.frequency.setValueAtTime(400, t0)
      filter.frequency.exponentialRampToValueAtTime(80, t0 + dur)
      env(ac, oGain.gain, t0, 0.1, dur, 0.08)
      env(ac, nGain.gain, t0, 0.12, dur, 0.1)
      break
  }

  duckMusic(dur)
  noise.buffer = noiseBuffer(ac, dur + 0.05)
  noise.start(t0)
  noise.stop(t0 + dur + 0.02)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}
