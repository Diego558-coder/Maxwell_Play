import { DepositoVagones } from "./DepositoVagones";
import type { EstadoAcoples } from "./Riel";
import { Riel } from "./Riel";
import { Locomotora } from "./Locomotora";
import type { Polo } from "./Polo";
import { Vagon, type ConfiguracionVagon } from "./Vagon";

type AjustesJuego = {
  vagones: ConfiguracionVagon[];
  capacidad: number;
  locomotora?: { poloIzquierdo: Polo; poloDerecho: Polo };
};

type ResultadoColocacion = "ok" | "sin-seleccion" | "polaridad";

type ResultadoColocar = {
  juego: JuegoGaussMagnetico;
  estado: ResultadoColocacion;
};

export class JuegoGaussMagnetico {
  readonly locomotora: Locomotora;
  readonly deposito: DepositoVagones;
  readonly riel: Riel;
  readonly seleccionadoId: number | null;

  private constructor(params: {
    locomotora: Locomotora;
    deposito: DepositoVagones;
    riel: Riel;
    seleccionadoId: number | null;
  }) {
    this.locomotora = params.locomotora;
    this.deposito = params.deposito;
    this.riel = params.riel;
    this.seleccionadoId = params.seleccionadoId;
  }

  static crearInicial(config: AjustesJuego): JuegoGaussMagnetico {
    const locomotora = Locomotora.crear(
      config.locomotora?.poloIzquierdo ?? "S",
      config.locomotora?.poloDerecho ?? "N",
    );
    const vagones = config.vagones.map((v) =>
      Vagon.crear({ id: v.id, poloIzquierdo: v.poloIzquierdo, poloDerecho: v.poloDerecho })
    );
    const deposito = DepositoVagones.crear(vagones);
    const riel = Riel.crear(config.capacidad);
    return new JuegoGaussMagnetico({
      locomotora,
      deposito,
      riel,
      seleccionadoId: null,
    });
  }

  private clonar(parcial: Partial<{ deposito: DepositoVagones; riel: Riel; seleccionadoId: number | null }>): JuegoGaussMagnetico {
    return new JuegoGaussMagnetico({
      locomotora: this.locomotora,
      deposito: parcial.deposito ?? this.deposito,
      riel: parcial.riel ?? this.riel,
      seleccionadoId: parcial.seleccionadoId ?? this.seleccionadoId,
    });
  }

  listarVagones(): ReadonlyArray<Vagon> {
    return this.deposito.listar();
  }

  obtenerRanuras(): ReadonlyArray<Vagon | null> {
    return this.riel.obtenerRanuras();
  }

  alternarSeleccion(id: number): JuegoGaussMagnetico {
    if (!this.deposito.contiene(id)) return this;
    const nuevoId = this.seleccionadoId === id ? null : id;
    return this.clonar({ seleccionadoId: nuevoId });
  }

  girarVagonEnDeposito(id: number): JuegoGaussMagnetico {
    if (!this.deposito.contiene(id)) return this;
    return this.clonar({ deposito: this.deposito.girarVagon(id) });
  }

  girarVagonEnSlot(posicion: number): JuegoGaussMagnetico {
    return this.clonar({ riel: this.riel.girar(posicion) });
  }

  removerDeSlot(posicion: number): JuegoGaussMagnetico {
    const { riel, removido } = this.riel.remover(posicion);
    if (!removido) return this;
    const deposito = this.deposito.agregarAlFinal(removido);
    return this.clonar({ riel, deposito });
  }

  colocarSeleccionEn(posicion: number): ResultadoColocar {
    if (this.seleccionadoId == null) {
      return { juego: this, estado: "sin-seleccion" };
    }
    const seleccionado = this.deposito.buscar(this.seleccionadoId);
    if (!seleccionado) {
      return { juego: this, estado: "sin-seleccion" };
    }
    if (!this.riel.polaridadValida(seleccionado, posicion, this.locomotora)) {
      return { juego: this, estado: "polaridad" };
    }
    const { deposito: depositoRestante, extraido } = this.deposito.remover(seleccionado.id);
    if (!extraido) {
      return { juego: this, estado: "sin-seleccion" };
    }
    const { riel: rielActualizado, desplazado } = this.riel.colocar(posicion, extraido);
    let depositoFinal = depositoRestante;
    if (desplazado) depositoFinal = depositoFinal.agregarAlFinal(desplazado);
    const juego = this.clonar({
      deposito: depositoFinal,
      riel: rielActualizado,
      seleccionadoId: null,
    });
    return { juego, estado: "ok" };
  }

  contarVagones(): number {
    return this.riel.contarVagones();
  }

  capacidad(): number {
    return this.riel.capacidad();
  }

  sinHuecos(): boolean {
    return this.riel.sinHuecos();
  }

  estadoAcoples(): EstadoAcoples {
    return this.riel.acoples(this.locomotora);
  }

  acoplesCorrectos(): boolean {
    const acoples = this.estadoAcoples();
    const todosLocos = acoples.conLocomotora !== false;
    const todosEntre = acoples.entreVagones.every((val) => val !== false);
    return todosLocos && todosEntre;
  }

  listoParaAvanzar(): boolean {
    return this.contarVagones() === this.capacidad() && this.sinHuecos() && this.acoplesCorrectos();
  }
}
