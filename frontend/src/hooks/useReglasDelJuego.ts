import { useEffect, useState } from "react";
import { obtenerReglas, type ReglaPieza, type UmbralesJuego } from "../lib/api";

export function useReglasDelJuego(idJuego: number) {
  const [reglas, setReglas] = useState<ReglaPieza[]>([]);
  const [umbrales, setUmbrales] = useState<UmbralesJuego | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCargando(true);
    setError(null);
    obtenerReglas(idJuego)
      .then((datos: { reglas: ReglaPieza[]; umbrales: UmbralesJuego | null }) => {
        setReglas(datos.reglas || []);
        setUmbrales(datos.umbrales || null);
      })
      .catch((errorCapturado: unknown) => {
        const respuestaError = errorCapturado as { response?: { data?: { msg?: string } } };
        setError(respuestaError?.response?.data?.msg || "Error cargando reglas del juego");
      })
      .finally(() => setCargando(false));
  }, [idJuego]);

  return { reglas, umbrales, cargando, error };
}
