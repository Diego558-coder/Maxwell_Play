import type { Locomotora } from "./Locomotora";
import { Vagon } from "./Vagon";

export type EstadoAcoples = {
  conLocomotora: boolean | null;
  entreVagones: Array<boolean | null>;
};

export class Riel {
  private readonly ranuras: Array<Vagon | null>;

  private constructor(ranuras: Array<Vagon | null>) {
    this.ranuras = ranuras;
  }

  static crear(capacidad: number): Riel {
    return new Riel(Array.from({ length: capacidad }, () => null));
  }

  obtenerRanuras(): ReadonlyArray<Vagon | null> {
    return this.ranuras;
  }

  capacidad(): number {
    return this.ranuras.length;
  }

  obtener(posicion: number): Vagon | null {
    return this.ranuras[posicion] ?? null;
  }

  colocar(posicion: number, vagon: Vagon): { riel: Riel; desplazado: Vagon | null } {
    const copia = this.ranuras.slice();
    const desplazado = copia[posicion];
    copia[posicion] = Vagon.copiar(vagon);
    return { riel: new Riel(copia), desplazado };
  }

  remover(posicion: number): { riel: Riel; removido: Vagon | null } {
    const existente = this.ranuras[posicion];
    if (!existente) return { riel: this, removido: null };
    const copia = this.ranuras.slice();
    copia[posicion] = null;
    return { riel: new Riel(copia), removido: existente };
  }

  girar(posicion: number): Riel {
    const actual = this.ranuras[posicion];
    if (!actual) return this;
    const copia = this.ranuras.slice();
    copia[posicion] = actual.girar();
    return new Riel(copia);
  }

  contarVagones(): number {
    return this.ranuras.reduce((acc, v) => (v ? acc + 1 : acc), 0);
  }

  sinHuecos(): boolean {
    let huecoEncontrado = false;
    for (const slot of this.ranuras) {
      if (slot == null) huecoEncontrado = true;
      else if (huecoEncontrado) return false;
    }
    return true;
  }

  polaridadValida(vagon: Vagon, posicion: number, locomotora: Locomotora): boolean {
    if (posicion === 0) {
      return locomotora.acopleValidoCon(vagon);
    }
    const vecinoIzquierdo = this.ranuras[posicion - 1];
    if (!vecinoIzquierdo) return true;
    return vagon.poloIzquierdo !== vecinoIzquierdo.poloDerecho;
  }

  acoples(locomotora: Locomotora): EstadoAcoples {
    const conLocomotora = this.ranuras[0]
      ? this.ranuras[0]!.poloIzquierdo !== locomotora.poloDerecho
      : null;
    const entreVagones: Array<boolean | null> = [];
    for (let i = 1; i < this.ranuras.length; i++) {
      const actual = this.ranuras[i];
      const previo = this.ranuras[i - 1];
      if (actual && previo) {
        entreVagones.push(actual.poloIzquierdo !== previo.poloDerecho);
      } else {
        entreVagones.push(null);
      }
    }
    return { conLocomotora, entreVagones };
  }
}
