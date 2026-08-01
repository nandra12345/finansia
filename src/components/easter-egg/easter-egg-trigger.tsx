"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useFinanceGame } from "@/hooks/use-finance-game";

const GameOverlay = dynamic(
  async () => {
    const module = await import("./game-overlay");
    return module.GameOverlay;
  },
  {
    ssr: false,
  }
);

export function EasterEggTrigger() {
  const {
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
  } = useFinanceGame();

  const triggerCooldown = useRef(false);
  const tapCountRef = useRef(0);
  const tapTimeoutRef = useRef<number | null>(null);
  const animationTimeoutsRef = useRef<number[]>([]);

  const resetTapCount = () => {
    tapCountRef.current = 0;
    if (tapTimeoutRef.current !== null) {
      window.clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }
  };

  const animateElement = (element: HTMLElement, pulse = false) => {
    element.style.transition = "transform 120ms ease, box-shadow 160ms ease";
    element.style.transform = "scale(0.96)";
    if (pulse) {
      element.style.boxShadow = "0 0 0 4px rgba(88, 255, 176, 0.18)";
    }

    const timeoutId = window.setTimeout(() => {
      element.style.transform = "";
      element.style.boxShadow = "";
    }, 140);

    animationTimeoutsRef.current.push(timeoutId);
  };

  useEffect(() => {
    const handleKeyActivation = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modifier = isMac ? event.metaKey : event.ctrlKey;

      if (!modifier || !event.shiftKey || event.key.toLowerCase() !== "f") {
        return;
      }

      if (triggerCooldown.current) {
        return;
      }

      triggerCooldown.current = true;
      openGame();
      window.setTimeout(() => {
        triggerCooldown.current = false;
      }, 300);
      event.preventDefault();
    };

    const handleLogoTap = (event: PointerEvent) => {
      const target = event.currentTarget as HTMLElement;
      const count = tapCountRef.current + 1;
      tapCountRef.current = count;

      if (count === 1) {
        tapTimeoutRef.current = window.setTimeout(() => {
          resetTapCount();
        }, 2500);
      }

      animateElement(target, count >= 3);

      if (count >= 5) {
        resetTapCount();
        if (!triggerCooldown.current) {
          triggerCooldown.current = true;
          openGame();
          window.setTimeout(() => {
            triggerCooldown.current = false;
          }, 300);
        }
      }
    };

    const handleLogoKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      const target = event.currentTarget as HTMLElement;
      event.preventDefault();
      handleLogoTap(event as unknown as PointerEvent);
      animateElement(target, true);
    };

    window.addEventListener("keydown", handleKeyActivation);

    const logoElements = Array.from(document.querySelectorAll<HTMLElement>("[data-easter-egg-logo]"));
    logoElements.forEach((element) => {
      element.addEventListener("pointerdown", handleLogoTap);
      element.addEventListener("keydown", handleLogoKeyDown);
    });

    return () => {
      window.removeEventListener("keydown", handleKeyActivation);
      logoElements.forEach((element) => {
        element.removeEventListener("pointerdown", handleLogoTap);
        element.removeEventListener("keydown", handleLogoKeyDown);
      });
      animationTimeoutsRef.current.forEach(window.clearTimeout);
      animationTimeoutsRef.current = [];
      resetTapCount();
    };
  }, [openGame]);

  return (
    <>
      {isOpen ? (
        <GameOverlay
          isOpen={isOpen}
          status={status}
          score={score}
          closeGame={closeGame}
          pauseGame={pauseGame}
          resumeGame={resumeGame}
          resetGame={resetGame}
          updateScore={updateScore}
          setGameOver={setGameOver}
        />
      ) : null}
    </>
  );
}
