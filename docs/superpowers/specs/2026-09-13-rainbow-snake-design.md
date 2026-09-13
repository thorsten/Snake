# Rainbow Snake — Design

Date: 2026-09-13
Status: Approved for autonomous implementation (user request was fully specified; session runs unattended)

## Goal

A colorful, rainbow-themed Snake clone as a React single-page app that is
installable and fully playable offline (PWA), with a complete quality-gate
toolchain (oxlint, oxfmt, typechecks, Vitest, Playwright) enforced by GitHub
Actions.

## Constraints & requirements (from the request)

- React, latest stable version, modern architecture
- Playable offline
- Very colorful, rainbow colors
- Tooling: oxlint, oxfmt, Vitest, Playwright, TypeScript typechecks
- GitHub Actions running all quality gates

## Architecture

Two strictly separated layers:

### 1. Game core — `src/game/` (pure TypeScript, zero React imports)

- `types.ts` — `Point`, `Direction`, `GameState` (snake segments, direction,
  queued direction, food, score, status: `idle | running | paused | game-over`),
  board dimensions.
- `engine.ts` — pure functions:
  - `createInitialState(config, rng)` — deterministic given an injected RNG
  - `step(state, rng)` — advances one tick: move, wall/self collision,
    eat & grow, spawn food on a free cell
  - `changeDirection(state, dir)` — queues a turn, rejects 180° reversals
  - `togglePause(state)`, `restart(state, rng)`
- RNG is injected (`() => number`) so tests are deterministic.
- Speed increases slightly as the score grows (capped).

### 2. React layer — `src/`

- React 19, function components only.
- `useGame` — wraps the core in `useReducer`; actions: `TICK`, `TURN`,
  `START`, `PAUSE`, `RESTART`.
- `useGameLoop` — `requestAnimationFrame` loop with an accumulator so the
  game ticks at the state's current interval; pauses when tab is hidden.
- `useKeyboard` / `useSwipe` — arrows + WASD + space (pause) + touch swipe.
- `GameCanvas` — renders board to `<canvas>`; snake drawn with HSL hue
  cycling along its segments plus a time-based hue shift (animated rainbow),
  rounded segments, glow on the head; food as a pulsing multicolor dot.
- `Hud` — score, high score (localStorage), status overlays (start, paused,
  game over) with rainbow gradient typography.
- `App` — composition only.

### Offline / PWA

- `vite-plugin-pwa` with `registerType: 'autoUpdate'`, precaching all built
  assets, web manifest (name, theme color, icons). App is fully client-side;
  after first visit it loads and plays with no network.

## Testing

- **Vitest** (jsdom not required for core; plain node env) — engine unit
  tests: movement, growth, collision (walls, self), food never spawns on the
  snake, direction-reversal rejection, scoring, pause/restart, speed curve.
  Hook/reducer tests with `@testing-library/react` where valuable.
- **Playwright** — e2e against the production build (`vite preview`):
  start screen renders, game starts, snake moves (canvas changes), keyboard
  steering works, game over + restart flow, high score persists after reload,
  service worker registered.

## Quality gates & CI

`package.json` scripts: `lint` (oxlint), `format:check` (oxfmt),
`typecheck` (tsc --noEmit), `test` (vitest run), `e2e` (playwright test),
`build`.

GitHub Actions `ci.yml` on push/PR: parallel jobs — lint, format, typecheck,
unit tests, and e2e (build + Playwright with browser cache). All must pass.

## Out of scope (YAGNI)

Multiplayer, sound, levels/obstacles, gamepad support, backend/leaderboard,
i18n.
