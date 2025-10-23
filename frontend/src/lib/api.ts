import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE ?? "https://maxwellplay-production.up.railway.app";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Adjuntar token si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type Usuario = {
  id_usuario: number;
  nombre: string;
  correo: string;
  rol: "DOCENTE" | "ESTUDIANTE";
};

export type LoginResp = {
  token: string;
  usuario: Usuario;
};

export type ReglaPieza = { tipo_pieza: string; minimo: number; maximo: number; };
export type UmbralesJuego = { oro_seg: number; plata_seg: number; bronce_seg: number; };

export const login = async (correo: string, contrasenia: string) => {
  const { data } = await api.post<LoginResp>("/auth/login", { correo, contrasenia });
  localStorage.setItem("token", data.token);
  localStorage.setItem("usuario", JSON.stringify(data.usuario));
  return data;
};

export const getReglas = async (idJuego: number) => {
  const { data } = await api.get<{ reglas: ReglaPieza[]; umbrales: UmbralesJuego | null }>(
    `/juegos/${idJuego}/reglas`
  );
  return data;
};

export const postProgreso = async (
  idJuego: number,
  payload: { tiempo_seg: number; completado: 0 | 1 | boolean; medalla?: "ORO" | "PLATA" | "BRONCE"; id_estudiante?: number }
) => {
  const body = { ...payload, completado: payload.completado ? 1 : 0 };
  const { data } = await api.post<{ msg: string }>(`/juegos/${idJuego}/progreso`, body);
  return data;
};

export default api;
