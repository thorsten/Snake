import { useEffect, useRef } from "react";

/**
 * Calls `onTick` every `tickMs` milliseconds while `running`, driven by
 * requestAnimationFrame with an accumulator so ticks stay steady and stop
 * automatically while the tab is hidden.
 */
export function useGameLoop(running: boolean, tickMs: number, onTick: () => void) {
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    let acc = 0;

    const loop = (now: number) => {
      // clamp large gaps (tab was hidden) so the snake doesn't teleport
      acc += Math.min(now - last, 250);
      last = now;
      while (acc >= tickMs) {
        acc -= tickMs;
        onTickRef.current();
      }
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [running, tickMs]);
}
