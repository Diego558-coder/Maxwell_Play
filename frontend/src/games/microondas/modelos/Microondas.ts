import { CavidadMetalica } from "./CavidadMetalica";
import { ComponenteMicroondas, IDS } from "./ComponenteMicroondas";
import type { IdComponenteMicroondas } from "./ComponenteMicroondas";
import { FuenteEnergia } from "./FuenteEnergia";
import { Magnetron } from "./Magnetron";
import { Pollo } from "./Pollo";
import { PuertaHorno } from "./PuertaHorno";
import { ZonaColocacion } from "./ZonaColocacion";

export type ResultadoColocacion = {
  exito: boolean;
  juego: Microondas;
  mensaje?: string;
};

export class Microondas {
  readonly componentes: ReadonlyArray<ComponenteMicroondas>;
  readonly zonas: ReadonlyArray<ZonaColocacion>;
  readonly estaEncendido: boolean;
  readonly tiempoRestante: number;
  readonly duracionCoccion: number;

  constructor(
    componentes: ReadonlyArray<ComponenteMicroondas>,
    zonas: ReadonlyArray<ZonaColocacion>,
    estaEncendido: boolean,
    tiempoRestante: number,
    duracionCoccion: number
  ) {
    this.componentes = componentes;
    this.zonas = zonas;
    this.estaEncendido = estaEncendido;
    this.tiempoRestante = tiempoRestante;
    this.duracionCoccion = duracionCoccion;
  }

  static crearInicial(duracionCoccion = 7) {
    const componentes: ComponenteMicroondas[] = [
      new Magnetron(),
      new FuenteEnergia(),
      new CavidadMetalica(),
      new Pollo(),
      new PuertaHorno(),
    ];

    const zonas: ZonaColocacion[] = [
      new ZonaColocacion("magnetronZone", "Magnetrón", 28, 28, 56, 28),
      new ZonaColocacion("powerZone", "Energía", 160, 80, 100, 30),
      new ZonaColocacion("cavityZone", "Cavidad", 24, 24, 150, 130),
      new ZonaColocacion("plateZone", "Pollo", 89, 99, 90, 90, { esCircular: true, centrada: true, toleranciaExtra: 20 }),
      new ZonaColocacion("doorZone", "Puerta", 24, 24, 150, 130),
    ];

    return new Microondas(componentes, zonas, false, duracionCoccion, duracionCoccion);
  }

  private clonar(valores: Partial<Omit<Microondas, "duracionCoccion">>) {
    return new Microondas(
      valores.componentes ?? this.componentes,
      valores.zonas ?? this.zonas,
      valores.estaEncendido ?? this.estaEncendido,
      valores.tiempoRestante ?? this.tiempoRestante,
      this.duracionCoccion
    );
  }

  componentesInstalados() {
    return this.componentes.filter((c) => c.colocado).length;
  }

  totalComponentes() {
    return this.componentes.length;
  }

  porcentajeProgreso() {
    return (this.componentesInstalados() / this.totalComponentes()) * 100;
  }

  get ensambladoCompleto() {
    return this.componentesInstalados() === this.totalComponentes();
  }

  componentePorId(id: IdComponenteMicroondas) {
    return this.componentes.find((c) => c.id === id) ?? null;
  }

  zonaPorId(id: string) {
    return this.zonas.find((z) => z.id === id) ?? null;
  }

  zonaObjetivoPara(id: IdComponenteMicroondas) {
    const componente = this.componentePorId(id);
    return componente?.zonaObjetivoId ?? null;
  }

  estaComponenteColocado(id: IdComponenteMicroondas) {
    const componente = this.componentePorId(id);
    return Boolean(componente?.colocado);
  }

  intentarColocarComponente(id: IdComponenteMicroondas, zonaId: string): ResultadoColocacion {
    const componente = this.componentePorId(id);
    if (!componente) {
      return { exito: false, juego: this, mensaje: "❌ Componente desconocido." };
    }
    if (componente.zonaObjetivoId !== zonaId) {
      return { exito: false, juego: this, mensaje: "❌ Componente incorrecto para esta posición." };
    }

    const zona = this.zonaPorId(zonaId);
    if (!zona) {
      return { exito: false, juego: this, mensaje: "❌ Zona de instalación no disponible." };
    }
    if (zona.ocupada) {
      return { exito: false, juego: this, mensaje: "❌ Esta posición ya está ocupada." };
    }

    const validacion = componente.puedeColocarse(this.componentes);
    if (!validacion.valido) {
      return { exito: false, juego: this, mensaje: validacion.mensaje };
    }

    const nuevasZonas = this.zonas.map((z) => (z.id === zonaId ? z.conOcupada(true) : z));
    const nuevosComponentes = this.componentes.map((c) => (c.id === id ? c.conColocado(true) : c));

    return {
      exito: true,
      juego: this.clonar({ componentes: nuevosComponentes, zonas: nuevasZonas }),
      mensaje: componente.mensajeExito,
    };
  }

  alternarEncendido() {
    if (!this.ensambladoCompleto) {
      return this;
    }

    if (this.estaEncendido) {
      return this.clonar({ estaEncendido: false });
    }

    return this.clonar({ estaEncendido: true, tiempoRestante: this.duracionCoccion });
  }

  avanzarSegundo() {
    if (!this.estaEncendido) {
      return this;
    }

    if (this.tiempoRestante <= 1) {
      return this.clonar({ estaEncendido: false, tiempoRestante: 0 });
    }

    return this.clonar({ tiempoRestante: this.tiempoRestante - 1 });
  }

  reiniciar() {
    return Microondas.crearInicial(this.duracionCoccion);
  }
}

export { IDS };
export type { IdComponenteMicroondas };
