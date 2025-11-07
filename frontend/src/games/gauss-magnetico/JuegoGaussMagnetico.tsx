
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReglasDelJuego } from "@/hooks/useReglasDelJuego";
import { registrarProgreso } from "@/lib/api";
import { marcarCompletado } from "../../lib/progreso";
import EscenaJuegoGaussMagnetico from "./index";
import { CLAVE_JUEGO, ID_JUEGO } from "./constants";

type UmbralesMedalla = { oro_seg: number; plata_seg: number; bronce_seg: number };

export default function JuegoGaussMagnetico() {
  const [segundos, setSegundos] = useState(0);
  const [enMarcha, setEnMarcha] = useState(true);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const temporizadorRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const { umbrales } = useReglasDelJuego(ID_JUEGO);

  useEffect(() => {
    if (!enMarcha) return;
    temporizadorRef.current = window.setInterval(() => setSegundos((valor) => valor + 1), 1000);
    return () => { if (temporizadorRef.current) clearInterval(temporizadorRef.current); };
  }, [enMarcha]);

  const umbralesMedalla: UmbralesMedalla | null = useMemo(() => {
    if (!umbrales) return null;
    return {
      oro_seg: umbrales.oro_seg,
      plata_seg: umbrales.plata_seg,
      bronce_seg: umbrales.bronce_seg,
    };
  }, [umbrales]);

  function medallaPorTiempo(segundosTranscurridos: number): "ORO" | "PLATA" | "BRONCE" {
    if (!umbralesMedalla) return "BRONCE";
    if (segundosTranscurridos <= umbralesMedalla.oro_seg)   return "ORO";
    if (segundosTranscurridos <= umbralesMedalla.plata_seg) return "PLATA";
    return "BRONCE";
  }

  async function alExitoDelJuego() {
    setEnMarcha(false);
    if (temporizadorRef.current) { clearInterval(temporizadorRef.current); temporizadorRef.current = null; }
    const medalla = medallaPorTiempo(segundos);
    try {
    await registrarProgreso(ID_JUEGO, { tiempo_seg: segundos, completado: 1, medalla });
    marcarCompletado(CLAVE_JUEGO);
      setMensaje(`🏁 Juego finalizado — ${segundos}s → ${medalla}`);
      setTimeout(() => navigate("/menu"), 2200);
    } catch (e) {
      const err = e as { response?: { data?: { msg?: string } } };
      setMensaje(err?.response?.data?.msg || "⚠️ No se pudo guardar el progreso.");
    }
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-gradient-to-br from-slate-800 to-blue-700">
      <div className="fixed top-3 right-3 z-50">
        <div className="rounded-full bg-white text-slate-900 shadow-lg px-3 py-1.5 font-extrabold flex items-center gap-1">
          <span>⏱</span><span>{segundos}s</span>
        </div>
      </div>

      <EscenaJuegoGaussMagnetico alGanar={alExitoDelJuego} />

      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 text-white/90 text-sm whitespace-nowrap">
        {umbralesMedalla && (
          <div className="mb-1 bg-white/15 rounded px-3 py-1">
            Umbrales → Oro ≤ {umbralesMedalla.oro_seg}s · Plata ≤ {umbralesMedalla.plata_seg}s · Bronce ≤ {umbralesMedalla.bronce_seg}s
          </div>
        )}
        {mensaje && <div className="bg-white/20 rounded px-3 py-1">{mensaje}</div>}
      </div>
    </div>
  );
}
