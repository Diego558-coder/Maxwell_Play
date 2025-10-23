import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [correo, setCorreo] = useState("estudiante@demo.com");
  const [contrasenia, setContrasenia] = useState("demo123");
  const { doLogin, cargando, error } = useAuth();
  const nav = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await doLogin(correo, contrasenia);
    if (!ok) return;
    nav("/menu");
  };

  return (
    <div className="min-h-dvh w-screen gradient-login grid place-items-center px-4">
      {/* Cabecera con logo */}
      <style>{`
        .gradient-login { background: linear-gradient(135deg,#667eea 0%, #764ba2 100%); }
      `}</style>

      <div className="w-full max-w-md">
        {/* Encabezado */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white drop-shadow">Iniciar sesión</h1>
        </div>

        {/* Tarjeta */}
        <div className="bg-white rounded-2xl p-6 shadow-xl space-y-5">
          {/* Usuario registrado */}
          <div className="border-2 border-gray-100 rounded-xl p-5 hover:border-indigo-200 transition-colors">
            <div className="flex items-center mb-3">
              <div className="w-11 h-11 bg-indigo-100 rounded-lg grid place-items-center mr-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Usuario registrado</h3>
                <p className="text-sm text-gray-500">Accede con tu cuenta</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
      <input value={correo} onChange={e=>setCorreo(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
      <input type="password" value={contrasenia} onChange={e=>setContrasenia(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <button disabled={cargando}
                      className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-transform active:scale-[.99] disabled:opacity-60">
                {cargando ? "Ingresando..." : "Iniciar sesión"}
              </button>
            </form>
          </div>
          {/* Fin tarjeta */}
        </div>
      </div>
    </div>
  );
}