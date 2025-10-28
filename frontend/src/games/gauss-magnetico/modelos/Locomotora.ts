import type { Polo } from "./Polo";
import type { Vagon } from "./Vagon";

export class Locomotora {
  readonly poloIzquierdo: Polo;
  readonly poloDerecho: Polo;

  private constructor(poloIzquierdo: Polo, poloDerecho: Polo) {
    this.poloIzquierdo = poloIzquierdo;
    this.poloDerecho = poloDerecho;
  }

  static crear(poloIzquierdo: Polo, poloDerecho: Polo): Locomotora {
    return new Locomotora(poloIzquierdo, poloDerecho);
  }

  acopleValidoCon(vagon: Vagon): boolean {
    return vagon.poloIzquierdo !== this.poloDerecho;
  }
}
