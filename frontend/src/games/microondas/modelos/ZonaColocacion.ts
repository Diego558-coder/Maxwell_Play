export class ZonaColocacion {
  readonly id: string;
  readonly etiqueta: string;
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
  readonly esCircular: boolean;
  readonly centrada: boolean;
  readonly toleranciaExtra: number;
  readonly ocupada: boolean;

  constructor(
    id: string,
    etiqueta: string,
    top: number,
    left: number,
    width: number,
    height: number,
    opciones?: {
      esCircular?: boolean;
      centrada?: boolean;
      toleranciaExtra?: number;
      ocupada?: boolean;
    }
  ) {
    this.id = id;
    this.etiqueta = etiqueta;
    this.top = top;
    this.left = left;
    this.width = width;
    this.height = height;
    this.esCircular = opciones?.esCircular ?? false;
    this.centrada = opciones?.centrada ?? false;
    this.toleranciaExtra = opciones?.toleranciaExtra ?? 0;
    this.ocupada = opciones?.ocupada ?? false;
  }

  conOcupada(ocupada: boolean) {
    return new ZonaColocacion(this.id, this.etiqueta, this.top, this.left, this.width, this.height, {
      esCircular: this.esCircular,
      centrada: this.centrada,
      toleranciaExtra: this.toleranciaExtra,
      ocupada,
    });
  }
}
