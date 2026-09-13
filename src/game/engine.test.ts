import { describe, expect, it } from "vitest";
import {
  BASE_TICK_MS,
  changeDirection,
  createInitialState,
  DEFAULT_CONFIG,
  MIN_TICK_MS,
  restart,
  start,
  step,
  togglePause,
} from "./engine.ts";
import type { GameState, Rng } from "./types.ts";

const rngZero: Rng = () => 0;

function runningState(overrides: Partial<GameState> = {}): GameState {
  return { ...start(createInitialState(DEFAULT_CONFIG, rngZero)), ...overrides };
}

describe("createInitialState", () => {
  it("places the snake horizontally centered with the configured length", () => {
    const state = createInitialState(DEFAULT_CONFIG, rngZero);
    expect(state.snake).toHaveLength(DEFAULT_CONFIG.initialLength);
    expect(state.direction).toBe("right");
    expect(state.status).toBe("idle");
    expect(state.score).toBe(0);
    // contiguous, head first, moving right
    const [head, ...rest] = state.snake;
    rest.forEach((seg, i) => {
      expect(seg).toEqual({ x: head!.x - (i + 1), y: head!.y });
    });
  });

  it("never spawns food on the snake", () => {
    // rngZero would pick cell (0,0) repeatedly; engine must skip occupied cells
    const state = createInitialState({ cols: 4, rows: 1, initialLength: 3 }, rngZero);
    const onSnake = state.snake.some((s) => s.x === state.food.x && s.y === state.food.y);
    expect(onSnake).toBe(false);
  });
});

describe("step", () => {
  it("moves the snake one cell in the current direction", () => {
    const state = runningState();
    const next = step(state, rngZero);
    expect(next.snake[0]).toEqual({ x: state.snake[0]!.x + 1, y: state.snake[0]!.y });
    expect(next.snake).toHaveLength(state.snake.length);
  });

  it("does nothing unless running", () => {
    const idle = createInitialState(DEFAULT_CONFIG, rngZero);
    expect(step(idle, rngZero)).toBe(idle);
    const paused = togglePause(runningState());
    expect(step(paused, rngZero)).toBe(paused);
  });

  it("applies the pending direction on the next tick", () => {
    const state = changeDirection(runningState(), "up");
    const next = step(state, rngZero);
    expect(next.snake[0]).toEqual({ x: state.snake[0]!.x, y: state.snake[0]!.y - 1 });
    expect(next.direction).toBe("up");
    expect(next.pendingDirection).toBeNull();
  });

  it("grows and scores when eating food", () => {
    const base = runningState();
    const head = base.snake[0]!;
    const state = { ...base, food: { x: head.x + 1, y: head.y } };
    const next = step(state, rngZero);
    expect(next.score).toBe(1);
    expect(next.snake).toHaveLength(state.snake.length + 1);
    expect(next.food).not.toEqual(state.food);
  });

  it("spawns new food only on free cells", () => {
    const base = runningState();
    const head = base.snake[0]!;
    const state = { ...base, food: { x: head.x + 1, y: head.y } };
    const next = step(state, rngZero);
    const onSnake = next.snake.some((s) => s.x === next.food.x && s.y === next.food.y);
    expect(onSnake).toBe(false);
  });

  it("ends the game when hitting a wall", () => {
    const base = runningState();
    const head = base.snake[0]!;
    let state = base;
    for (let x = head.x; x < state.config.cols - 1; x++) {
      state = step(state, rngZero);
      expect(state.status).toBe("running");
    }
    state = step(state, rngZero);
    expect(state.status).toBe("game-over");
  });

  it("ends the game when the snake bites itself", () => {
    // U-shaped snake: turning down sends the head into its own body at (5,6),
    // a cell that does not vacate this tick (the tail is at (6,6)).
    const base = runningState();
    const snake = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 4, y: 6 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
    ];
    const state: GameState = { ...base, snake, direction: "right" };
    const next = step(changeDirection(state, "down"), rngZero);
    expect(next.status).toBe("game-over");
  });

  it("allows moving into the cell the tail is leaving", () => {
    const base = runningState();
    // square shape: head will move into the tail's old cell
    const snake = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 4, y: 6 },
      { x: 5, y: 6 },
    ];
    let state: GameState = { ...base, snake, direction: "right" };
    state = step(changeDirection(state, "down"), rngZero);
    expect(state.status).toBe("running");
  });

  it("speeds up as the score grows but never below the minimum", () => {
    let state = runningState({ score: 0 });
    const head = state.snake[0]!;
    state = { ...state, food: { x: head.x + 1, y: head.y } };
    const next = step(state, rngZero);
    expect(next.tickMs).toBeLessThan(BASE_TICK_MS);

    const fast = runningState({ score: 1000 });
    const fastHead = fast.snake[0]!;
    const eaten = step({ ...fast, food: { x: fastHead.x + 1, y: fastHead.y } }, rngZero);
    expect(eaten.tickMs).toBe(MIN_TICK_MS);
  });
});

describe("changeDirection", () => {
  it("rejects reversing into the snake", () => {
    const state = runningState(); // moving right
    expect(changeDirection(state, "left").pendingDirection).toBeNull();
    expect(changeDirection(state, "up").pendingDirection).toBe("up");
  });

  it("judges reversal against the already-pending direction", () => {
    const state = changeDirection(runningState(), "up");
    // pending is "up"; "down" must be rejected even though current is "right"
    expect(changeDirection(state, "down").pendingDirection).toBe("up");
  });

  it("is ignored when not running", () => {
    const idle = createInitialState(DEFAULT_CONFIG, rngZero);
    expect(changeDirection(idle, "up").pendingDirection).toBeNull();
  });
});

describe("lifecycle", () => {
  it("start begins a run from idle only", () => {
    const idle = createInitialState(DEFAULT_CONFIG, rngZero);
    expect(start(idle).status).toBe("running");
    const over: GameState = { ...idle, status: "game-over" };
    expect(start(over).status).toBe("game-over");
  });

  it("togglePause flips between running and paused", () => {
    const running = runningState();
    const paused = togglePause(running);
    expect(paused.status).toBe("paused");
    expect(togglePause(paused).status).toBe("running");
    const idle = createInitialState(DEFAULT_CONFIG, rngZero);
    expect(togglePause(idle).status).toBe("idle");
  });

  it("restart returns a fresh running game", () => {
    let state = runningState({ score: 7, status: "game-over" });
    state = restart(state, rngZero);
    expect(state.status).toBe("running");
    expect(state.score).toBe(0);
    expect(state.snake).toHaveLength(DEFAULT_CONFIG.initialLength);
  });
});
