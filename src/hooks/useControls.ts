import { useEffect } from "react";
import type { Direction } from "../game/types.ts";
import type { GameAction } from "./useGame.ts";

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

const SWIPE_MIN_PX = 24;

/** Keyboard (arrows/WASD, space, enter) and touch-swipe controls. */
export function useControls(dispatch: (action: GameAction) => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_DIRECTIONS[event.key];
      if (direction) {
        event.preventDefault();
        dispatch({ type: "TURN", direction });
      } else if (event.key === " ") {
        event.preventDefault();
        dispatch({ type: "TOGGLE_PAUSE" });
      } else if (event.key === "Enter") {
        event.preventDefault();
        dispatch({ type: "RESTART" });
      }
    };

    let touchStart: { x: number; y: number } | null = null;
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) touchStart = { x: touch.clientX, y: touch.clientY };
    };
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch || !touchStart) return;
      const dx = touch.clientX - touchStart.x;
      const dy = touch.clientY - touchStart.y;
      touchStart = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN_PX) {
        dispatch({ type: "START" });
        return;
      }
      const direction: Direction =
        Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
      dispatch({ type: "TURN", direction });
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [dispatch]);
}
