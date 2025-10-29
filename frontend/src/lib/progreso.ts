import { obtenerSesion } from "../state/sesion";
import { reiniciarProgreso } from "./api";

const PREFIJO = "progreso:";

function clavePara(idJuego: string) {
  const usuario = obtenerSesion();
  const segmentoUsuario = usuario ? String(usuario.id_usuario) : "anon";
  return `${PREFIJO}${segmentoUsuario}:${idJuego}`;
}

export function estaCompletado(idJuego: string): boolean {
  const clave = clavePara(idJuego);
  const claveLegado = `${PREFIJO}${idJuego}`;

  if (localStorage.getItem(clave) === "1") return true;

  if (localStorage.getItem(claveLegado) !== null) {
    localStorage.removeItem(claveLegado);
  }

  return false;
}

export function marcarCompletado(idJuego: string) {
  localStorage.setItem(clavePara(idJuego), "1");
  localStorage.removeItem(`${PREFIJO}${idJuego}`);
}

export async function reiniciarTodo() {
  const usuario = obtenerSesion();
  const segmentoUsuario = usuario ? String(usuario.id_usuario) : "anon";
  const prefijoObjetivo = `${PREFIJO}${segmentoUsuario}:`;

  const clavesAEliminar: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const clave = localStorage.key(i)!;
    if (clave.startsWith(prefijoObjetivo) || (clave.startsWith(PREFIJO) && !clave.includes(":"))) {
      clavesAEliminar.push(clave);
    }
  }
  clavesAEliminar.forEach((clave) => localStorage.removeItem(clave));

  if (usuario?.rol === "ESTUDIANTE") {
    await reiniciarProgreso();
  }
}
