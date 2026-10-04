# 🐍 Snake

[![Test and deploy](https://github.com/mchamow/snake/actions/workflows/deploy.yml/badge.svg)](https://github.com/mchamow/snake/actions/workflows/deploy.yml)

**Day 17 of [100 Days of React](https://github.com/mchamow?tab=repositories)**: Classic snake on a canvas with speed levels, wrap-around walls and saved high scores.

**Live demo:** https://mchamow.github.io/snake/

## Features

- **Canvas board**, 20×20, redrawn from React state on every move, with colours taken from CSS so it follows the light and dark themes
- **Responsive steering**: turns pressed between moves are buffered (up to two), so a quick up-then-left lands both turns, and reversing into yourself is ignored
- **Three speeds** (slow, normal, fast) and an optional **wrap-around walls** mode where leaving one edge brings you back on the other
- **Best score for each speed and wall mode**, with a "New best!" badge when you beat it
- **Pause** with <kbd>Space</kbd> or the header button. The game also pauses when you switch tabs
- **Touch play**: swipe across the board, or use the on-screen arrows, which show on touch screens and narrow windows
- **Keyboard play**: arrows or <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> steer (and start), <kbd>Space</kbd> starts, pauses and resumes, <kbd>R</kbd> restarts, <kbd>Space</kbd>/<kbd>Enter</kbd> play again after a game over
- The canvas has a text description (head position, length, food position) for screen readers, and game-over is announced
- Settings and best scores are saved to `localStorage`; corrupt or invalid saved data falls back to the defaults
- Light and dark themes that follow the system, and a layout that works on a 360px phone

## Tech

React 19 · TypeScript · Vite · Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (Base UI) · lucide icons · Vitest + Testing Library · deployed to GitHub Pages with GitHub Actions.

The game rules live in [`src/snake.ts`](src/snake.ts) as pure functions (`turn`, `step`, `placeFood`), wrapped by a reducer in [`src/session.ts`](src/session.ts) that also tracks settings and best scores. Randomness comes in through the actions, so the reducer stays pure and the tests can place food exactly where they want it. A `setInterval` at the chosen speed dispatches the moves, and [`src/draw.ts`](src/draw.ts) paints the canvas after each one.

## Run locally

```bash
pnpm install
pnpm dev
pnpm test   # 48 unit and component tests (Vitest)
```
