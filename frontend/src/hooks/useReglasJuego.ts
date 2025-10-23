import { useEffect, useState } from "react";
import { getReglas, type ReglaPieza, type UmbralesJuego } from "../lib/api";

export function useReglasJuego(idJuego: number) {
  const [reglas, setReglas] = useState<ReglaPieza[]>([]);
  const [umbrales, setUmbrales] = useState<UmbralesJuego | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCargando(true); setError(null);
    getReglas(idJuego)
      .then((d) => { setReglas(d.reglas || []); setUmbrales(d.umbrales || null); })
      .catch((e) => {
        const error = e as { response?: { data?: { msg?: string } } };
        setError(error?.response?.data?.msg || "Error cargando reglas");
      })
      .finally(() => setCargando(false));
  }, [idJuego]);

  return { reglas, umbrales, cargando, error };
}