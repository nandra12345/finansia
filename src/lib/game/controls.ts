export function isMovementKey(event: KeyboardEvent) {
  return (
    event.key === "ArrowLeft" ||
    event.key === "ArrowRight" ||
    event.key === "a" ||
    event.key === "A" ||
    event.key === "d" ||
    event.key === "D"
  );
}

export function isShootKey(event: KeyboardEvent) {
  return (
    event.key === " " ||
    event.key === "ArrowUp" ||
    event.key === "w" ||
    event.key === "W" ||
    event.key === "Enter"
  );
}

export function isPauseKey(event: KeyboardEvent) {
  return event.key === "Escape" || event.key === "p" || event.key === "P";
}
