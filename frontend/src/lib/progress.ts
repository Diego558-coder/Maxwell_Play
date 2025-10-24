import { obtenerSesion } from "@/state/session";
import { resetProgreso } from "./api";

const PREFIX = "progress:";

function keyFor(gameId: string) {
  const usuario = obtenerSesion();
  const userSegment = usuario ? String(usuario.id_usuario) : "anon";
  return `${PREFIX}${userSegment}:${gameId}`;
}

export function isCompleted(gameId: string): boolean {
  const key = keyFor(gameId);
  const legacyKey = `${PREFIX}${gameId}`;

  if (localStorage.getItem(key) === "1") return true;

  // Limpia claves antiguas sin asociar a estudiante para evitar falsos positivos
  if (localStorage.getItem(legacyKey) !== null) {
    localStorage.removeItem(legacyKey);
  }

  return false;
}

export function markCompleted(gameId: string) {
  localStorage.setItem(keyFor(gameId), "1");
  localStorage.removeItem(`${PREFIX}${gameId}`);
}

export async function resetAll() {
  const usuario = obtenerSesion();
  const userSegment = usuario ? String(usuario.id_usuario) : "anon";
  const targetPrefix = `${PREFIX}${userSegment}:`;

  const toDel: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith(targetPrefix) || k.startsWith(PREFIX) && !k.includes(":")) {
      toDel.push(k);
    }
  }
  toDel.forEach((k) => localStorage.removeItem(k));

  if (usuario?.rol === "ESTUDIANTE") {
    await resetProgreso();
  }
}