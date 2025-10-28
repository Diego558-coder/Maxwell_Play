import { ComponenteMicroondas, IDS } from "./ComponenteMicroondas";
import type { ValidacionColocacion } from "./ComponenteMicroondas";

export class PuertaHorno extends ComponenteMicroondas {
  constructor(colocado = false) {
    super(IDS.door, "Puerta del Horno", "🚪", "doorZone", "✅ Puerta del horno montada", colocado);
  }

  conColocado(colocado: boolean): ComponenteMicroondas {
    return new PuertaHorno(colocado);
  }

  puedeColocarse(componentes: ReadonlyArray<ComponenteMicroondas>): ValidacionColocacion {
    const base = super.puedeColocarse(componentes);
    if (!base.valido) return base;

    const faltantes = componentes.filter((c) => c.id !== this.id && !c.colocado);
    if (faltantes.length > 0) {
      return {
        valido: false,
        mensaje: "❌ La puerta debe instalarse al final, después de los demás componentes.",
      };
    }

    return { valido: true };
  }
}
