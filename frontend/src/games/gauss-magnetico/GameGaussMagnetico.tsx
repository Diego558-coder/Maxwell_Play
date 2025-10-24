// src/games/gauss-magnetico/GameGaussMagnetico.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReglasJuego } from "@/hooks/useReglasJuego";
import { postProgreso } from "@/lib/api";
import { markCompleted } from "@/lib/progress";
import GameGaussMagneticoScene from "./index";

const ID_JUEGO = 3;

type Umbrales = { oro_seg: number; plata_seg: number; bronce_seg: number };

export default function GameGaussMagnetico() {
  const [seg, setSeg] = useState(0);
  const [running, setRunning] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const { umbrales } = useReglasJuego(ID_JUEGO);

  useEffect(() => {
    if (!running) return;
    timerRef.current = window.setInterval(() => setSeg((s) => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const um: Umbrales | null = useMemo(() => {
    if (!umbrales) return null;
    return {
      oro_seg: umbrales.oro_seg,
      plata_seg: umbrales.plata_seg,
      bronce_seg: umbrales.bronce_seg,
    };
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
      await postProgreso(ID_JUEGO, { tiempo_seg: seg, completado: 1, medalla });
      markCompleted("gauss-magnetico");
      setMsg(`🏁 Juego finalizado — ${seg}s → ${medalla}`);
      setTimeout(() => navigate("/menu"), 2200);
    } catch (e) {
      const err = e as { response?: { data?: { msg?: string } } };
      setMsg(err?.response?.data?.msg || "⚠️ No se pudo guardar el progreso.");
    }
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-slate-800 to-blue-700">
      {/* Timer fijo y visible */}
      <div className="fixed top-3 right-3 z-50">
        <div className="rounded-full bg-white text-slate-900 shadow-lg px-3 py-1.5 font-extrabold flex items-center gap-1">
          <span>⏱</span><span>{seg}s</span>
        </div>
      </div>

      {/* Escena del juego ocupando toda la pantalla */}
      <GameGaussMagneticoScene onWin={onExitoJuego} />

      {/* Mensajes/umbrales en la parte baja, sin empujar el layout */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 text-white/90 text-sm whitespace-nowrap">
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
