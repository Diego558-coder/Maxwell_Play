import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CargaElectrica from "./index";
import { useReglasDelJuego } from "@/hooks/useReglasDelJuego";
import { registrarProgreso } from "@/lib/api";
import { marcarCompletado } from "../../lib/progreso";

const ID_JUEGO = 2;           // el de MySQL
const ETIQUETA_URL = "carga-electrica";

export default function JuegoCargaElectrica() {
  const { umbrales, cargando, error } = useReglasDelJuego(ID_JUEGO);
  const navegar = useNavigate();

  const [segundos, definirSegundos] = useState(0);
  const [enMarcha, definirEnMarcha] = useState(false);
  const temporizadorRef = useRef<number | null>(null);

  useEffect(() => {
    if (enMarcha && temporizadorRef.current == null) {
      temporizadorRef.current = window.setInterval(() => definirSegundos((segundosPrevios) => segundosPrevios + 1), 1000);
    }
    return () => {
      if (temporizadorRef.current) {
        clearInterval(temporizadorRef.current);
        temporizadorRef.current = null;
      }
    };
  }, [enMarcha]);

  const inicioRegistradoRef = useRef(false);
  useEffect(() => {
    const iniciarAlPrimerToque: EventListener = () => {
      if (!inicioRegistradoRef.current) {
        inicioRegistradoRef.current = true;
        definirEnMarcha(true);
      }
    };
    window.addEventListener("pointerdown", iniciarAlPrimerToque, { once: true });
    return () => window.removeEventListener("pointerdown", iniciarAlPrimerToque);
  }, []);

  const medalla = useMemo<"ORO"|"PLATA"|"BRONCE"|undefined>(() => {
    if (!umbrales) return undefined;
    if (segundos <= umbrales.oro_seg) return "ORO";
    if (segundos <= umbrales.plata_seg) return "PLATA";
    if (segundos <= umbrales.bronce_seg) return "BRONCE";
    return "BRONCE";
  }, [segundos, umbrales]);

  const [mensaje, definirMensaje] = useState("");

  async function alExitoDelJuego() {
    definirEnMarcha(false);
    try {
  await registrarProgreso(ID_JUEGO, {
        tiempo_seg: segundos,
        completado: 1,
        medalla,
      });
      marcarCompletado(ETIQUETA_URL);
      definirMensaje(`🏁 Juego finalizado — ${segundos}s → ${medalla || "BRONCE"}`);
      // Redirigir al menú tras una breve pausa
      setTimeout(() => navegar("/menu"), 2200);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { msg?: string } } };
      definirMensaje(err?.response?.data?.msg || "Error guardando progreso");
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
          <div className="rounded-lg bg-white/20 px-3 py-1 font-bold">⏱ {segundos}s</div>
        </div>
      </div>

      {/* Escenario del juego a lo ancho */}
      <div className="max-w-[1400px] mx-auto p-6 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-xl">
        <CargaElectrica onExito={alExitoDelJuego} />
        <div className="mt-3 text-sm opacity-90">
          {umbrales && <>Umbrales → Oro ≤ {umbrales.oro_seg}s · Plata ≤ {umbrales.plata_seg}s · Bronce ≤ {umbrales.bronce_seg}s</>}
          {mensaje && <div className="mt-2 bg-white/20 rounded px-3 py-2">{mensaje}</div>}
        </div>
      </div>
    </div>
  );
}
