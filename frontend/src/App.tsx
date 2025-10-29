import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import InicioSesion from "./pages/inicioSesion";
import Registro from "./pages/Registro";
import Menu from "./pages/Menu";
import JuegoCargaElectrica from "./games/carga-electrica/JuegoCargaElectrica";
import JuegoGaussMagnetico from "@/games/gauss-magnetico/JuegoGaussMagnetico";
import GameCiclaDinamo from "@/games/cicla-dinamo/GameCiclaDinamo";
import GameMicroondas from "@/games/microondas/GameMicroondas";
import GameWifiRouter from "@/games/wifi-router";
import ListaProfesores from "./pages/teacher/listaProfesores";
import DetalleEstudiante from "./pages/teacher/detalleEstudiante";
import { obtenerSesion } from "./state/sesion";

function App() {
  return (
    <BrowserRouter>
      <Frame />
    </BrowserRouter>
  );
}

function Frame() {
  const { pathname } = useLocation();
  const fullBleed =
    pathname.startsWith("/play/") || pathname === "/menu" || pathname === "/login" || pathname === "/registro";

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Contenido */}
      <div className={fullBleed ? "flex-1" : "flex-1 max-w-5xl mx-auto p-4"}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<InicioSesion />} />
          <Route path="/registro" element={<Registro />} />
          <Route element={<RequireAuth />}>
            {/* Rutas exclusivas por rol */}
            <Route element={<OnlyEstudiante />}>
              <Route path="/menu" element={<Menu />} />
            </Route>
            <Route element={<OnlyDocente />}>
              <Route path="/docente" element={<ListaProfesores />} />
              <Route path="/docente/alumno/:id" element={<DetalleEstudiante />} />
            </Route>
            <Route path="/play/carga-electrica" element={<JuegoCargaElectrica />} />
            <Route path="/play/gauss-magnetico" element={<JuegoGaussMagnetico />} />
            <Route path="/play/cicla-dinamo" element={<GameCiclaDinamo />} />
            <Route path="/microondas" element={<GameMicroondas />} />
            <Route path="/play/ampere-maxwell" element={<GameMicroondas />} />
            {/* Alias para el juego WiFi: compatible con patrón /play/ */}
            <Route path="/play/red-wifi" element={<GameWifiRouter />} />
            <Route path="/wifi" element={<GameWifiRouter />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
}

function RequireAuth() {
  const sesion = obtenerSesion();
  const location = useLocation();
  if (!sesion) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

function OnlyDocente() {
  const sesion = obtenerSesion();
  if (sesion?.rol !== "DOCENTE") {
    // Si no es docente, envíalo al menú (estudiante por defecto)
    return <Navigate to="/menu" replace />;
  }
  return <Outlet />;
}

function OnlyEstudiante() {
  const sesion = obtenerSesion();
  if (sesion?.rol === "DOCENTE") {
    // Si es docente e intenta ver /menu u otra ruta de estudiante, redirige a su panel
    return <Navigate to="/docente" replace />;
  }
  return <Outlet />;
}

export default App;
