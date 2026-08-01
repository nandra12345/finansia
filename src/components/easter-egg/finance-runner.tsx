"use client";

import { useEffect, useRef, useState } from "react";
import { clamp } from "@/lib/game/physics";
import { circleIntersects } from "@/lib/game/collision";
import { isShootKey } from "@/lib/game/controls";
import {
  BULLET_RADIUS,
  BULLET_SPEED,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRID_STEP_X,
  GRID_STEP_Y,
  HAZARD_RADIUS,
  HAZARD_SPAWN_BASE,
  HAZARD_SPAWN_MIN,
  HAZARD_SPEED_BASE,
  HAZARD_SPEED_INCREMENT,
  INITIAL_HEALTH,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  PLAYER_Y,
  SHOOT_COOLDOWN,
  TARGET_RADIUS,
  TARGET_SPAWN_BASE,
  TARGET_SPAWN_MIN,
  TARGET_SPEED_BASE,
  TARGET_SPEED_INCREMENT,
} from "@/lib/game/constants";

interface FinanceRunnerProps {
  status: "idle" | "running" | "paused" | "over";
  onScore: (value: number) => void;
  onGameOver: () => void;
}

interface Bullet {
  x: number;
  y: number;
  radius: number;
}

interface Target {
  id: string;
  x: number;
  y: number;
  radius: number;
  phase: number;
}

interface Hazard {
  id: string;
  x: number;
  y: number;
  radius: number;
}

interface GameState {
  playerX: number;
  playerTargetX: number;
  bullets: Bullet[];
  targets: Target[];
  hazards: Hazard[];
  spawnTimer: number;
  hazardTimer: number;
  score: number;
  health: number;
  combo: number;
  lastHitTimestamp: number;
}

const createInitialState = (): GameState => ({
  playerX: GAME_WIDTH / 2,
  playerTargetX: GAME_WIDTH / 2,
  bullets: [],
  targets: [],
  hazards: [],
  spawnTimer: TARGET_SPAWN_BASE,
  hazardTimer: HAZARD_SPAWN_BASE,
  score: 0,
  health: INITIAL_HEALTH,
  combo: 0,
  lastHitTimestamp: 0,
});

const createTarget = (): Target => ({
  id: crypto.randomUUID(),
  x: Math.random() * (GAME_WIDTH - TARGET_RADIUS * 2) + TARGET_RADIUS,
  y: Math.random() * 40 + 24,
  radius: TARGET_RADIUS,
  phase: Math.random() * Math.PI * 2,
});

const createHazard = (): Hazard => ({
  id: crypto.randomUUID(),
  x: Math.random() * (GAME_WIDTH - HAZARD_RADIUS * 2) + HAZARD_RADIUS,
  y: -HAZARD_RADIUS * 2,
  radius: HAZARD_RADIUS,
});

export function FinanceRunner({ status, onScore, onGameOver }: FinanceRunnerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const gameStateRef = useRef<GameState>(createInitialState());
  const keyInputRef = useRef(0);
  const lastShotRef = useRef(0);
  const [message, setMessage] = useState("Move smoothly, shoot targets, and avoid hazards.");
  const [health, setHealth] = useState(INITIAL_HEALTH);
  const [combo, setCombo] = useState(0);

  const drawScene = (context: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    context.fillStyle = "#05080c";
    context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    context.strokeStyle = "rgba(50, 155, 130, 0.08)";
    context.lineWidth = 1;
    for (let x = 0; x <= GAME_WIDTH; x += GRID_STEP_X) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, GAME_HEIGHT);
      context.stroke();
    }
    for (let y = 0; y <= GAME_HEIGHT; y += GRID_STEP_Y) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(GAME_WIDTH, y);
      context.stroke();
    }

    context.strokeStyle = "rgba(60, 220, 200, 0.14)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(24, GAME_HEIGHT * 0.65);
    context.lineTo(GAME_WIDTH * 0.3, GAME_HEIGHT * 0.5);
    context.lineTo(GAME_WIDTH * 0.55, GAME_HEIGHT * 0.58);
    context.lineTo(GAME_WIDTH * 0.72, GAME_HEIGHT * 0.38);
    context.lineTo(GAME_WIDTH - 24, GAME_HEIGHT * 0.45);
    context.stroke();

    state.targets.forEach((target) => {
      const opacity = 0.55 + Math.sin(target.phase * 0.5) * 0.15;
      context.beginPath();
      context.fillStyle = `rgba(58, 222, 217, ${opacity})`;
      context.shadowColor = "rgba(58, 222, 217, 0.24)";
      context.shadowBlur = 14;
      context.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      context.strokeStyle = "rgba(62, 255, 212, 0.3)";
      context.lineWidth = 1.2;
      context.stroke();
    });

    state.hazards.forEach((hazard) => {
      context.beginPath();
      context.fillStyle = "rgba(255, 83, 95, 0.14)";
      context.shadowColor = "rgba(255, 83, 95, 0.18)";
      context.shadowBlur = 16;
      context.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      context.strokeStyle = "rgba(255, 83, 95, 0.38)";
      context.lineWidth = 1.4;
      context.stroke();
    });

    state.bullets.forEach((bullet) => {
      context.beginPath();
      context.fillStyle = "rgba(125, 255, 190, 0.96)";
      context.shadowColor = "rgba(125, 255, 190, 0.35)";
      context.shadowBlur = 10;
      context.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    });

    const playerGradient = context.createRadialGradient(
      state.playerX,
      PLAYER_Y,
      PLAYER_RADIUS * 0.3,
      state.playerX,
      PLAYER_Y,
      PLAYER_RADIUS * 1.7
    );
    playerGradient.addColorStop(0, "rgba(88, 255, 176, 0.95)");
    playerGradient.addColorStop(1, "rgba(8, 27, 17, 0.08)");

    context.beginPath();
    context.fillStyle = playerGradient;
    context.shadowColor = "rgba(88, 255, 176, 0.24)";
    context.shadowBlur = 22;
    context.arc(state.playerX, PLAYER_Y, PLAYER_RADIUS, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    context.strokeStyle = "rgba(105, 255, 185, 0.56)";
    context.lineWidth = 2;
    context.stroke();

    context.fillStyle = "rgba(255, 255, 255, 0.4)";
    context.font = "12px Inter, ui-sans-serif, system-ui";
    context.fillText(`Health ${state.health}`, 18, 22);
    if (state.combo > 1) {
      context.fillText(`Combo ×${state.combo}`, 18, 40);
    }

    if (status === "paused") {
      context.fillStyle = "rgba(0, 0, 0, 0.55)";
      context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      context.fillStyle = "rgba(255, 255, 255, 0.85)";
      context.font = "700 24px Inter, ui-sans-serif, system-ui";
      context.textAlign = "center";
      context.fillText("Paused", GAME_WIDTH / 2, GAME_HEIGHT / 2);
      context.textAlign = "start";
    }

    if (status === "over") {
      context.fillStyle = "rgba(0, 0, 0, 0.6)";
      context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      context.fillStyle = "rgba(255, 255, 255, 0.9)";
      context.font = "700 24px Inter, ui-sans-serif, system-ui";
      context.textAlign = "center";
      context.fillText("Run complete", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 8);
      context.font = "500 14px Inter, ui-sans-serif, system-ui";
      context.fillText("Press restart to play again.", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 18);
      context.textAlign = "start";
    }
  };

  const updateGame = (delta: number) => {
    const state = gameStateRef.current;
    const difficulty = 1 + Math.floor(state.score / 40);

    if (keyInputRef.current !== 0) {
      state.playerTargetX = clamp(
        state.playerTargetX + keyInputRef.current * PLAYER_SPEED * delta,
        PLAYER_RADIUS,
        GAME_WIDTH - PLAYER_RADIUS
      );
    }

    state.playerX += (state.playerTargetX - state.playerX) * clamp(delta * 12, 0, 1);

    state.bullets = state.bullets
      .map((bullet) => ({
        ...bullet,
        y: bullet.y - BULLET_SPEED * delta,
      }))
      .filter((bullet) => bullet.y + bullet.radius > 0);

    state.targets.forEach((target) => {
      const speed = TARGET_SPEED_BASE + TARGET_SPEED_INCREMENT * (difficulty - 1);
      const xDrift = Math.sin(target.phase + performance.now() / 400) * 0.22;
      target.y += speed * delta;
      target.x = clamp(target.x + xDrift, target.radius, GAME_WIDTH - target.radius);
    });

    state.targets = state.targets.filter((target) => target.y - target.radius < GAME_HEIGHT);

    state.hazards.forEach((hazard) => {
      const speed = HAZARD_SPEED_BASE + HAZARD_SPEED_INCREMENT * (difficulty - 1);
      hazard.y += speed * delta;
    });

    state.hazards = state.hazards.filter((hazard) => hazard.y - hazard.radius < GAME_HEIGHT);

    const nextBullets: Bullet[] = [];

    state.bullets.forEach((bullet) => {
      let bulletUsed = false;
      state.targets = state.targets.filter((target) => {
        if (!bulletUsed && circleIntersects(bullet, target)) {
          bulletUsed = true;
          state.score += 12;
          state.combo += 1;
          state.lastHitTimestamp = performance.now();
          onScore(12);
          setCombo(state.combo);
          setMessage("Precision hit. Score increased.");
          return false;
        }
        return true;
      });
      if (!bulletUsed) {
        nextBullets.push(bullet);
      }
    });

    state.bullets = nextBullets;

    const playerCircle = { x: state.playerX, y: PLAYER_Y, radius: PLAYER_RADIUS };
    const remainingTargets: Target[] = [];

    state.targets.forEach((target) => {
      if (circleIntersects(playerCircle, target)) {
        state.health = Math.max(state.health - 1, 0);
        setHealth(state.health);
        if (state.health <= 0) {
          onGameOver();
          setMessage("Run complete. Restart to try again.");
        } else {
          setMessage("Contact avoided. Stay precise.");
        }
      } else {
        remainingTargets.push(target);
      }
    });

    state.targets = remainingTargets;

    const remainingHazards: Hazard[] = [];
    state.hazards.forEach((hazard) => {
      if (circleIntersects(playerCircle, hazard)) {
        state.health = Math.max(state.health - 1, 0);
        setHealth(state.health);
        if (state.health <= 0) {
          onGameOver();
          setMessage("Run ended. Hazard impact received.");
        } else {
          setMessage("Near miss. Adjust your path.");
        }
      } else {
        remainingHazards.push(hazard);
      }
    });

    state.hazards = remainingHazards;

    state.spawnTimer -= delta;
    if (state.spawnTimer <= 0) {
      state.targets.push(createTarget());
      state.spawnTimer = Math.max(TARGET_SPAWN_BASE - difficulty * 0.12, TARGET_SPAWN_MIN);
    }

    if (state.score >= 40) {
      state.hazardTimer -= delta;
      if (state.hazardTimer <= 0) {
        state.hazards.push(createHazard());
        state.hazardTimer = Math.max(HAZARD_SPAWN_BASE - difficulty * 0.28, HAZARD_SPAWN_MIN);
      }
    }

    if (performance.now() - state.lastHitTimestamp > 2500 && state.combo !== 0) {
      state.combo = 0;
      setCombo(0);
    }
  };

  const drawFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    drawScene(context);
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = GAME_WIDTH * dpr;
    canvas.height = GAME_HEIGHT * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFrame();
  };

  const shoot = () => {
    if (status !== "running") return;
    const now = performance.now();
    if (now - lastShotRef.current < SHOOT_COOLDOWN * 1000) {
      return;
    }
    lastShotRef.current = now;
    const state = gameStateRef.current;
    state.bullets.push({
      x: state.playerX,
      y: PLAYER_Y - PLAYER_RADIUS - BULLET_RADIUS,
      radius: BULLET_RADIUS,
    });
    setMessage("Fired.");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => resizeCanvas();
    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nextX = clamp(event.clientX - rect.left, PLAYER_RADIUS, GAME_WIDTH - PLAYER_RADIUS);
      gameStateRef.current.playerTargetX = nextX;
    };
    const handlePointerDown = (event: PointerEvent) => {
      event.preventDefault();
      handlePointerMove(event);
      shoot();
    };

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", handleResize);

    resizeCanvas();

    return () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [status]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (status !== "running") return;
      if (isShootKey(event)) {
        event.preventDefault();
        shoot();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        keyInputRef.current = -1;
      }
      if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
        keyInputRef.current = 1;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "a" ||
        event.key === "A" ||
        event.key === "d" ||
        event.key === "D"
      ) {
        keyInputRef.current = 0;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [status]);

  useEffect(() => {
    const loop = (timestamp: number) => {
      if (status !== "running") {
        frameRef.current = null;
        return;
      }
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;
      updateGame(delta);
      drawFrame();
      frameRef.current = requestAnimationFrame(loop);
    };

    if (status === "running") {
      frameRef.current = requestAnimationFrame(loop);
    } else {
      lastTimeRef.current = null;
      drawFrame();
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = null;
    };
  }, [status]);

  return (
    <div className="relative w-full overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-950/80 shadow-[0_28px_60px_-28px_rgba(0,0,0,0.9)]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-neutral-950 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-emerald-500/40" />
      <div className="absolute left-4 top-4 z-10 flex items-center space-x-3 rounded-2xl border border-white/10 bg-neutral-950/80 px-3 py-2 text-xs text-neutral-300 shadow-[0_12px_50px_-30px_rgba(0,0,0,0.8)]">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(88,255,176,0.2)]" />
        <span>Health {health}</span>
        {combo > 1 ? <span className="text-emerald-300">Combo ×{combo}</span> : null}
      </div>
      <div className="absolute right-4 top-4 z-10 rounded-2xl border border-white/10 bg-neutral-950/80 px-3 py-2 text-right text-xs text-neutral-300 shadow-[0_12px_50px_-30px_rgba(0,0,0,0.8)]">
        <p className="font-medium text-white">{message}</p>
      </div>
      <div className="relative aspect-[480/280] w-full">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="h-full w-full rounded-[2rem] bg-neutral-950/70"
          role="img"
          aria-label="Finance shooting game"
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 pointer-events-none flex justify-center pb-4 text-[11px] uppercase tracking-[0.24em] text-neutral-500">
        <span>Mouse or touch to point, click / space to shoot</span>
      </div>
    </div>
  );
}
