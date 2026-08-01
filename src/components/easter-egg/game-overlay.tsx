"use client";

import { useEffect, useRef, useState } from "react";
import { FinanceRunner } from "./finance-runner";
import { ScoreDisplay } from "./score-display";

interface GameOverlayProps {
  isOpen: boolean;
  status: "idle" | "running" | "paused" | "over";
  score: number;
  closeGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
  updateScore: (value: number) => void;
  setGameOver: () => void;
}

export function GameOverlay({
  isOpen,
  status,
  score,
  closeGame,
  pauseGame,
  resumeGame,
  resetGame,
  updateScore,
  setGameOver,
}: GameOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElement = useRef<Element | null>(null);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    lastActiveElement.current = document.activeElement;
    overlayRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (lastActiveElement.current instanceof HTMLElement) {
        lastActiveElement.current.focus();
      }
    };
  }, [isOpen, closeGame]);

  const handleRestart = () => {
    setGameKey((current) => current + 1);
    resetGame();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hidden finance experience"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeGame();
        }
      }}
    >
      <div
        ref={overlayRef}
        tabIndex={-1}
        className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-950/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-300 ease-out focus:outline-none sm:p-8"
      >
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Hidden experience</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Finansia pulse</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
              Minimal finance interaction for curious visitors. Press ESC to exit, use arrow keys or pointer to move, and tap space to shoot.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {status === "running" ? (
              <button
                type="button"
                className="rounded-xl border border-emerald-500/30 bg-white/5 px-4 py-2 text-sm text-emerald-200 transition hover:border-emerald-400/50 hover:bg-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                onClick={pauseGame}
              >
                Pause
              </button>
            ) : status === "paused" ? (
              <button
                type="button"
                className="rounded-xl border border-emerald-500/30 bg-white/5 px-4 py-2 text-sm text-emerald-200 transition hover:border-emerald-400/50 hover:bg-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                onClick={resumeGame}
              >
                Resume
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-300/30"
              onClick={handleRestart}
            >
              Restart
            </button>
            <button
              type="button"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-200 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-300/30"
              onClick={closeGame}
            >
              Close
            </button>
          </div>
        </div>

        <ScoreDisplay score={score} status={status} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <FinanceRunner
              key={gameKey}
              status={status}
              onScore={updateScore}
              onGameOver={setGameOver}
            />
          </div>

          <div className="space-y-4 rounded-3xl border border-neutral-800 bg-neutral-900/80 p-5 text-sm text-neutral-300">
            <div>
              <p className="font-semibold text-white">How to play</p>
              <p className="mt-2 leading-6 text-neutral-400">
                Move the orb, tap or click to fire, and destroy targets while avoiding hazards. The session stays calm, crisp, and enterprise-friendly.
              </p>
            </div>
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
              <p className="font-medium">Pro tip</p>
              <p className="mt-2 text-neutral-300">The game is crafted for discovery, not to distract from the product. Use it as a premium hidden feature.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
