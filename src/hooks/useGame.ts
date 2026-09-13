import { useReducer } from "react";
import {
  changeDirection,
  createInitialState,
  restart,
  start,
  step,
  togglePause,
} from "../game/engine.ts";
import type { Direction, GameState } from "../game/types.ts";
import { loadHighScore } from "../highscore.ts";

export type GameAction =
  | { type: "TICK" }
  | { type: "TURN"; direction: Direction }
  | { type: "START" }
  | { type: "TOGGLE_PAUSE" }
  | { type: "RESTART" };

export interface AppState {
  game: GameState;
  highScore: number;
}

function reduceGame(game: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "TICK":
      return step(game);
    case "TURN":
      // steering from the start screen also starts the game
      return changeDirection(game.status === "idle" ? start(game) : game, action.direction);
    case "START":
      return start(game);
    case "TOGGLE_PAUSE":
      return togglePause(game);
    case "RESTART":
      return restart(game);
  }
}

export function appReducer(state: AppState, action: GameAction): AppState {
  const game = reduceGame(state.game, action);
  return { game, highScore: Math.max(state.highScore, game.score) };
}

export function useGame() {
  return useReducer(appReducer, undefined, () => ({
    game: createInitialState(),
    highScore: loadHighScore(),
  }));
}
