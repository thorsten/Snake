import type { GameState } from "../game/types.ts";

interface HudProps {
  state: GameState;
  highScore: number;
  onRestart: () => void;
  onStart: () => void;
}

export function Hud({ state, highScore, onRestart, onStart }: HudProps) {
  return (
    <>
      <header className="scores">
        <div>
          Score <strong data-testid="score">{state.score}</strong>
        </div>
        <h1 className="rainbow-text">Rainbow Snake</h1>
        <div>
          Best <strong data-testid="highscore">{highScore}</strong>
        </div>
      </header>

      {state.status === "idle" && (
        <div className="overlay" data-testid="overlay-start">
          <p className="rainbow-text big">Ready?</p>
          <p>Press an arrow key — or swipe — to start</p>
          <button type="button" onClick={onStart}>
            Start
          </button>
        </div>
      )}

      {state.status === "paused" && (
        <div className="overlay" data-testid="overlay-paused">
          <p className="rainbow-text big">Paused</p>
          <p>Press space to continue</p>
        </div>
      )}

      {state.status === "game-over" && (
        <div className="overlay" data-testid="overlay-gameover">
          <p className="rainbow-text big">Game Over</p>
          <p>
            You scored <strong>{state.score}</strong>
          </p>
          <button type="button" data-testid="restart" onClick={onRestart}>
            Play again
          </button>
          <p className="hint">…or press Enter</p>
        </div>
      )}
    </>
  );
}
