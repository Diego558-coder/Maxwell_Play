import type { Usuario } from "@/lib/api";

const KEY_USER = "usuario";
const KEY_TOKEN = "token";

export function obtenerSesion(): Usuario | null {
  const u = localStorage.getItem(KEY_USER);
  return u ? JSON.parse(u) as Usuario : null;
}

export function cerrarSesion() {
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_USER);
}