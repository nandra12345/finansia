"use client";

import { useCallback, useState } from "react";

export type FinanceGameStatus = "idle" | "running" | "paused" | "over";

export function useFinanceGame() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<FinanceGameStatus>("idle");
  const [score, setScore] = useState(0);

  const openGame = useCallback(() => {
    setIsOpen(true);
    setStatus("running");
    setScore(0);
  }, []);

  const closeGame = useCallback(() => {
    setIsOpen(false);
    setStatus("idle");
  }, []);

  const pauseGame = useCallback(() => {
    setStatus((current) => (current === "running" ? "paused" : current));
  }, []);

  const resumeGame = useCallback(() => {
    setStatus((current) => (current === "paused" ? "running" : current));
  }, []);

  const resetGame = useCallback(() => {
    setScore(0);
    setStatus("running");
  }, []);

  const updateScore = useCallback((value: number) => {
    setScore((current) => current + value);
  }, []);

  const setGameOver = useCallback(() => {
    setStatus("over");
  }, []);

  return {
    isOpen,
    status,
    score,
    openGame,
    closeGame,
    pauseGame,
    resumeGame,
    resetGame,
    updateScore,
    setGameOver,
  };
}
