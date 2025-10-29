import { ANCHO_GLOBO, ALTO_GLOBO } from "./constants";
import type { GloboModelo } from "./types";
import { Electron } from "./modelos";

export function obtenerRectanguloLocal(hijo: HTMLElement | null, padre: HTMLElement | null) {
  if (!hijo || !padre) return null;
  const rectPadre = padre.getBoundingClientRect();
  const rectHijo = hijo.getBoundingClientRect();
  return { x: rectHijo.left - rectPadre.left, y: rectHijo.top - rectPadre.top, w: rectHijo.width, h: rectHijo.height };
}

export function globoSobreMesa(globo: GloboModelo, mesa: { x: number; y: number; w: number; h: number }) {
  const tocaParteSuperior = Math.abs(globo.pos.y + ALTO_GLOBO - mesa.y) <= 2;
  const seSolapaEnX = globo.pos.x + ANCHO_GLOBO > mesa.x && globo.pos.x < mesa.x + mesa.w;
  return tocaParteSuperior && seSolapaEnX;
}

export function generarElectrones(): Electron[] {
  const radioX = ANCHO_GLOBO * 0.32;
  const radioY = ALTO_GLOBO * 0.38;
  const total = 14 + Math.floor(Math.random() * 6);
  return Array.from({ length: total }).map(() => {
    const radio = 0.35 + Math.random() * 0.6;
    const angulo = Math.random() * Math.PI * 2;
    const velocidad = (0.015 + Math.random() * 0.02) * (Math.random() < 0.5 ? 1 : -1);
    const tamano = 2.6 + Math.random() * 1.8;
    const x = ANCHO_GLOBO / 2 + Math.cos(angulo) * radioX * radio;
    const y = ALTO_GLOBO / 2 + Math.sin(angulo) * radioY * radio;
    return new Electron(angulo, radio, velocidad, tamano, x, y);
  });
}
