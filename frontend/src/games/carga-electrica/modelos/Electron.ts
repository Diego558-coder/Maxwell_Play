import { BALLOON_H, BALLOON_W } from "../constants";

export type ElectronInit = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  x: number;
  y: number;
};

export class Electron {
  readonly angle: number;
  readonly radius: number;
  readonly speed: number;
  readonly size: number;
  readonly x: number;
  readonly y: number;

  constructor(angle: number, radius: number, speed: number, size: number, x: number, y: number) {
    this.angle = angle;
    this.radius = radius;
    this.speed = speed;
    this.size = size;
    this.x = x;
    this.y = y;
  }

  static create(init: Electron | ElectronInit): Electron {
    if (init instanceof Electron) return init;
    return new Electron(init.angle, init.radius, init.speed, init.size, init.x, init.y);
  }

  advance(rx: number, ry: number): Electron {
    const nextAngle = this.angle + this.speed;
    const centerX = BALLOON_W / 2;
    const centerY = BALLOON_H / 2;
    const x = centerX + Math.cos(nextAngle) * rx * this.radius;
    const y = centerY + Math.sin(nextAngle) * ry * this.radius;
    return new Electron(nextAngle, this.radius, this.speed, this.size, x, y);
  }
}
