export type Vector2 = { x: number; y: number };

export type Electron = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  x: number;
  y: number;
};

export interface Globo {
  id: number;
  color: string;
  pos: Vector2;
  vel: Vector2;
  charged: boolean;
  falling: boolean;
  rope: number;
  electrons?: Electron[];
}

export interface Mesa {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Papelito {
  id: number;
  rand: number;
}
