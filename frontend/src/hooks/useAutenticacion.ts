import { useState } from "react";
import { inicioSesion, type Usuario } from "../lib/api";

export function useAutenticacion() {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iniciarSesion = async (correo: string, contrasenia: string) => {
    setError(null);
    setCargando(true);
    try {
      const { usuario } = await inicioSesion(correo, contrasenia);
      setUsuario(usuario);
      return true;
    } catch (e) {
      const respuestaError = e as { response?: { data?: { msg?: string } } };
      setError(respuestaError?.response?.data?.msg || "Error de autenticación");
      return false;
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  };

  return { usuario, cargando, error, iniciarSesion, cerrarSesion };
}
