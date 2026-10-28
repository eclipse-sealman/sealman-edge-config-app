import { useEffect, useRef, useState } from "react";
import { drawGame } from "./sealmanGameRender";
import { OBSTACLE_DEFS, ObstacleKind, createGame, loadHighScore, resizeGame, saveHighScore, stepGame } from "./sealmanGameEngine";
import { ScoreEntry, fetchRanking, fetchScoreSummary, submitScore } from "./sealmanScoreApi";

const COMIC_FONT = "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', 'Trebuchet MS', sans-serif";

interface RunResult {
  runId: number;
  score: number;
  /** Own best including this run. */
  personal: number;
  isNewBest: boolean;
  killedBy: ObstacleKind;
  globalBest: ScoreEntry | null;
  sync: "pending" | "done" | "offline";
}

type HallOfFame = { status: "loading" } | { status: "error" } | { status: "ready"; entries: ScoreEntry[] };

const comicButton =
  "rounded-lg border-4 border-[#0f1f47] px-5 py-2 text-base font-black uppercase tracking-wide shadow-[4px_4px_0_#0f1f47] transition-transform hover:-translate-y-0.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white";

function Stat({ label, value, detail, className }: { label: string; value: string | number; detail?: string; className: string }) {
  return (
    <div className={`min-w-0 rounded-xl border-4 border-[#0f1f47] py-3 ${className}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</p>
      <p className="text-3xl font-black text-[#0f1f47]">{value}</p>
      <p className="truncate px-1 text-xs font-semibold text-slate-600">{detail ?? "\u00a0"}</p>
    </div>
  );
}

/** Endless swimming game: dodge everything the current carries towards Sealman. */
export default function SealmanGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bestRef = useRef(loadHighScore());
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);
  const [fame, setFame] = useState<HallOfFame | null>(null);

  const restart = () => {
    setFame(null);
    setResult(null);
    setRunId((id) => id + 1);
  };

  const openFame = () => {
    setFame({ status: "loading" });
    fetchRanking()
      .then((entries) => setFame({ status: "ready", entries }))
      .catch(() => setFame({ status: "error" }));
  };

  // The stored personal best may come from another browser; the server knows the real one.
  useEffect(() => {
    fetchScoreSummary()
      .then((summary) => {
        bestRef.current = Math.max(bestRef.current, summary.personal);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const game = createGame(window.innerWidth, window.innerHeight);
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

    const finish = (score: number, killedBy: ObstacleKind) => {
      const isNewBest = score > bestRef.current;
      if (isNewBest) {
        bestRef.current = score;
        saveHighScore(score);
      }
      setResult({ runId, score, personal: bestRef.current, isNewBest, killedBy, globalBest: null, sync: "pending" });

      submitScore(score)
        .then((summary) => {
          bestRef.current = Math.max(bestRef.current, summary.personal);
          saveHighScore(bestRef.current);
          setResult((prev) =>
            prev && prev.runId === runId
              ? { ...prev, personal: bestRef.current, globalBest: summary.best ?? null, sync: "done" }
              : prev,
          );
        })
        .catch(() => setResult((prev) => (prev && prev.runId === runId ? { ...prev, sync: "offline" } : prev)));
    };

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      stepGame(game, dt, { dir: input.down === input.up ? 0 : input.down ? 1 : -1, pointerY: input.pointerY });
      drawGame(ctx, game, bestRef.current);

      if (game.over && game.killedBy) {
        finish(Math.floor(game.score), game.killedBy);
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

  const showingFame = fame !== null;

  useEffect(() => {
    if (!result || showingFame) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setResult(null);
        setRunId((id) => id + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [result, showingFame]);

  // A later sync can reveal a higher stored best, so the badges follow the final numbers.
  const isPersonalRecord = result ? result.isNewBest && result.personal === result.score : false;
  const isGlobalRecord = result ? isPersonalRecord && result.globalBest?.value === result.score : false;

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
            className="flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl border-4 border-[#0f1f47] bg-white px-8 py-8 text-center shadow-[8px_8px_0_#0f1f47]"
            style={{ fontFamily: COMIC_FONT }}
          >
            {fame ? (
              <>
                <h2
                  className="text-4xl font-black italic uppercase text-yellow-300"
                  style={{ WebkitTextStroke: "2px #0f1f47", paintOrder: "stroke fill", textShadow: "4px 4px 0 #dc2626" }}
                >
                  Strongest SEALMANs
                </h2>

                {fame.status === "loading" && <p className="py-6 text-sm font-semibold text-slate-600">Counting the muscles...</p>}
                {fame.status === "error" && <p className="py-6 text-sm font-semibold text-red-600">The hall of fame is not reachable right now.</p>}
                {fame.status === "ready" && fame.entries.length === 0 && (
                  <p className="py-6 text-sm font-semibold text-slate-600">Nobody has made it into the hall of fame yet.</p>
                )}
                {fame.status === "ready" && fame.entries.length > 0 && (
                  <ol className="w-full space-y-2">
                    {fame.entries.map((entry, index) => (
                      <li
                        key={`${index}-${entry.name}`}
                        className={`flex items-center gap-3 rounded-xl border-4 border-[#0f1f47] px-4 py-2 ${index === 0 ? "bg-yellow-200" : "bg-sky-50"}`}
                      >
                        <span className="w-6 text-xl font-black text-[#0f1f47]">{index + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-left text-base font-bold text-[#0f1f47]">{entry.name}</span>
                        <span className="text-xl font-black text-[#0303b8]">{entry.value}</span>
                      </li>
                    ))}
                  </ol>
                )}

                <button type="button" onClick={() => setFame(null)} className={`${comicButton} bg-yellow-300 text-[#0f1f47]`}>
                  Back
                </button>
              </>
            ) : (
              <>
                <h2
                  className="text-5xl font-black italic uppercase text-red-600"
                  style={{ WebkitTextStroke: "2px #0f1f47", paintOrder: "stroke fill", textShadow: "4px 4px 0 #facc15" }}
                >
                  Game over
                </h2>
                <p className="text-sm font-semibold text-slate-700">{OBSTACLE_DEFS[result.killedBy].reason}</p>

                <div className="grid w-full grid-cols-3 gap-3">
                  <Stat label="Score" value={result.score} className="bg-sky-100" />
                  <Stat label="Personal best" value={result.personal} className="bg-yellow-200" />
                  <Stat
                    label="Global best"
                    value={result.globalBest ? result.globalBest.value : result.sync === "pending" ? "..." : "-"}
                    detail={result.globalBest?.name}
                    className="bg-pink-100"
                  />
                </div>

                {isGlobalRecord ? (
                  <p className="rotate-[-3deg] rounded-md border-4 border-[#0f1f47] bg-red-500 px-3 py-1 text-sm font-black uppercase text-white">
                    New global record!
                  </p>
                ) : (
                  isPersonalRecord && (
                    <p className="rotate-[-3deg] rounded-md border-4 border-[#0f1f47] bg-red-500 px-3 py-1 text-sm font-black uppercase text-white">
                      New personal best!
                    </p>
                  )
                )}
                {result.sync === "offline" && (
                  <p className="text-xs font-semibold text-slate-500">The score could not be saved - global ranking unavailable.</p>
                )}

                <div className="flex flex-wrap justify-center gap-3">
                  <button type="button" onClick={restart} className={`${comicButton} bg-yellow-300 text-[#0f1f47]`}>
                    Swim again
                  </button>
                  <button type="button" onClick={openFame} className={`${comicButton} bg-sky-200 text-[#0f1f47]`}>
                    Strongest SEALMANs
                  </button>
                  <button type="button" onClick={onExit} className={`${comicButton} bg-white text-[#0f1f47]`}>
                    Exit
                  </button>
                </div>
                <p className="text-xs text-slate-500">Press Enter to swim again</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
