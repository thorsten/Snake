# 🌈 Rainbow Snake

A very colorful Snake clone built with React — installable as a PWA and fully
playable offline.

## Play

- **Steer:** arrow keys or WASD (or swipe on touch devices)
- **Pause:** space
- **Restart:** Enter (after game over)

The snake shimmers through the whole rainbow, speeds up as you eat, and your
best score is remembered locally — no account, no network needed. After the
first visit the service worker precaches everything, so the game keeps working
with no connection at all.

## Development

Requires Node 22+ and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev          # start the dev server
```

### Quality gates

| Command             | What it does                        |
| ------------------- | ----------------------------------- |
| `pnpm lint`         | Lint with [oxlint](https://oxc.rs)  |
| `pnpm format:check` | Verify formatting with oxfmt        |
| `pnpm typecheck`    | TypeScript project check (`tsc -b`) |
| `pnpm test`         | Unit tests with Vitest              |
| `pnpm e2e`          | End-to-end tests with Playwright    |
| `pnpm lighthouse`   | Lighthouse CI audit of the build    |
| `pnpm build`        | Typecheck + production build (PWA)  |

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org),
enforced locally by a commitlint hook (husky) and in CI.

All gates run in GitHub Actions on every push and pull request
(`.github/workflows/ci.yml`).

For the e2e tests you need the Playwright browser once:

```bash
pnpm exec playwright install chromium --with-deps
```

## Architecture

- `src/game/` — the pure, framework-free game engine (immutable state,
  injectable RNG, fully unit-tested). No React imports.
- `src/hooks/` — `useGame` (reducer around the engine, tracks the high
  score), `useGameLoop` (requestAnimationFrame tick accumulator), and
  `useControls` (keyboard + swipe).
- `src/components/` — `GameCanvas` (canvas renderer with animated HSL
  rainbow), `Hud` (score bar and overlays).
- Offline support via `vite-plugin-pwa` (Workbox precache + web manifest).

## License

[MIT](LICENSE)
