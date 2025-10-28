import type { Polo } from "./Polo";

export type ConfiguracionVagon = {
  id: number;
  poloIzquierdo: Polo;
  poloDerecho: Polo;
};

export class Vagon {
  readonly id: number;
  readonly poloIzquierdo: Polo;
  readonly poloDerecho: Polo;

  private constructor(config: ConfiguracionVagon) {
    this.id = config.id;
    this.poloIzquierdo = config.poloIzquierdo;
    this.poloDerecho = config.poloDerecho;
  }

  static crear(config: ConfiguracionVagon): Vagon {
    return new Vagon({
      id: config.id,
      poloIzquierdo: config.poloIzquierdo,
      poloDerecho: config.poloDerecho,
    });
  }

  static copiar(vagon: Vagon): Vagon {
    return new Vagon({
      id: vagon.id,
      poloIzquierdo: vagon.poloIzquierdo,
      poloDerecho: vagon.poloDerecho,
    });
  }

  girar(): Vagon {
    return new Vagon({
      id: this.id,
      poloIzquierdo: this.poloDerecho,
      poloDerecho: this.poloIzquierdo,
    });
  }
}
