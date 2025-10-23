import { useEffect, useMemo, useRef, useState } from "react";
import GameCiclaDinamoScene from "./Scene";
// Si en tu proyecto usas lo mismo que el tren:
import { useReglasJuego } from "@/hooks/useReglasJuego";
import { postProgreso } from "@/lib/api";

const ID_JUEGO = 3; // pon el id que te corresponda

type Umbrales = { oro_seg: number; plata_seg: number; bronce_seg: number };

export default function GameCiclaDinamo() {
  const [seg, setSeg] = useState(0);
  const [running, setRunning] = useState(true);
  const [, setMsg] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const { umbrales } = useReglasJuego(ID_JUEGO);

  useEffect(() => {
    if (!running) return;
    timerRef.current = window.setInterval(() => setSeg((s) => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const um: Umbrales | null = useMemo(() => {
    if (!umbrales) return null;
    return {
      oro_seg: umbrales.oro_seg, plata_seg: umbrales.plata_seg, bronce_seg: umbrales.bronce_seg
    };
  }, [umbrales]);

  function medallaPorTiempo(s: number): "ORO" | "PLATA" | "BRONCE" {
    if (!um) return "BRONCE";
    if (s <= um.oro_seg) return "ORO";
    if (s <= um.plata_seg) return "PLATA";
    return "BRONCE";
  }

  async function onExito() {
    setRunning(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const medalla = medallaPorTiempo(seg);
    try {
      await postProgreso(ID_JUEGO, { tiempo_seg: seg, completado: 1, medalla });
      setMsg(`Progreso guardado: ${seg}s → ${medalla}`);
    } catch {
      setMsg("⚠️ No se pudo guardar el progreso.");
    }
  }

  // La Scene ahora muestra la cabecera y el cronómetro integrado
  return (
    <GameCiclaDinamoScene onWin={onExito} timeSec={seg} />
  );
}
