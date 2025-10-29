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
    <div className="min-h-screen w-screen gradient-login flex items-center justify-center px-4 py-10">
      <style>{`
        .gradient-login { background: linear-gradient(135deg,#667eea 0%, #764ba2 100%); }
      `}</style>

      <div className="w-full max-w-sm md:max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white drop-shadow">Crear nueva cuenta</h1>
          <p className="text-indigo-100 text-sm mt-1">Regístrate para acceder a Maxwell Play</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl space-y-5">
          <div className="border-2 border-gray-100 rounded-xl p-5 hover:border-indigo-200 transition-colors">
            <div className="flex items-center mb-3">
              <div className="w-11 h-11 bg-indigo-100 rounded-lg grid place-items-center mr-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Ej. Ana Pérez"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="tucorreo@ejemplo.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={contrasenia}
                  onChange={(e) => setContrasenia(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-transform active:scale-[.99] disabled:opacity-60"
              >
                {cargando ? "Creando cuenta..." : "Registrarme"}
              </button>
            </form>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              ¿Ya tienes cuenta? <Link to="/login" className="text-indigo-600 hover:underline">Inicia sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}