import { describe, expect, it } from "vitest";
import { createInitialState, DEFAULT_CONFIG, start } from "../game/engine.ts";
import { appReducer, type AppState } from "./useGame.ts";

const rngZero = () => 0;

function appState(highScore = 0): AppState {
  return { game: start(createInitialState(DEFAULT_CONFIG, rngZero)), highScore };
}

describe("appReducer", () => {
  it("raises the high score when the score passes it", () => {
    const state = appState(0);
    const head = state.game.snake[0]!;
    state.game = { ...state.game, food: { x: head.x + 1, y: head.y } };
    const next = appReducer(state, { type: "TICK" });
    expect(next.game.score).toBe(1);
    expect(next.highScore).toBe(1);
  });

  it("keeps the high score across a restart", () => {
    const state = appState(5);
    const next = appReducer(state, { type: "RESTART" });
    expect(next.game.score).toBe(0);
    expect(next.highScore).toBe(5);
  });

  it("starts the game when steering from the start screen", () => {
    const idle: AppState = { game: createInitialState(DEFAULT_CONFIG, rngZero), highScore: 0 };
    const next = appReducer(idle, { type: "TURN", direction: "up" });
    expect(next.game.status).toBe("running");
    expect(next.game.pendingDirection).toBe("up");
  });
});
