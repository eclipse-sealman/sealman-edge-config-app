import { useEffect, useRef, useState } from "react";
import { drawGame } from "./sealmanGameRender";
import { OBSTACLE_DEFS, ObstacleKind, createGame, loadHighScore, resizeGame, saveHighScore, stepGame } from "./sealmanGameEngine";

const COMIC_FONT = "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', 'Trebuchet MS', sans-serif";

interface RunResult {
  score: number;
  best: number;
  isNewBest: boolean;
  killedBy: ObstacleKind;
}

const comicButton =
  "rounded-lg border-4 border-[#0f1f47] px-5 py-2 text-base font-black uppercase tracking-wide shadow-[4px_4px_0_#0f1f47] transition-transform hover:-translate-y-0.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white";

/** Endless swimming game: dodge everything the current carries towards Sealman. */
export default function SealmanGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);

  const restart = () => {
    setResult(null);
    setRunId((id) => id + 1);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const game = createGame(window.innerWidth, window.innerHeight);
    const best = loadHighScore();
    const input = { up: false, down: false, pointerY: null as number | null };

    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      resizeGame(game, window.innerWidth, window.innerHeight);
    };
    fit();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onExit();
        return;
      }
      if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") input.up = true;
      else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") input.down = true;
      else return;
      event.preventDefault();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") input.up = false;
      else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") input.down = false;
    };
    const onPointer = (event: PointerEvent) => {
      input.pointerY = event.clientY;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.buttons > 0) onPointer(event);
    };
    const onPointerEnd = () => {
      input.pointerY = null;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", fit);
    canvas.addEventListener("pointerdown", onPointer);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerEnd);
    canvas.addEventListener("pointercancel", onPointerEnd);

    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      stepGame(game, dt, { dir: input.down === input.up ? 0 : input.down ? 1 : -1, pointerY: input.pointerY });
      drawGame(ctx, game, best);

      if (game.over && game.killedBy) {
        const score = Math.floor(game.score);
        const isNewBest = score > best;
        if (isNewBest) saveHighScore(score);
        setResult({ score, best: Math.max(best, score), isNewBest, killedBy: game.killedBy });
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", fit);
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerEnd);
      canvas.removeEventListener("pointercancel", onPointerEnd);
    };
  }, [runId, onExit]);

  useEffect(() => {
    if (!result) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setResult(null);
        setRunId((id) => id + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [result]);

  return (
    <div role="dialog" aria-label="Be a hero - Sealman game" className="fixed inset-0 z-[100] select-none bg-[#0f1f47]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      <button
        type="button"
        onClick={onExit}
        className="absolute right-4 top-4 rounded-md border-2 border-white/60 bg-black/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white hover:bg-black/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
      >
        Exit (Esc)
      </button>

      {result && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f1f47]/55 p-4">
          <div
            className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border-4 border-[#0f1f47] bg-white px-8 py-8 text-center shadow-[8px_8px_0_#0f1f47]"
            style={{ fontFamily: COMIC_FONT }}
          >
            <h2
              className="text-5xl font-black italic uppercase text-red-600"
              style={{ WebkitTextStroke: "2px #0f1f47", paintOrder: "stroke fill", textShadow: "4px 4px 0 #facc15" }}
            >
              Game over
            </h2>
            <p className="text-sm font-semibold text-slate-700">{OBSTACLE_DEFS[result.killedBy].reason}</p>

            <div className="grid w-full grid-cols-2 gap-3">
              <div className="rounded-xl border-4 border-[#0f1f47] bg-sky-100 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Score</p>
                <p className="text-3xl font-black text-[#0303b8]">{result.score}</p>
              </div>
              <div className="rounded-xl border-4 border-[#0f1f47] bg-yellow-200 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">High score</p>
                <p className="text-3xl font-black text-[#0f1f47]">{result.best}</p>
              </div>
            </div>

            {result.isNewBest && (
              <p className="rotate-[-3deg] rounded-md border-4 border-[#0f1f47] bg-red-500 px-3 py-1 text-sm font-black uppercase text-white">
                New high score!
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" onClick={restart} className={`${comicButton} bg-yellow-300 text-[#0f1f47]`}>
                Swim again
              </button>
              <button type="button" onClick={onExit} className={`${comicButton} bg-white text-[#0f1f47]`}>
                Exit
              </button>
            </div>
            <p className="text-xs text-slate-500">Press Enter to swim again</p>
          </div>
        </div>
      )}
    </div>
  );
}
