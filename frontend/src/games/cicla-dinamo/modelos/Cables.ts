export class Cables {
  readonly positivoConectado: boolean;
  readonly negativoConectado: boolean;

  private constructor(positivo: boolean, negativo: boolean) {
    this.positivoConectado = positivo;
    this.negativoConectado = negativo;
  }

  static crear(): Cables {
    return new Cables(false, false);
  }

  conPositivoConectado(conectado: boolean): Cables {
    return new Cables(conectado, this.negativoConectado);
  }

  conNegativoConectado(conectado: boolean): Cables {
    return new Cables(this.positivoConectado, conectado);
  }

  get estanCompletos(): boolean {
    return this.positivoConectado && this.negativoConectado;
  }
}
