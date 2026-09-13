import type { Direction, GameConfig, GameState, Point, Rng } from "./types.ts";

export const DEFAULT_CONFIG: GameConfig = {
  cols: 20,
  rows: 20,
  initialLength: 3,
};

export const BASE_TICK_MS = 160;
export const MIN_TICK_MS = 70;
const SPEEDUP_PER_FOOD_MS = 4;

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function tickMsForScore(score: number): number {
  return Math.max(MIN_TICK_MS, BASE_TICK_MS - score * SPEEDUP_PER_FOOD_MS);
}

function spawnFood(config: GameConfig, snake: Point[], rng: Rng): Point {
  const occupied = new Set(snake.map((p) => p.y * config.cols + p.x));
  const free: number[] = [];
  for (let cell = 0; cell < config.cols * config.rows; cell++) {
    if (!occupied.has(cell)) free.push(cell);
  }
  const cell = free[Math.floor(rng() * free.length)] ?? 0;
  return { x: cell % config.cols, y: Math.floor(cell / config.cols) };
}

export function createInitialState(
  config: GameConfig = DEFAULT_CONFIG,
  rng: Rng = Math.random,
): GameState {
  const headX = Math.floor(config.cols / 2);
  const headY = Math.floor(config.rows / 2);
  const snake: Point[] = Array.from({ length: config.initialLength }, (_, i) => ({
    x: headX - i,
    y: headY,
  }));
  return {
    config,
    snake,
    direction: "right",
    pendingDirection: null,
    food: spawnFood(config, snake, rng),
    score: 0,
    status: "idle",
    tickMs: BASE_TICK_MS,
  };
}

export function start(state: GameState): GameState {
  if (state.status !== "idle") return state;
  return { ...state, status: "running" };
}

export function togglePause(state: GameState): GameState {
  if (state.status === "running") return { ...state, status: "paused" };
  if (state.status === "paused") return { ...state, status: "running" };
  return state;
}

export function restart(state: GameState, rng: Rng = Math.random): GameState {
  return { ...createInitialState(state.config, rng), status: "running" };
}

export function changeDirection(state: GameState, direction: Direction): GameState {
  if (state.status !== "running") return state;
  const effective = state.pendingDirection ?? state.direction;
  if (direction === effective || direction === OPPOSITE[effective]) return state;
  return { ...state, pendingDirection: direction };
}

export function step(state: GameState, rng: Rng = Math.random): GameState {
  if (state.status !== "running") return state;

  const direction = state.pendingDirection ?? state.direction;
  const head = state.snake[0]!;
  const delta = DELTA[direction];
  const newHead: Point = { x: head.x + delta.x, y: head.y + delta.y };

  const { cols, rows } = state.config;
  const hitWall = newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows;
  const eats = newHead.x === state.food.x && newHead.y === state.food.y;

  // The tail cell frees up this tick unless the snake grows.
  const body = eats ? state.snake : state.snake.slice(0, -1);
  const hitSelf = body.some((s) => s.x === newHead.x && s.y === newHead.y);

  if (hitWall || hitSelf) {
    return { ...state, direction, pendingDirection: null, status: "game-over" };
  }

  const snake = [newHead, ...body];
  const score = eats ? state.score + 1 : state.score;
  return {
    ...state,
    snake,
    direction,
    pendingDirection: null,
    food: eats ? spawnFood(state.config, snake, rng) : state.food,
    score,
    tickMs: tickMsForScore(score),
  };
}
