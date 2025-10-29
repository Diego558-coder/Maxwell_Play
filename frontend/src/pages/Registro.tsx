import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";

export default function Registro() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasenia, setContrasenia] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  const manejarRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const { data } = await api.post("/auth/registro", { nombre, correo, contrasenia });
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));

      const rol = data.usuario?.rol;
      if (rol === "DOCENTE") {
        nav("/docente", { replace: true });
      } else {
        nav("/menu", { replace: true });
      }
    } catch (err) {
      const error = err as { response?: { data?: { msg?: string } } };
      setError(error.response?.data?.msg || "Error al registrar usuario");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen w-full gradient-login flex items-center justify-center px-4 py-6 md:py-10 overflow-y-auto">
      <style>{`
        .gradient-login { background: linear-gradient(135deg,#667eea 0%, #764ba2 100%); }
      `}</style>

      <div className="w-full max-w-sm md:max-w-md space-y-1">
        <div className="text-center space-y-2">
          <div className="w-5 h-4 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
            <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white drop-shadow">Crear nueva cuenta</h1>
          <p className="text-indigo-100 text-sm mt-2">Regístrate para acceder a Maxwell Play</p>
        </div>

        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-2xl space-y-4">
          <div className="border border-indigo-100 rounded-xl p-4 hover:border-indigo-200 transition-colors bg-white">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg grid place-items-center mr-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c3.866 0 7 3.134 7 7H5c0-3.866 3.134-7 7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Crear usuario</h3>
                <p className="text-sm text-gray-500">Completa tus datos para comenzar</p>
              </div>
            </div>

            <form onSubmit={manejarRegistro} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Ej. Ana Pérez"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="tucorreo@ejemplo.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña</label>
                <input
                  type="password"
                  value={contrasenia}
                  onChange={(e) => setContrasenia(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white py-2.5 rounded-xl text-base font-semibold shadow-md hover:from-indigo-600 hover:to-violet-600 transition-transform active:scale-[.99] disabled:opacity-60"
              >
                {cargando ? "Creando cuenta..." : "Registrarme"}
              </button>
            </form>
          </div>

          <div className="text-center pt-3">
            <p className="text-sm text-gray-500">
              ¿Ya tienes cuenta? <Link to="/login" className="text-indigo-600 hover:underline">Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}