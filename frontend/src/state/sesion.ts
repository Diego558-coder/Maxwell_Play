import type { Usuario } from "@/lib/api";

const CLAVE_USUARIO = "usuario";
const CLAVE_TOKEN = "token";

export function obtenerSesion(): Usuario | null {
  const usuarioAlmacenado = localStorage.getItem(CLAVE_USUARIO);
  return usuarioAlmacenado ? (JSON.parse(usuarioAlmacenado) as Usuario) : null;
}

export function cerrarSesion() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
}
