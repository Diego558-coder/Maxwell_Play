import { Routes, Route } from "react-router-dom";

import JuegoGaussMagnetico from "@/games/gauss-magnetico/JuegoGaussMagnetico";
import GameCiclaDinamo from "@/games/cicla-dinamo/GameCiclaDinamo";
// import CiclaDinamoScene from "@/games/cicla-dinamo"; // <- solo si quieres una ruta “raw”
// import Explicacion from "@/components/Explicacion";     // si ya tienes esta pantalla

export default function AppRoutes() {
  return (
    <Routes>
  <Route path="/juegos/tren"  element={<JuegoGaussMagnetico />} />
      <Route path="/juegos/cicla" element={<GameCiclaDinamo />} />
      {/* Solo para pruebas sin wrapper:
      <Route path="/juegos/cicla/raw" element={<CiclaDinamoScene />} /> */}
  {/* <Route path="/explicacion"  element={<Explicacion />} /> */}
    </Routes>
  );
}