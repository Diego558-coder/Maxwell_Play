import { useEffect, useMemo, useRef, useState } from "react";
import { registrarProgreso } from "@/lib/api";
import { marcarCompletado } from "../lib/progreso";

// slug -> idJuego (ajústalo con los que tengas)
const MAPEO_ID: Record<string, number> = {
  "microondas": 1,
  // "carga-electrica": 2,
  // "gauss-magnetico": 3,
  // ...
};

export default function JuegoIframe({ slug }: { slug: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [msg, setMsg] = useState<string>("");

  const src = useMemo(() => `/games/${slug}/index.html`, [slug]);
  const idJuego = MAPEO_ID[slug];

  useEffect(() => {
    const onMessage = async (ev: MessageEvent) => {
      if (!ev.data || ev.data.type !== "MAXWELL_PROGRESO") return;
      const { tiempo_seg, medalla, completado } = ev.data.data || {};
      if (!idJuego) {
        setMsg("No hay idJuego mapeado para este slug");
        return;
      }
      try {
  const r = await registrarProgreso(idJuego, {
          tiempo_seg: Number(tiempo_seg),
          medalla,
          completado: !!completado
        });
  if (completado) marcarCompletado(slug);
        setMsg(r.msg || "Progreso guardado");
      } catch (e) {
        const error = e as { response?: { data?: { msg?: string } } };
        setMsg(error?.response?.data?.msg || "Error guardando progreso");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [idJuego, slug]);

  if (!idJuego) {
    return <div className="text-red-600">Falta mapear slug <b>{slug}</b> a un idJuego en la BD.</div>;
  }

  return (
    <div className="grid gap-3">
      <h1 className="text-xl font-bold">Jugando: {slug}</h1>
      <iframe
        ref={iframeRef}
        src={src}
        className="w-full h-[70vh] bg-white rounded-xl shadow"
        allow="fullscreen"
      />
      {msg && <div className="text-sm">{msg}</div>}
    </div>
  );
}