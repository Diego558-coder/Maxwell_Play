import { useEffect, useRef } from "react";
import type { EmisorOndas } from "./types";
import {
  DISTANCIA_ENTRE_ANILLOS_ONDA,
  OPACIDAD_BASE_ONDA,
  PERIODO_ONDA,
  RADIO_MAXIMO_ONDA,
} from "./constants";

export function useEmisoresOndas(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const idAnimacionRef = useRef<number | null>(null);
  const emisoresRef = useRef<Record<string, EmisorOndas>>({});

  useEffect(() => {
    const ajustarCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    ajustarCanvas();
    window.addEventListener("resize", ajustarCanvas);
    return () => window.removeEventListener("resize", ajustarCanvas);
  }, [canvasRef]);

  const iniciarAnimacion = () => {
    if (idAnimacionRef.current) return;
    const canvas = canvasRef.current!;
    const contexto = canvas.getContext("2d")!;

    const dibujar = () => {
      const now = performance.now();
      contexto.clearRect(0, 0, canvas.width, canvas.height);

      const emisores = Object.values(emisoresRef.current);
      if (emisores.length) {
        for (const emisor of emisores) {
          const proporcionTemporal = (now % PERIODO_ONDA) / PERIODO_ONDA;
          const radioBase = proporcionTemporal * RADIO_MAXIMO_ONDA;
          for (let k = 0; k < 8; k++) {
            const radio = radioBase - k * DISTANCIA_ENTRE_ANILLOS_ONDA;
            if (radio <= 10 || radio >= RADIO_MAXIMO_ONDA) continue;
            const alpha = OPACIDAD_BASE_ONDA *
              (0.65 + 0.35 * Math.sin((radio / DISTANCIA_ENTRE_ANILLOS_ONDA) * Math.PI));
            contexto.beginPath();
            contexto.arc(emisor.posicionX, emisor.posicionY, radio, 0, Math.PI * 2);
            contexto.strokeStyle = `hsla(${emisor.tono}, 90%, 60%, ${alpha})`;
            contexto.lineWidth = 2;
            contexto.stroke();
          }
        }
      }

      if (Object.keys(emisoresRef.current).length) {
        idAnimacionRef.current = requestAnimationFrame(dibujar);
      } else {
        idAnimacionRef.current = null;
      }
    };

    idAnimacionRef.current = requestAnimationFrame(dibujar);
  };

  const asegurarAnimacion = () => {
    if (!idAnimacionRef.current && Object.keys(emisoresRef.current).length) iniciarAnimacion();
  };

  const agregarEmisor = (clave: string, posicionX: number, posicionY: number, tono = 205) => {
    emisoresRef.current[clave] = { posicionX, posicionY, tono, clave };
    asegurarAnimacion();
  };

  const eliminarEmisor = (clave: string) => { delete emisoresRef.current[clave]; };
  const eliminarTodosEmisores = () => { emisoresRef.current = {}; };

  useEffect(() => {
    return () => { if (idAnimacionRef.current) cancelAnimationFrame(idAnimacionRef.current); };
  }, []);

  return { agregarEmisor, eliminarEmisor, eliminarTodosEmisores };
}
