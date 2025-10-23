// src/games/wifi-router/tracking.ts
import { useEffect, useRef } from "react";

type Session = { id_sesion: number };
type PostBody = Record<string, any>;

async function safePost(url: string, body: PostBody) {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // silencioso: no romper el juego si no hay backend
  }
}

export function useGameTracking(id_juego: number) {
  const sesionRef = useRef<Session | null>(null);
  const t0 = useRef<number>(Date.now());

  useEffect(() => {
    (async () => {
      t0.current = Date.now();
      const r = await fetch("/api/juegos/sesiones/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_juego }),
      }).catch(() => null);
      if (r && r.ok) sesionRef.current = await r.json();
    })();
    return () => {
      // si sale de la vista sin finalizar
      if (sesionRef.current) {
        const tiempo_seg = Math.round((Date.now() - t0.current) / 1000);
        safePost("/api/juegos/sesiones/finalizar", {
          id_sesion: sesionRef.current.id_sesion,
          exito: 0,
          tiempo_seg,
        });
      }
    };
  }, [id_juego]);

  async function logEvent(tipo: string, payload?: any) {
    if (!sesionRef.current) return;
    await safePost("/api/juegos/eventos", {
      id_sesion: sesionRef.current.id_sesion,
      tipo,
      payload: payload ?? null,
    });
  }

  async function finalize(exito: 0 | 1) {
    if (!sesionRef.current) return;
    const tiempo_seg = Math.round((Date.now() - t0.current) / 1000);
    await safePost("/api/juegos/sesiones/finalizar", {
      id_sesion: sesionRef.current.id_sesion,
      exito,
      tiempo_seg,
    });
    sesionRef.current = null;
  }

  return { logEvent, finalize };
}
