
import { useEffect, useRef } from "react";
import { registrarProgreso as registrarProgresoApi } from "@/lib/api";

export function useGameTracking(id_juego: number) {
  const t0 = useRef<number>(Date.now());
  const finalizadoRef = useRef(false);

  useEffect(() => {
    t0.current = Date.now();
    finalizadoRef.current = false;
    return () => {
      if (!finalizadoRef.current) {
        void registrarAvance(0);
      }
    };
    
  }, [id_juego]);

  const registrarAvance = async (exito: 0 | 1) => {
    const tiempo_seg = Math.max(0, Math.round((Date.now() - t0.current) / 1000));
    try {
      await registrarProgresoApi(id_juego, {
        tiempo_seg,
        completado: exito === 1,
      });
    } catch {
      
    }
  };

  async function logEvent(tipo: string, payload?: unknown) {
    void tipo;
    void payload;
    
  }

  async function finalize(exito: 0 | 1) {
    if (finalizadoRef.current) return;
    finalizadoRef.current = true;
    await registrarAvance(exito);
  }

  return { logEvent, finalize };
}
