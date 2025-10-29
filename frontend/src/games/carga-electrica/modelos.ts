import { ALTO_GLOBO, ANCHO_GLOBO } from "./constants";

type Vector2Inicial = { x: number; y: number };

type ElectronInicial = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  x: number;
  y: number;
};

type GloboInicial = {
  id: number;
  color: string;
  pos: Vector2;
  vel: Vector2;
  charged: boolean;
  falling: boolean;
  rope: number;
  electrons: Electron[];
};

export class Vector2 {
  public readonly x: number
  public readonly y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  static from(init: Vector2 | Vector2Inicial): Vector2 {
    if (init instanceof Vector2) return init;
    return new Vector2(init.x, init.y);
  }

  add(dx: number, dy: number): Vector2 {
    return new Vector2(this.x + dx, this.y + dy);
  }

  scale(f: number): Vector2 {
    return new Vector2(this.x * f, this.y * f);
  }

  clamp(minX: number, maxX: number, minY: number, maxY: number): Vector2 {
    const x = Math.min(Math.max(this.x, minX), maxX);
    const y = Math.min(Math.max(this.y, minY), maxY);
    return new Vector2(x, y);
  }

  with({ x = this.x, y = this.y }: Partial<Vector2Inicial>): Vector2 {
    return new Vector2(x, y);
  }
}

export class Electron {
  public readonly angle: number;
  public readonly radius: number;
  public readonly speed: number;
  public readonly size: number;
  public readonly x: number;
  public readonly y: number;

  constructor(angle: number, radius: number, speed: number, size: number, x: number, y: number) {
    this.angle = angle;
    this.radius = radius;
    this.speed = speed;
    this.size = size;
    this.x = x;
    this.y = y;
  }

  static create(init: Electron | ElectronInicial): Electron {
    if (init instanceof Electron) return init;
    return new Electron(init.angle, init.radius, init.speed, init.size, init.x, init.y);
  }

  advance(rx: number, ry: number): Electron {
    const nextAngle = this.angle + this.speed;
  const centerX = ANCHO_GLOBO / 2;
  const centerY = ALTO_GLOBO / 2;
    const x = centerX + Math.cos(nextAngle) * rx * this.radius;
    const y = centerY + Math.sin(nextAngle) * ry * this.radius;
    return new Electron(nextAngle, this.radius, this.speed, this.size, x, y);
  }
}

export class Globo {
  private readonly state: GloboInicial;

  private constructor(state: GloboInicial) {
    this.state = {
      id: state.id,
      color: state.color,
      pos: Vector2.from(state.pos),
      vel: Vector2.from(state.vel),
      charged: state.charged,
      falling: state.falling,
      rope: state.rope,
      electrons: state.electrons.map(Electron.create),
    };
  }

  static create({ id, color }: { id: number; color: string }): Globo {
    return new Globo({
      id,
      color,
      pos: Vector2.zero(),
      vel: Vector2.zero(),
      charged: false,
      falling: false,
      rope: 0,
      electrons: [],
    });
  }

  get id(): number { return this.state.id; }
  get color(): string { return this.state.color; }
  get pos(): Vector2 { return this.state.pos; }
  get vel(): Vector2 { return this.state.vel; }
  get charged(): boolean { return this.state.charged; }
  get falling(): boolean { return this.state.falling; }
  get rope(): number { return this.state.rope; }
  get electrons(): Electron[] { return this.state.electrons; }

  private clone(overrides: Partial<GloboInicial>): Globo {
    return new Globo({
      id: overrides.id ?? this.state.id,
      color: overrides.color ?? this.state.color,
      pos: overrides.pos ? Vector2.from(overrides.pos) : this.state.pos,
      vel: overrides.vel ? Vector2.from(overrides.vel) : this.state.vel,
      charged: overrides.charged ?? this.state.charged,
      falling: overrides.falling ?? this.state.falling,
      rope: overrides.rope ?? this.state.rope,
      electrons: overrides.electrons
        ? overrides.electrons.map(Electron.create)
        : this.state.electrons,
    });
  }

  withPosition(pos: Vector2 | Vector2Inicial): Globo {
    return this.clone({ pos: Vector2.from(pos) });
  }

  withVelocity(vel: Vector2 | Vector2Inicial): Globo {
    return this.clone({ vel: Vector2.from(vel) });
  }

  withRope(rope: number): Globo {
    return this.clone({ rope });
  }

  withFalling(falling: boolean): Globo {
    return this.clone({ falling });
  }

  ensureElectrons(factory: () => Electron[]): Globo {
    if (!this.state.charged) return this;
    if (this.state.electrons.length > 0) return this;
    return this.clone({ electrons: factory() });
  }

  withCharged(charged: boolean, factory?: () => Electron[]): Globo {
    if (!charged) return this.clone({ charged: false, electrons: [] });
    const electrons = factory ? factory() : this.state.electrons;
    return this.clone({ charged: true, electrons: electrons.map(Electron.create) });
  }

  withElectrons(electrons: Electron[]): Globo {
    return this.clone({ electrons });
  }

  withColor(color: string): Globo {
    return this.clone({ color });
  }

  stepElectrons(rx: number, ry: number): Globo {
    if (!this.state.charged) return this;
    const electrons = (this.state.electrons.length ? this.state.electrons : []).map((e) =>
      Electron.create(e).advance(rx, ry),
    );
    return this.clone({ electrons });
  }
}

export class Mesa {
  public readonly x: number;
  public readonly y: number;
  public readonly w: number;
  public readonly h: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  get rect() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
}

export class Papelito {
  public readonly id: number;
  public readonly rand: number;

  constructor(id: number, rand: number) {
    this.id = id;
    this.rand = rand;
  }
}
