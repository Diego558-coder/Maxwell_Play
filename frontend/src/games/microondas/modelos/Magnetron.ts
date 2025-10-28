import { ComponenteMicroondas, IDS } from "./ComponenteMicroondas";

export class Magnetron extends ComponenteMicroondas {
  constructor(colocado = false) {
    super(IDS.magnetron, "Magnetrón", "📡", "magnetronZone", "✅ Magnetrón instalado", colocado);
  }

  conColocado(colocado: boolean): ComponenteMicroondas {
    return new Magnetron(colocado);
  }
}
