// src/games/gauss-magnetico/index.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { JuegoGaussMagnetico } from "./modelos";
import type { ConfiguracionVagon, EstadoAcoples } from "./modelos";
import "./gauss.css";

const GAME_ID = "gauss-magnetico";
const EXPLANATION_VIDEO_PATH = "/videos/explicacion-gauss-magnetico.mp4";

// Banco inicial (igual al tuyo)
const bancoInicial: ConfiguracionVagon[] = [
  { id: 1, poloIzquierdo: "S", poloDerecho: "N" },
  { id: 2, poloIzquierdo: "S", poloDerecho: "N" },
  { id: 3, poloIzquierdo: "N", poloDerecho: "S" },
  { id: 4, poloIzquierdo: "S", poloDerecho: "N" },
  { id: 5, poloIzquierdo: "N", poloDerecho: "S" },
  { id: 6, poloIzquierdo: "S", poloDerecho: "N" },
  { id: 7, poloIzquierdo: "N", poloDerecho: "S" },
];

export default function GameGaussMagneticoScene({ onWin }: { onWin?: () => void }) {
  const navigate = useNavigate();

  const [juego, setJuego] = useState(() =>
    JuegoGaussMagnetico.crearInicial({ vagones: bancoInicial, capacidad: 4 })
  );
  const [toast, setToast] = useState<string>("");
  const [moving, setMoving] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const winTriggered = useRef(false);

  const showToast = (msg: string, ms = 2000) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), ms);
  };

  const acoples = useMemo<EstadoAcoples>(() => juego.estadoAcoples(), [juego]);
  const vagonesDisponibles = juego.listarVagones();
  const ranuras = juego.obtenerRanuras();
  const seleccionadoId = juego.seleccionadoId;

  const onSelectFromBank = (id: number) => {
    setJuego((actual) => actual.alternarSeleccion(id));
  };

  const rotateBank = (id: number) => {
    setJuego((actual) => actual.girarVagonEnDeposito(id));
  };

  const rotateInSlot = (pos: number) => {
    setJuego((actual) => actual.girarVagonEnSlot(pos));
  };

  const placeSelectedIn = (pos: number) => {
    setJuego((actual) => {
      const resultado = actual.colocarSeleccionEn(pos);
      if (resultado.estado === "sin-seleccion") {
        showToast("Selecciona primero un vagón del menú.", 1200);
        return actual;
      }
      if (resultado.estado === "polaridad") {
        showToast("❌ Acople inválido: deben juntarse polos opuestos (N–S).", 1600);
        return actual;
      }
      return resultado.juego;
    });
  };

  const removeFromSlot = (pos: number) => {
    setJuego((actual) => actual.removerDeSlot(pos));
  };

  useEffect(() => {
    if (moving || showWin || winTriggered.current) return;
    if (juego.listoParaAvanzar()) {
      setMoving(true);
      setTimeout(() => setShowWin(true), 50);
      winTriggered.current = true;
      onWin?.();
    }
  }, [juego, moving, showWin, onWin]);

  function onReset() {
    setJuego(JuegoGaussMagnetico.crearInicial({ vagones: bancoInicial, capacidad: 4 }));
    setToast("");
    setMoving(false);
    setShowWin(false);
    setShowNext(false);
    winTriggered.current = false;
  }

  function onHelp() {
    showToast(
      `📖 <b>Manual</b><br>
       1) La locomotora es S–N (izq–der).<br>
       2) Haz clic en un vagón y luego en una casilla.<br>
       3) Doble clic en una casilla para quitar el vagón.<br>
       4) Clic derecho sobre un vagón (en el menú o tren) para girarlo.<br>
       5) Completa de izquierda a derecha (4 → 1).`,
      6500
    );
  }

  function onAcceptWin() {
    setShowWin(false);
    setShowNext(true);
  }

  return (
    <div className="min-h-screen relative">
      <Link to="/menu" className="absolute top-4 left-4 z-50 px-3 py-1.5 rounded-lg bg-white/20 text-white font-bold hover:bg-white/30">
        ← Menú
      </Link>

      <div className="bg" />
      <div className="title">Conecta los vagones: polos opuestos se atraen (N–S)</div>

      <div className="game" id="game">
        <div className="tip">Haz clic en un vagón y luego en una casilla. Al completar 4 correctos (sin huecos y N–S), el tren avanza.</div>

        {/* Panel de vagones */}
        <div className="panel">
          <h3>Vagones</h3>
          <div className="bank" id="bank">
            {vagonesDisponibles.map((vagon) => (
              <div
                key={vagon.id}
                className={`car ${seleccionadoId === vagon.id ? "selected" : ""}`}
                onClick={() => onSelectFromBank(vagon.id)}
                onDoubleClick={() => rotateBank(vagon.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  rotateBank(vagon.id);
                }}
                data-left={vagon.poloIzquierdo}
                data-right={vagon.poloDerecho}
              >
                <span className={`pole ${vagon.poloIzquierdo === "N" ? "n" : "s"}`}>{vagon.poloIzquierdo}</span>
                <span>V</span>
                <span className={`pole ${vagon.poloDerecho === "N" ? "n" : "s"}`}>{vagon.poloDerecho}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rail" />
        <div className="sleepers" />

        {/* Tren */}
        <div className={`train-area ${moving ? "moving" : ""}`} id="trainArea">
          <div className="loco" id="loco" data-left="S" data-right="N">
            <span className="pole s">S</span><span>LOCO</span><span className="pole n">N</span>
            <div className="wheels"><div className="wheel" /><div className="wheel" /><div className="wheel" /></div>
          </div>

          {/* Indicador entre loco y slot 0 */}
          <div className={`couple ${acoples.conLocomotora === null ? "" : acoples.conLocomotora ? "ok" : "bad"}`} id="cpl-loco">
            {acoples.conLocomotora === null ? "•" : acoples.conLocomotora ? "✔" : "✖"}
          </div>

          <div className="slots" id="slots">
            {[0, 1, 2, 3].map((pos) => {
              const vagon = ranuras[pos];
              return (
                <div key={pos} className="flex items-center gap-2">
                <div
                  className={`slot ${vagon ? "filled" : ""}`}
                  data-pos={pos}
                  onClick={() => placeSelectedIn(pos)}
                  onDoubleClick={() => removeFromSlot(pos)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    rotateInSlot(pos);
                  }}
                >
                  {vagon ? (
                    <div className="car" data-left={vagon.poloIzquierdo} data-right={vagon.poloDerecho}>
                      <span className={`pole ${vagon.poloIzquierdo === "N" ? "n" : "s"}`}>{vagon.poloIzquierdo}</span>
                      <span>V</span>
                      <span className={`pole ${vagon.poloDerecho === "N" ? "n" : "s"}`}>{vagon.poloDerecho}</span>
                    </div>
                  ) : (
                    <>{4 - pos}</>
                  )}
                </div>

                {pos < 3 && (
                  <div className={`couple ${acoples.entreVagones[pos] === null ? "" : acoples.entreVagones[pos] ? "ok" : "bad"}`} id={`cpl-${pos}`}>
                    {acoples.entreVagones[pos] === null ? "•" : acoples.entreVagones[pos] ? "✔" : "✖"}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        </div>

        {/* Controles */}
        <div className="controls">
          <button className="btn reset" id="btnReset" onClick={onReset}>🔄 Reiniciar</button>
          <button className="btn help" id="btnHelp" onClick={onHelp}>📖 Manual</button>
          <button className="btn next" id="btnNext" style={{ display: showNext ? "inline-block" : "none" }}
            onClick={() => navigate("/explicacion", { state: { src: EXPLANATION_VIDEO_PATH, gameId: GAME_ID } })}
          >🎬 Explicación</button>
        </div>

        {/* Toast */}
        <div className="toast" id="toast" style={{ display: toast ? "block" : "none" }} dangerouslySetInnerHTML={{ __html: toast }} />

        {/* Modal de victoria */}
        <div className="modal" id="winModal" style={{ display: showWin ? "grid" : "none" }}>
          <div className="card">
            <h3>¡Felicitaciones! 🎉</h3>
            <p>Lo completaste. Pulsa “Aceptar” y se habilitará el botón “Explicación”.</p>
            <button className="btn ok" id="btnWinOk" onClick={onAcceptWin}>Aceptar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
