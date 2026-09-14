# Contributing

This is a small Vite + TypeScript + Three.js game. Frozen playable builds under `public/play/` are historical artifacts. Do not overwrite them.

## Setup

```bash
npm ci
npm run dev
```

Node 22+. Dev server binds `0.0.0.0:43180`.

## Checks

```bash
npm run typecheck
npm run build
```

## Layout

| Path | What |
| --- | --- |
| `src/game.ts` | Free-roam physics |
| `src/render.ts` | Three.js scene |
| `src/audio.ts` | Sample playback and theme |
| `src/main.ts` | Cabinet UI and input |
| `public/farts`, `public/audio`, `public/textures` | Runtime assets |
| `public/play/<version>/` | Frozen shipped builds |

Ship one version, finish it, then archive a copy into `public/play/<version>/` from `dist/` **without** nesting the older `/play` tree inside that copy.
