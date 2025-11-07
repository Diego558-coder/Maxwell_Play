
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReglasDelJuego } from "@/hooks/useReglasDelJuego";
import { registrarProgreso } from "@/lib/api";
import { marcarCompletado } from "../../lib/progreso";
import GameAmpereMaxwellScene from "./index.tsx";

const ID_JUEGO = 1; 
const LOCAL_KEY = "ampere-maxwell";

type Umbrales = { oro_seg: number; plata_seg: number; bronce_seg: number };

export default function GameMicroondas() {
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
    return { oro_seg: umbrales.oro_seg, plata_seg: umbrales.plata_seg, bronce_seg: umbrales.bronce_seg };
  }, [umbrales]);

  function medallaPorTiempo(s: number): "ORO" | "PLATA" | "BRONCE" {
    if (!um) return "BRONCE";
    if (s <= um.oro_seg)   return "ORO";
    if (s <= um.plata_seg) return "PLATA";
    return "BRONCE";
  }

  async function onExitoJuego() {
    
    setRunning(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const medalla = medallaPorTiempo(seg);
    try {
      await registrarProgreso(ID_JUEGO, { tiempo_seg: seg, completado: 1, medalla });
      marcarCompletado(LOCAL_KEY);
      setMsg(`🏁 Juego finalizado — ${seg}s → ${medalla}`);
      setTimeout(() => navigate("/menu"), 2200);
    } catch (err) {
      console.error(err);
      setMsg("⚠️ No se pudo guardar el progreso.");
    }
  }

  return (
    <div className="h-dvh w-full overflow-hidden bg-gradient-to-br from-slate-800 to-blue-700">
      <div className="sticky top-0 z-10 bg-white/10 backdrop-blur p-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/menu")}
              className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 font-semibold text-sm"
            >
              ← Menú
            </button>
            <h1 className="font-bold text-lg">Microondas — Ley de Ampère–Maxwell</h1>
          </div>
          <div className="rounded-lg bg-white/20 px-3 py-1 font-bold">⏱ {seg}s</div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 pb-8">
        <GameAmpereMaxwellScene onWin={onExitoJuego} />
        <div className="mt-3 text-sm opacity-90 text-white">
          {um && <>Umbrales → Oro ≤ {um.oro_seg}s · Plata ≤ {um.plata_seg}s · Bronce ≤ {um.bronce_seg}s</>}
          {msg && <div className="mt-2 bg-white/20 rounded px-3 py-2">{msg}</div>}
        </div>
      </div>
    </div>
  );
}
