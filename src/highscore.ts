const KEY = "rainbow-snake.highscore";

export function loadHighScore(): number {
  try {
    return Number(localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score: number): void {
  try {
    localStorage.setItem(KEY, String(score));
  } catch {
    // storage unavailable (private mode) — the game still works
  }
}
