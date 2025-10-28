import { Bombillo } from "./Bombillo";
import { Cables } from "./Cables";
import { Dinamo } from "./Dinamo";
import { Ruedas } from "./Ruedas";

export type CiclaDinamoEstado = {
  ruedas: Ruedas;
  dinamo: Dinamo;
  cables: Cables;
  bombillo: Bombillo;
  pedaleoActivado: boolean;
  cadencia: number;
};

export class CiclaDinamo {
  private readonly estado: CiclaDinamoEstado;

  private constructor(estado: CiclaDinamoEstado) {
    this.estado = estado;
  }

  static inicial(): CiclaDinamo {
    return new CiclaDinamo({
      ruedas: Ruedas.crear(),
      dinamo: Dinamo.crear(),
      cables: Cables.crear(),
      bombillo: Bombillo.crear(),
      pedaleoActivado: false,
      cadencia: 0,
    });
  }

  get ruedas(): Ruedas {
    return this.estado.ruedas;
  }

  get dinamo(): Dinamo {
    return this.estado.dinamo;
  }

  get cables(): Cables {
    return this.estado.cables;
  }

  get bombillo(): Bombillo {
    return this.estado.bombillo;
  }

  get estaPedaleando(): boolean {
    return this.estado.pedaleoActivado;
  }

  get cadencia(): number {
    return this.estado.cadencia;
  }

  get potencia(): number {
    return this.estado.bombillo.potencia;
  }

  get estaListaParaPedalear(): boolean {
    return this.ruedas.estanMontadas && this.dinamo.estaApoyada && this.cables.estanCompletos;
  }

  private clonar(parcial: Partial<CiclaDinamoEstado>): CiclaDinamo {
    return new CiclaDinamo({
      ruedas: parcial.ruedas ?? this.estado.ruedas,
      dinamo: parcial.dinamo ?? this.estado.dinamo,
      cables: parcial.cables ?? this.estado.cables,
      bombillo: parcial.bombillo ?? this.estado.bombillo,
      pedaleoActivado: parcial.pedaleoActivado ?? this.estado.pedaleoActivado,
      cadencia: parcial.cadencia ?? this.estado.cadencia,
    });
  }

  conRuedas(ruedas: Ruedas): CiclaDinamo {
    return this.clonar({ ruedas });
  }

  conDinamo(dinamo: Dinamo): CiclaDinamo {
    return this.clonar({ dinamo });
  }

  conCables(cables: Cables): CiclaDinamo {
    return this.clonar({ cables });
  }

  conBombillo(bombillo: Bombillo): CiclaDinamo {
    return this.clonar({ bombillo });
  }

  conPedaleoActivado(pedaleoActivado: boolean): CiclaDinamo {
    return this.clonar({ pedaleoActivado });
  }

  conCadencia(cadencia: number): CiclaDinamo {
    return this.clonar({ cadencia });
  }

  conMetricas(cadencia: number, potencia: number): CiclaDinamo {
    return this.clonar({
      cadencia,
      bombillo: this.estado.bombillo.conPotencia(potencia),
    });
  }

  alternarPedaleo(): CiclaDinamo {
    return this.conPedaleoActivado(!this.estaPedaleando);
  }

  detenerPedaleo(): CiclaDinamo {
    if (!this.estaPedaleando) return this;
    return this.conPedaleoActivado(false);
  }
}
