export type Vector2Init = { x: number; y: number };

export class Vector2 {
  readonly x: number;
  readonly y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  static from(init: Vector2 | Vector2Init): Vector2 {
    if (init instanceof Vector2) return init;
    return new Vector2(init.x, init.y);
  }

  add(dx: number, dy: number): Vector2 {
    return new Vector2(this.x + dx, this.y + dy);
  }

  scale(factor: number): Vector2 {
    return new Vector2(this.x * factor, this.y * factor);
  }

  clamp(minX: number, maxX: number, minY: number, maxY: number): Vector2 {
    const x = Math.min(Math.max(this.x, minX), maxX);
    const y = Math.min(Math.max(this.y, minY), maxY);
    return new Vector2(x, y);
  }

  with({ x = this.x, y = this.y }: Partial<Vector2Init>): Vector2 {
    return new Vector2(x, y);
  }
}
