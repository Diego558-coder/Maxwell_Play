// src/games/wifi-router/utils.ts
export const $ = <T extends Element = Element>(sel: string, root: Document | Element = document) =>
  root.querySelector<T>(sel)!;

export const $$ = <T extends Element = Element>(sel: string, root: Document | Element = document) =>
  Array.from(root.querySelectorAll<T>(sel));

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const C = 299_792_458; // m/s

export const within = (x: number, y: number, rect: DOMRect) =>
  x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
