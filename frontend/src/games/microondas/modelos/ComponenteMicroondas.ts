export const IDS = {
  magnetron: "magnetron",
  power: "powerSource",
  cavity: "metalCavity",
  door: "doorComponent",
  plate: "foodPlate",
} as const;

export type IdComponenteMicroondas = (typeof IDS)[keyof typeof IDS];

export type ValidacionColocacion = {
  valido: boolean;
  mensaje?: string;
};

export abstract class ComponenteMicroondas {
  readonly id: IdComponenteMicroondas;
  readonly nombre: string;
  readonly emoji: string;
  readonly zonaObjetivoId: string;
  readonly mensajeExito: string;
  readonly colocado: boolean;

  protected constructor(
    id: IdComponenteMicroondas,
    nombre: string,
    emoji: string,
    zonaObjetivoId: string,
    mensajeExito: string,
    colocado: boolean
  ) {
    this.id = id;
    this.nombre = nombre;
    this.emoji = emoji;
    this.zonaObjetivoId = zonaObjetivoId;
    this.mensajeExito = mensajeExito;
    this.colocado = colocado;
  }

  get etiqueta() {
    return `${this.emoji} ${this.nombre}`;
  }

  /**
   * Retorna una nueva instancia con el estado de colocación actualizado.
   */
  abstract conColocado(colocado: boolean): ComponenteMicroondas;

  /**
   * Permite a cada componente validar si ya se cumplen las condiciones para instalarse.
   */
  puedeColocarse(componentes: ReadonlyArray<ComponenteMicroondas>): ValidacionColocacion {
    if (this.colocado) {
      return { valido: false, mensaje: "❌ Este componente ya fue instalado." };
    }
    void componentes;
    return { valido: true };
  }
}
