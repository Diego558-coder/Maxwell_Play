
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { JuegoGaussMagnetico } from "./modelos";
import type { ConfiguracionVagon, EstadoAcoples } from "./modelos";
import { CLAVE_JUEGO, ID_JUEGO, RUTA_VIDEO_EXPLICACION } from "./constants";
import "./gauss.css";


const bancoInicial: ConfiguracionVagon[] = [
  { id: 1, poloIzquierdo: "S", poloDerecho: "N" },
  { id: 2, poloIzquierdo: "S", poloDerecho: "N" },
  { id: 3, poloIzquierdo: "N", poloDerecho: "S" },
  { id: 4, poloIzquierdo: "S", poloDerecho: "N" },
  { id: 5, poloIzquierdo: "N", poloDerecho: "S" },
  { id: 6, poloIzquierdo: "S", poloDerecho: "N" },
  { id: 7, poloIzquierdo: "N", poloDerecho: "S" },
];

export default function EscenaJuegoGaussMagnetico({ alGanar }: { alGanar?: () => void }) {
  const navigate = useNavigate();

  const [juego, setJuego] = useState(() =>
    JuegoGaussMagnetico.crearInicial({ vagones: bancoInicial, capacidad: 4 })
  );
  const [mensajeTemporal, setMensajeTemporal] = useState<string>("");
  const [enMovimiento, setEnMovimiento] = useState(false);
  const [mostrarVictoria, setMostrarVictoria] = useState(false);
  const [mostrarExplicacion, setMostrarExplicacion] = useState(false);
  const victoriaActivadaRef = useRef(false);

  const mostrarAviso = (mensaje: string, duracionMs = 2000) => {
    setMensajeTemporal(mensaje);
    window.setTimeout(() => setMensajeTemporal(""), duracionMs);
  };

  const acoples = useMemo<EstadoAcoples>(() => juego.estadoAcoples(), [juego]);
  const vagonesDisponibles = juego.listarVagones();
  const ranuras = juego.obtenerRanuras();
  const seleccionadoId = juego.seleccionadoId;

  const alSeleccionarEnDeposito = (id: number) => {
    setJuego((actual) => actual.alternarSeleccion(id));
  };

  const girarEnDeposito = (id: number) => {
    setJuego((actual) => actual.girarVagonEnDeposito(id));
  };

  const girarEnRanura = (posicion: number) => {
    setJuego((actual) => actual.girarVagonEnSlot(posicion));
  };

  const colocarEnPosicion = (posicion: number) => {
    setJuego((actual) => {
      const resultado = actual.colocarSeleccionEn(posicion);
      if (resultado.estado === "sin-seleccion") {
        mostrarAviso("Selecciona primero un vagón del menú.", 1200);
        return actual;
      }
      if (resultado.estado === "polaridad") {
        mostrarAviso("❌ Acople inválido: deben juntarse polos opuestos (N–S).", 1600);
        return actual;
      }
      return resultado.juego;
    });
  };

  const removerDeRanura = (posicion: number) => {
    setJuego((actual) => actual.removerDeSlot(posicion));
  };

  useEffect(() => {
    if (enMovimiento || mostrarVictoria || victoriaActivadaRef.current) return;
    if (juego.listoParaAvanzar()) {
      setEnMovimiento(true);
      setTimeout(() => setMostrarVictoria(true), 50);
      victoriaActivadaRef.current = true;
      alGanar?.();
    }
  }, [juego, enMovimiento, mostrarVictoria, alGanar]);

  function reiniciarJuego() {
    setJuego(JuegoGaussMagnetico.crearInicial({ vagones: bancoInicial, capacidad: 4 }));
    setMensajeTemporal("");
    setEnMovimiento(false);
    setMostrarVictoria(false);
    setMostrarExplicacion(false);
    victoriaActivadaRef.current = false;
  }

  function mostrarInstrucciones() {
    mostrarAviso(
      `📖 <b>Manual</b><br>
       1) La locomotora es S–N (izq–der).<br>
       2) Haz clic en un vagón y luego en una casilla.<br>
       3) Doble clic en una casilla para quitar el vagón.<br>
       4) Clic derecho sobre un vagón (en el menú o tren) para girarlo.<br>
       5) Completa de izquierda a derecha (4 → 1).`,
      6500
    );
  }

  function aceptarVictoria() {
    setMostrarVictoria(false);
    setMostrarExplicacion(true);
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

        {}
        <div className="panel">
          <h3>Vagones</h3>
          <div className="bank" id="bank">
            {vagonesDisponibles.map((vagon) => (
              <div
                key={vagon.id}
                className={`car ${seleccionadoId === vagon.id ? "selected" : ""}`}
                onClick={() => alSeleccionarEnDeposito(vagon.id)}
                onDoubleClick={() => girarEnDeposito(vagon.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  girarEnDeposito(vagon.id);
                }}
                data-izquierda={vagon.poloIzquierdo}
                data-derecha={vagon.poloDerecho}
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

        <div className={`train-area ${enMovimiento ? "moving" : ""}`} id="trainArea">
          <div className="loco" id="loco" data-izquierda="S" data-derecha="N">
            <span className="pole s">S</span><span>LOCO</span><span className="pole n">N</span>
            <div className="wheels"><div className="wheel" /><div className="wheel" /><div className="wheel" /></div>
          </div>

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
                  onClick={() => colocarEnPosicion(pos)}
                  onDoubleClick={() => removerDeRanura(pos)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    girarEnRanura(pos);
                  }}
                >
                  {vagon ? (
                    <div className="car" data-izquierda={vagon.poloIzquierdo} data-derecha={vagon.poloDerecho}>
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

        <div className="controls">
          <button className="btn reset" id="btnReiniciar" onClick={reiniciarJuego}>🔄 Reiniciar</button>
          <button className="btn help" id="btnManual" onClick={mostrarInstrucciones}>📖 Manual</button>
          <button className="btn next" id="btnExplicacion" style={{ display: mostrarExplicacion ? "inline-block" : "none" }}
            onClick={() => navigate("/explicacion", { state: { src: RUTA_VIDEO_EXPLICACION, gameId: CLAVE_JUEGO, juegoIdNumerico: ID_JUEGO } })}
          >🎬 Explicación</button>
        </div>

        <div className="toast" id="avisoFlotante" style={{ display: mensajeTemporal ? "block" : "none" }} dangerouslySetInnerHTML={{ __html: mensajeTemporal }} />

        <div className="modal" id="modalVictoria" style={{ display: mostrarVictoria ? "grid" : "none" }}>
          <div className="card">
            <h3>¡Felicitaciones! 🎉</h3>
            <p>Lo completaste. Pulsa “Aceptar” y se habilitará el botón “Explicación”.</p>
            <button className="btn ok" id="btnAceptarVictoria" onClick={aceptarVictoria}>Aceptar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
