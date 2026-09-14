const FART_FILES = [
  'farts/breviceps-445997.mp3',
  'farts/breviceps-445998.mp3',
  'farts/breviceps-445999.mp3',
  'farts/breviceps-446000.mp3',
  'farts/breviceps-446001.mp3',
  'farts/studio-wet.mp3',
  'farts/studio-short.mp3',
  'farts/studio-flutter.mp3',
  'farts/studio-rumble.mp3',
]

let ctx: AudioContext | null = null
let farts: AudioBuffer[] = []
let theme: AudioBuffer | null = null
let themeGain: GainNode | null = null
let sfxGain: GainNode | null = null
let themeSrc: AudioBufferSourceNode | null = null
let ready = false
let loading: Promise<void> | null = null
let lastIndex = -1

function audio(): AudioContext | null {
  const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!C) return null
  if (!ctx) ctx = new C()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function asset(path: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}${path.replace(/^\//, '')}`
}

async function decode(ac: AudioContext, path: string): Promise<AudioBuffer> {
  const res = await fetch(asset(path))
  if (!res.ok) throw new Error(`Missing ${path}`)
  const data = await res.arrayBuffer()
  return ac.decodeAudioData(data.slice(0))
}

function startTheme(ac: AudioContext): void {
  if (!theme || !themeGain) return
  themeSrc?.stop()
  const src = ac.createBufferSource()
  src.buffer = theme
  src.loop = true
  src.connect(themeGain)
  src.start()
  themeSrc = src
}

async function loadAll(): Promise<void> {
  const ac = audio()
  if (!ac || ready) return
  themeGain = ac.createGain()
  themeGain.gain.value = 0.2
  themeGain.connect(ac.destination)
  sfxGain = ac.createGain()
  sfxGain.gain.value = 1
  sfxGain.connect(ac.destination)
  const loaded = await Promise.allSettled([
    ...FART_FILES.map((p) => decode(ac, p)),
    decode(ac, 'audio/theme.mp3'),
  ])
  for (let i = 0; i < FART_FILES.length; i++) {
    const item = loaded[i]
    if (item.status === 'fulfilled') farts.push(item.value)
  }
  const themeItem = loaded[loaded.length - 1]
  if (themeItem.status === 'fulfilled') theme = themeItem.value
  ready = true
  startTheme(ac)
}

export function unlockAudio(): void {
  const ac = audio()
  if (!ac) return
  if (!loading) loading = loadAll().catch((err) => console.warn(err))
}

function duck(seconds: number): void {
  if (!themeGain || !ctx) return
  const t = ctx.currentTime
  themeGain.gain.cancelScheduledValues(t)
  themeGain.gain.setValueAtTime(themeGain.gain.value, t)
  themeGain.gain.linearRampToValueAtTime(0.07, t + 0.03)
  themeGain.gain.linearRampToValueAtTime(0.2, t + Math.min(0.9, seconds + 0.18))
}

export function playFart(): void {
  const ac = audio()
  if (!ac) return
  void (loading ?? (loading = loadAll())).then(() => {
    if (!sfxGain || farts.length === 0) return
    let i = Math.floor(Math.random() * farts.length)
    if (i === lastIndex && farts.length > 1) i = (i + 1) % farts.length
    lastIndex = i
    const buf = farts[i]
    const src = ac.createBufferSource()
    src.buffer = buf
    src.playbackRate.value = 0.94 + Math.random() * 0.14
    const g = ac.createGain()
    g.gain.value = 0.88 + Math.random() * 0.14
    src.connect(g)
    g.connect(sfxGain)
    duck(buf.duration / src.playbackRate.value)
    src.start()
  })
}
