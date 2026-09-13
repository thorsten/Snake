import { useEffect, useRef } from "react";
import type { GameState } from "../game/types.ts";

const CELL = 28;
const HUE_SPEED = 0.06; // degrees per millisecond
const HUE_STEP = 26; // hue offset between segments

function drawBoard(ctx: CanvasRenderingContext2D, state: GameState, now: number) {
  const { cols, rows } = state.config;
  const width = cols * CELL;
  const height = rows * CELL;
  const baseHue = (now * HUE_SPEED) % 360;

  ctx.clearRect(0, 0, width, height);

  // faint rainbow-tinted checkerboard
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if ((x + y) % 2 === 0) continue;
      ctx.fillStyle = `hsla(${(baseHue + (x + y) * 6) % 360}, 60%, 50%, 0.06)`;
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }

  // food: pulsing rainbow orb
  const pulse = 0.75 + 0.25 * Math.sin(now / 180);
  const foodHue = (baseHue * 2) % 360;
  const fx = state.food.x * CELL + CELL / 2;
  const fy = state.food.y * CELL + CELL / 2;
  ctx.save();
  ctx.shadowColor = `hsl(${foodHue}, 100%, 60%)`;
  ctx.shadowBlur = 18;
  ctx.fillStyle = `hsl(${foodHue}, 100%, 62%)`;
  ctx.beginPath();
  ctx.arc(fx, fy, (CELL / 2 - 4) * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // snake: hue cycles along the body and shifts over time
  state.snake.forEach((segment, i) => {
    const hue = (baseHue + i * HUE_STEP) % 360;
    const isHead = i === 0;
    ctx.save();
    if (isHead) {
      ctx.shadowColor = `hsl(${hue}, 100%, 65%)`;
      ctx.shadowBlur = 16;
    }
    ctx.fillStyle = `hsl(${hue}, 95%, ${isHead ? 68 : 58}%)`;
    const pad = isHead ? 1 : 2;
    const size = CELL - pad * 2;
    ctx.beginPath();
    ctx.roundRect(segment.x * CELL + pad, segment.y * CELL + pad, size, size, isHead ? 9 : 7);
    ctx.fill();
    ctx.restore();
  });
}

export function GameCanvas({ state }: { state: GameState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const { cols, rows } = state.config;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = cols * CELL * dpr;
    canvas.height = rows * CELL * dpr;

    let frame = 0;
    const loop = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawBoard(ctx, stateRef.current, now);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [cols, rows]);

  return (
    <canvas ref={canvasRef} className="board" data-testid="board" aria-label="Snake game board" />
  );
}
