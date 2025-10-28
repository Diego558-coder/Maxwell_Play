import { ComponenteMicroondas, IDS } from "./ComponenteMicroondas";

export class CavidadMetalica extends ComponenteMicroondas {
  constructor(colocado = false) {
    super(IDS.cavity, "Cavidad Metálica", "🏠", "cavityZone", "✅ Cavidad metálica instalada", colocado);
  }

  conColocado(colocado: boolean): ComponenteMicroondas {
    return new CavidadMetalica(colocado);
  }
}
