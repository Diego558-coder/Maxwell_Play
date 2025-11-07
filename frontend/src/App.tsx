import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Menu from "./pages/Menu";
import JuegoCargaElectrica from "./games/carga-electrica/JuegoCargaElectrica";
import JuegoGaussMagnetico from "@/games/gauss-magnetico/JuegoGaussMagnetico";
import GameCiclaDinamo from "@/games/cicla-dinamo/GameCiclaDinamo";
import GameMicroondas from "@/games/microondas/GameMicroondas";
import GameWifiRouter from "@/games/wifi-router";
import ListaProfesores from "./pages/teacher/listaProfesores";
import DetalleEstudiante from "./pages/teacher/detalleEstudiante";
import { getSesion } from "./state/session";

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
      {}
      <div className={fullBleed ? "flex-1" : "flex-1 max-w-5xl mx-auto p-4"}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route element={<RequireAuth />}>
            {}
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
            {}
            <Route path="/play/red-wifi" element={<GameWifiRouter />} />
            <Route path="/wifi" element={<GameWifiRouter />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
}

function RequireAuth() {
  const sesion = getSesion();
  const location = useLocation();
  if (!sesion) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

function OnlyDocente() {
  const sesion = getSesion();
  if (sesion?.rol !== "DOCENTE") {
    
    return <Navigate to="/menu" replace />;
  }
  return <Outlet />;
}

function OnlyEstudiante() {
  const sesion = getSesion();
  if (sesion?.rol === "DOCENTE") {
    
    return <Navigate to="/docente" replace />;
  }
  return <Outlet />;
}

export default App;
