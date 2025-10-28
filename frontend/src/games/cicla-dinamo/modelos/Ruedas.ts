export class Ruedas {
  readonly delanteraMontada: boolean;
  readonly traseraMontada: boolean;

  private constructor(delantera: boolean, trasera: boolean) {
    this.delanteraMontada = delantera;
    this.traseraMontada = trasera;
  }

  static crear(): Ruedas {
    return new Ruedas(false, false);
  }

  conDelanteraMontada(montada: boolean): Ruedas {
    return new Ruedas(montada, this.traseraMontada);
  }

  conTraseraMontada(montada: boolean): Ruedas {
    return new Ruedas(this.delanteraMontada, montada);
  }

  get estanMontadas(): boolean {
    return this.delanteraMontada && this.traseraMontada;
  }
}
