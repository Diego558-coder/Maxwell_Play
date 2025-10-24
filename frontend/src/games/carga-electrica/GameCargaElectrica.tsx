import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CargaElectrica from "./index";
import { useReglasJuego } from "@/hooks/useReglasJuego";
import { postProgreso } from "@/lib/api";
import { markCompleted } from "@/lib/progress";

const ID_JUEGO = 2;           // el de MySQL
const SLUG     = "carga-electrica";

export default function GameCargaElectrica() {
  const { umbrales, cargando, error } = useReglasJuego(ID_JUEGO);
  const navigate = useNavigate();

  const [seg, setSeg] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (running && timerRef.current == null) {
      timerRef.current = window.setInterval(() => setSeg((s) => s + 1), 1000);
    }
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [running]);

  const startedRef = useRef(false);
  useEffect(() => {
    const start: EventListener = () => {
      if (!startedRef.current) { startedRef.current = true; setRunning(true); }
    };
    window.addEventListener("pointerdown", start, { once: true });
    return () => window.removeEventListener("pointerdown", start);
  }, []);

  const medalla = useMemo<"ORO"|"PLATA"|"BRONCE"|undefined>(() => {
    if (!umbrales) return undefined;
    if (seg <= umbrales.oro_seg) return "ORO";
    if (seg <= umbrales.plata_seg) return "PLATA";
    if (seg <= umbrales.bronce_seg) return "BRONCE";
    return "BRONCE";
  }, [seg, umbrales]);

  const [msg, setMsg] = useState("");

  async function onExitoJuego() {
    setRunning(false);
    try {
      await postProgreso(ID_JUEGO, {
        tiempo_seg: seg,
        completado: 1,
        medalla,
      });
      markCompleted(SLUG);
      setMsg(`🏁 Juego finalizado — ${seg}s → ${medalla || "BRONCE"}`);
      // Redirigir al menú tras una breve pausa
      setTimeout(() => navigate("/menu"), 2200);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { msg?: string } } };
      setMsg(err?.response?.data?.msg || "Error guardando progreso");
    }
  }

  if (error)   return <div className="text-red-600">{error}</div>;
  if (cargando && !umbrales) return <div>Cargando umbrales…</div>;

  return (
    <div className="min-h-[100dvh] text-white">
      {/* Encabezado + cronómetro */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-500/70 to-purple-600/70 backdrop-blur p-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <h1 className="font-bold text-lg">Globos — Carga eléctrica</h1>
          <div className="rounded-lg bg-white/20 px-3 py-1 font-bold">⏱ {seg}s</div>
        </div>
      </div>

      {/* Escenario del juego a lo ancho */}
      <div className="max-w-[1400px] mx-auto p-6 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-xl">
        <CargaElectrica onExito={onExitoJuego} />
        <div className="mt-3 text-sm opacity-90">
          {umbrales && <>Umbrales → Oro ≤ {umbrales.oro_seg}s · Plata ≤ {umbrales.plata_seg}s · Bronce ≤ {umbrales.bronce_seg}s</>}
          {msg && <div className="mt-2 bg-white/20 rounded px-3 py-2">{msg}</div>}
        </div>
      </div>
    </div>
  );
}
