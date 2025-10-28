export class Dinamo {
  readonly apoyada: boolean;

  private constructor(apoyada: boolean) {
    this.apoyada = apoyada;
  }

  static crear(): Dinamo {
    return new Dinamo(false);
  }

  conApoyo(apoyada: boolean): Dinamo {
    return new Dinamo(apoyada);
  }

  get estaApoyada(): boolean {
    return this.apoyada;
  }
}
