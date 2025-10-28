import { Electron } from "./Electron";
import type { Vector2Init } from "./Vector2";
import { Vector2 } from "./Vector2";

export type GloboInit = {
  id: number;
  color: string;
  pos: Vector2;
  vel: Vector2;
  charged: boolean;
  falling: boolean;
  rope: number;
  electrons: Electron[];
};

type ElectronFactory = () => Electron[];

export class Globo {
  private readonly state: GloboInit;

  private constructor(state: GloboInit) {
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

  private clone(overrides: Partial<GloboInit>): Globo {
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

  withPosition(pos: Vector2 | Vector2Init): Globo {
    return this.clone({ pos: Vector2.from(pos) });
  }

  withVelocity(vel: Vector2 | Vector2Init): Globo {
    return this.clone({ vel: Vector2.from(vel) });
  }

  withRope(rope: number): Globo {
    return this.clone({ rope });
  }

  withFalling(falling: boolean): Globo {
    return this.clone({ falling });
  }

  ensureElectrons(factory: ElectronFactory): Globo {
    if (!this.state.charged) return this;
    if (this.state.electrons.length > 0) return this;
    return this.clone({ electrons: factory() });
  }

  withCharged(charged: boolean, factory?: ElectronFactory): Globo {
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
