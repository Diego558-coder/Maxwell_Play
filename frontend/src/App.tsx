import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import Login from "./pages/Login";
import Menu from "./pages/Menu";
import GameCargaElectrica from "./games/carga-electrica/GameCargaElectrica";
import GameGaussMagnetico from "@/games/gauss-magnetico/GameGaussMagnetico";
import GameCiclaDinamo from "@/games/cicla-dinamo/GameCiclaDinamo";
import GameMicroondas from "@/games/microondas/GameMicroondas";
import GameWifiRouter from "@/games/wifi-router";
import TeacherList from "./pages/teacher/TeacherList";
import StudentDetail from "./pages/teacher/StudentDetail";
import { obtenerSesion } from "./state/session";

function App() {
  return (
    <BrowserRouter>
      <Frame />
    </BrowserRouter>
  );
}

function Frame() {
  const { pathname } = useLocation();
  const fullBleed = pathname.startsWith("/play/") || pathname === "/menu";

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Contenido */}
      <div className={fullBleed ? "flex-1" : "flex-1 max-w-5xl mx-auto p-4"}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/menu" element={<Menu />} />
            <Route path="/docente" element={<TeacherList />} />
            <Route path="/docente/alumno/:id" element={<StudentDetail />} />
            <Route path="/play/carga-electrica" element={<GameCargaElectrica />} />
            <Route path="/play/gauss-magnetico" element={<GameGaussMagnetico />} />
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

export default App;
