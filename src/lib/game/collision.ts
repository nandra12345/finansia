export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function isIntersecting(a: Rectangle, b: Rectangle) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

interface Circle {
  x: number;
  y: number;
  radius: number;
}

export function circleIntersects(a: Circle, b: Circle) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = dx * dx + dy * dy;
  const radius = a.radius + b.radius;
  return distance < radius * radius;
}
