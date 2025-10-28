import { Vagon } from "./Vagon";

export class DepositoVagones {
  private readonly vagones: Vagon[];

  private constructor(vagones: Vagon[]) {
    this.vagones = vagones;
  }

  static crear(vagones: Vagon[]): DepositoVagones {
    return new DepositoVagones(vagones.map(Vagon.copiar));
  }

  listar(): ReadonlyArray<Vagon> {
    return this.vagones;
  }

  contiene(id: number): boolean {
    return this.vagones.some((v) => v.id === id);
  }

  buscar(id: number): Vagon | undefined {
    return this.vagones.find((v) => v.id === id);
  }

  girarVagon(id: number): DepositoVagones {
    const actualizados = this.vagones.map((v) => (v.id === id ? v.girar() : v));
    return new DepositoVagones(actualizados);
  }

  remover(id: number): { deposito: DepositoVagones; extraido: Vagon | null } {
    const indice = this.vagones.findIndex((v) => v.id === id);
    if (indice === -1) return { deposito: this, extraido: null };
    const copia = this.vagones.slice();
    const [extraido] = copia.splice(indice, 1);
    return { deposito: new DepositoVagones(copia), extraido };
  }

  agregarAlFinal(vagon: Vagon): DepositoVagones {
    return new DepositoVagones([...this.vagones, Vagon.copiar(vagon)]);
  }
}
