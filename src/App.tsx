import { useEffect } from "react";
import { GameCanvas } from "./components/GameCanvas.tsx";
import { Hud } from "./components/Hud.tsx";
import { saveHighScore } from "./highscore.ts";
import { useControls } from "./hooks/useControls.ts";
import { useGame } from "./hooks/useGame.ts";
import { useGameLoop } from "./hooks/useGameLoop.ts";

export function App() {
  const [{ game, highScore }, dispatch] = useGame();

  useControls(dispatch);
  useGameLoop(game.status === "running", game.tickMs, () => dispatch({ type: "TICK" }));

  // sync the record to localStorage so it survives reloads (offline too)
  useEffect(() => {
    if (highScore > 0) saveHighScore(highScore);
  }, [highScore]);

  return (
    <main className="game">
      <Hud
        state={game}
        highScore={highScore}
        onRestart={() => dispatch({ type: "RESTART" })}
        onStart={() => dispatch({ type: "START" })}
      />
      <GameCanvas state={game} />
      <footer className="hint">Arrows / WASD to steer · Space to pause</footer>
    </main>
  );
}
