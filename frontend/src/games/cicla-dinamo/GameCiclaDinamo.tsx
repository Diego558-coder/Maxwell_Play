import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import EscenaJuegoCiclaDinamo from "./Scene";
// Si en tu proyecto usas lo mismo que el tren:
import { useReglasDelJuego } from "@/hooks/useReglasDelJuego";
import { registrarProgreso } from "@/lib/api";
import { marcarCompletado } from "../../lib/progreso";

const ID_JUEGO = 4; // id asignado en la tabla Minijuego

type Umbrales = { oro_seg: number; plata_seg: number; bronce_seg: number };

export default function GameCiclaDinamo() {
  const [seg, setSeg] = useState(0);
  const [running, setRunning] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const { umbrales } = useReglasDelJuego(ID_JUEGO);

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

  async function alCompletarJuego() {
    setRunning(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const medalla = medallaPorTiempo(seg);
    try {
      await registrarProgreso(ID_JUEGO, { tiempo_seg: seg, completado: 1, medalla });
      marcarCompletado("cicla-dinamo");
      setMsg(`🏁 Juego finalizado — ${seg}s → ${medalla}`);
      setTimeout(() => navigate("/menu"), 2200);
    } catch (e) {
      const err = e as { response?: { data?: { msg?: string } } };
      setMsg(err?.response?.data?.msg || "⚠️ No se pudo guardar el progreso.");
    }
  }

  // La Scene ahora muestra la cabecera y el cronómetro integrado
  return (
    <div className="relative h-[100dvh] w-full">
      <EscenaJuegoCiclaDinamo alGanar={alCompletarJuego} segundosTranscurridos={seg} />

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 text-white/90 text-sm whitespace-nowrap">
        {um && (
          <div className="mb-1 bg-white/15 rounded px-3 py-1">
            Umbrales → Oro ≤ {um.oro_seg}s · Plata ≤ {um.plata_seg}s · Bronce ≤ {um.bronce_seg}s
          </div>
        )}
        {msg && <div className="bg-white/20 rounded px-3 py-1">{msg}</div>}
      </div>
    </div>
  );
}
