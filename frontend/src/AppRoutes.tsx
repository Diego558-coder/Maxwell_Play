import { Routes, Route } from "react-router-dom";

import JuegoGaussMagnetico from "@/games/gauss-magnetico/JuegoGaussMagnetico";
import GameCiclaDinamo from "@/games/cicla-dinamo/GameCiclaDinamo";
import Registro from "@/pages/Registro";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/juegos/tren"  element={<JuegoGaussMagnetico />} />
      <Route path="/juegos/cicla" element={<GameCiclaDinamo />} />
      <Route path="/registro" element={<Registro />} />
    </Routes>
  );
}