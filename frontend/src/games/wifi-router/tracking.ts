// src/games/wifi-router/tracking.ts
import { useEffect, useRef } from "react";
import { postProgreso } from "@/lib/api";

export function useGameTracking(id_juego: number) {
  const t0 = useRef<number>(Date.now());
  const finalizadoRef = useRef(false);

  useEffect(() => {
    t0.current = Date.now();
    finalizadoRef.current = false;
    return () => {
      if (!finalizadoRef.current) {
        void registrarProgreso(0);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id_juego]);

  const registrarProgreso = async (exito: 0 | 1) => {
    const tiempo_seg = Math.max(0, Math.round((Date.now() - t0.current) / 1000));
    try {
      await postProgreso(id_juego, {
        tiempo_seg,
        completado: exito === 1,
      });
    } catch {
      // evitar romper el juego si el backend no responde
    }
  };

  async function logEvent(_tipo: string, _payload?: any) {
    // No-op por ahora; se deja la firma para compatibilidad futura
  }

  async function finalize(exito: 0 | 1) {
    if (finalizadoRef.current) return;
    finalizadoRef.current = true;
    await registrarProgreso(exito);
  }

  return { logEvent, finalize };
}
