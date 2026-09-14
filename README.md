# GrokShitSnake

Browser arcade Snake. Proudly presented to you by Trashbird.

[![Version](https://img.shields.io/badge/version-0.1.6--beta-yellow)](CHANGELOG.md)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
[![Play](https://img.shields.io/badge/play-live-3dff8a.svg)](https://breakdown444.github.io/GrokShitSnake/)

**0.1.6-beta** is the current pre-release. Next is **1.0**.

Play: [breakdown444.github.io/GrokShitSnake](https://breakdown444.github.io/GrokShitSnake/)  
Archive: [Classic versions — play the OG](https://breakdown444.github.io/GrokShitSnake/play/)

## What it is

A landscape handheld, proudly presented to you by Trashbird. The lead end of a lumpy stool steers with left and right only, as a beast turns, not as a cursor hops. Eat the red. Walls and your own body end the run. The farts are of the flesh. The theme has a spine, and knows when to bow.

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

Nothing was deleted when the repo was renamed from `GrokShitSnake-0.1`. The live root is always the present age. Older cabinets sleep at `/play/<version>/`, and may be woken at will.

| Version | What it is | Play |
| --- | --- | --- |
| **0.1.6-beta** | The wandering stool. Pre-release. Next is 1.0. | [root](https://breakdown444.github.io/GrokShitSnake/) · [frozen](https://breakdown444.github.io/GrokShitSnake/play/0.1.6-beta/) |
| 0.1.5 | Death speaks in the subtitle. | [play](https://breakdown444.github.io/GrokShitSnake/play/0.1.5/) |
| 0.1.4 | The taunt upon the overlay. | [play](https://breakdown444.github.io/GrokShitSnake/play/0.1.4/) |
| 0.1.3 | A flash that would not flash. | [play](https://breakdown444.github.io/GrokShitSnake/play/0.1.3/) |
| 0.1.2 | Steam, and a machine’s idea of a fart. | [play](https://breakdown444.github.io/GrokShitSnake/play/0.1.2/) |
| 0.1.1 | The worm puts on flesh. | [play](https://breakdown444.github.io/GrokShitSnake/play/0.1.1/) |
| 0.1.0 | The first coil. | [play](https://breakdown444.github.io/GrokShitSnake/play/0.1/) |

Tags: [`v0.1.6-beta`](https://github.com/breakdown444/GrokShitSnake/releases/tag/v0.1.6-beta) · [`v0.1.5`](https://github.com/breakdown444/GrokShitSnake/releases/tag/v0.1.5) · [`v0.1.4`](https://github.com/breakdown444/GrokShitSnake/releases/tag/v0.1.4) · [`v0.1.3`](https://github.com/breakdown444/GrokShitSnake/releases/tag/v0.1.3) · [`v0.1.2`](https://github.com/breakdown444/GrokShitSnake/releases/tag/v0.1.2) · [`v0.1.1`](https://github.com/breakdown444/GrokShitSnake/releases/tag/v0.1.1) · [`v0.1.0`](https://github.com/breakdown444/GrokShitSnake/releases/tag/v0.1.0).

## Credits

Audio and texture sources are in [CREDITS.md](CREDITS.md).

## License

[GPL-3.0](LICENSE).
