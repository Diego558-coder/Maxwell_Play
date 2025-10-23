import { useState } from "react";
import { login, type Usuario } from "../lib/api";

export function useAuth() {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const u = localStorage.getItem("usuario");
    return u ? JSON.parse(u) : null;
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doLogin = async (correo: string, contrasenia: string) => {
    setError(null); setCargando(true);
    try {
      const { usuario } = await login(correo, contrasenia);
      setUsuario(usuario);
      return true;
    } catch (e) {
      const error = e as { response?: { data?: { msg?: string } } };
      setError(error?.response?.data?.msg || "Error de autenticación");
      return false;
    } finally { setCargando(false); }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  };

  return { usuario, cargando, error, doLogin, logout };
}