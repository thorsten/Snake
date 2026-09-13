export interface Point {
  x: number;
  y: number;
}

export type Direction = "up" | "down" | "left" | "right";

export type Status = "idle" | "running" | "paused" | "game-over";

export interface GameConfig {
  cols: number;
  rows: number;
  initialLength: number;
}

export interface GameState {
  config: GameConfig;
  /** Head first. */
  snake: Point[];
  direction: Direction;
  pendingDirection: Direction | null;
  food: Point;
  score: number;
  status: Status;
  tickMs: number;
}

/** Injectable random source returning a float in [0, 1). */
export type Rng = () => number;
