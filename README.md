# GrokShitSnake

Browser arcade Snake. Proudly presented to you by Trashbird.

[![Version](https://img.shields.io/badge/version-0.1.6--beta-yellow)](CHANGELOG.md)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
[![Play](https://img.shields.io/badge/play-live-3dff8a.svg)](https://breakdown444.github.io/GrokShitSnake/)

**0.1.6 Beta** is the current build. Next release is **1.0**.

Play: [breakdown444.github.io/GrokShitSnake](https://breakdown444.github.io/GrokShitSnake/)  
Archive: [every shipped version](https://breakdown444.github.io/GrokShitSnake/play/)

## What it is

A landscape handheld cabinet. The lead end of a lumpy 3D stool steers with left and right only. Eat the red pellets. Walls and your own body end the run. Farts are recordings. The theme is an original 48-second track, ducked under the farts.

## Controls

| Input | Action |
| --- | --- |
| Enter / GO | Start or restart |
| Hold Left / A / mouse 1 | Turn counterclockwise |
| Hold Right / D / mouse 2 | Turn clockwise |
| Space | Pause |

Sound unlocks on the first GO, key, or tap.

## Develop

Requires Node 22+.

```bash
npm ci
npm run dev
```

Open [http://127.0.0.1:43180](http://127.0.0.1:43180).

```bash
npm run typecheck
npm run build
npm run preview
```

`base` is `./` so GitHub Pages and the frozen `/play/<version>/` copies both resolve assets relatively.

## Layout

```
src/game.ts      free-roam physics, growth, collisions
src/render.ts    Three.js field, lumps, stains, lighting
src/audio.ts     decoded fart samples + looping theme
src/main.ts      cabinet chrome and input
public/farts     CC0 recordings + studio Foley
public/audio     theme
public/textures  poop / floor / smear maps
public/play      frozen playable builds (do not overwrite)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CHANGELOG.md](CHANGELOG.md).

## Versions

Nothing was deleted when the repo was renamed from `GrokShitSnake-0.1`. Live root is always latest. Older cabinets stay at `/play/<version>/`.

| Version | URL |
| --- | --- |
| **0.1.6 Beta** | [root](https://breakdown444.github.io/GrokShitSnake/) · [frozen](https://breakdown444.github.io/GrokShitSnake/play/0.1.6/) |
| 0.1.5 … 0.1 | [picker](https://breakdown444.github.io/GrokShitSnake/play/) |

Tags: [`v0.1.6`](https://github.com/breakdown444/GrokShitSnake/releases/tag/v0.1.6) through [`v0.1.0`](https://github.com/breakdown444/GrokShitSnake/releases/tag/v0.1.0).

## Credits

Audio and texture sources are in [CREDITS.md](CREDITS.md).

## License

[GPL-3.0](LICENSE).
