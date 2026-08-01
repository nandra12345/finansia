import { GRAVITY } from "@/lib/game/constants";

export function applyGravity(position: number, velocity: number, delta: number) {
  const nextVelocity = velocity + GRAVITY * delta;
  const nextPosition = position + nextVelocity * delta;

  return {
    position: nextPosition,
    velocity: nextVelocity,
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
