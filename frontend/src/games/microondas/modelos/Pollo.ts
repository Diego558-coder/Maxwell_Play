import { ComponenteMicroondas, IDS } from "./ComponenteMicroondas";

export class Pollo extends ComponenteMicroondas {
  constructor(colocado = false) {
    super(IDS.plate, "Pollo", "🍗", "plateZone", "✅ Pollo colocado en el microondas", colocado);
  }

  conColocado(colocado: boolean): ComponenteMicroondas {
    return new Pollo(colocado);
  }
}
