export class Bombillo {
  readonly potencia: number;

  private constructor(potencia: number) {
    this.potencia = potencia;
  }

  static crear(): Bombillo {
    return new Bombillo(0);
  }

  conPotencia(potencia: number): Bombillo {
    return new Bombillo(potencia);
  }

  get estaEncendido(): boolean {
    return this.potencia >= 100;
  }
}
