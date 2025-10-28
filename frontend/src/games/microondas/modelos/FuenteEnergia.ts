import { ComponenteMicroondas, IDS } from "./ComponenteMicroondas";

export class FuenteEnergia extends ComponenteMicroondas {
  constructor(colocado = false) {
    super(IDS.power, "Fuente de Energía", "🔌", "powerZone", "✅ Fuente de energía conectada", colocado);
  }

  conColocado(colocado: boolean): ComponenteMicroondas {
    return new FuenteEnergia(colocado);
  }
}
