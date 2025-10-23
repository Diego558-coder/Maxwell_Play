// src/games/gauss-magnetico/index.tsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./gauss.css";

type Pole = "N" | "S";
type Car = { id: number; left: Pole; right: Pole };

const GAME_ID = "gauss-magnetico";
const EXPLANATION_VIDEO_PATH = "/videos/explicacion-gauss-magnetico.mp4";

// Banco inicial (igual al tuyo)
const initialBank: Car[] = [
  { id: 1, left: "S", right: "N" },
  { id: 2, left: "S", right: "N" },
  { id: 3, left: "N", right: "S" },
  { id: 4, left: "S", right: "N" },
  { id: 5, left: "N", right: "S" },
  { id: 6, left: "S", right: "N" },
  { id: 7, left: "N", right: "S" },
];

export default function GameGaussMagneticoScene({ onWin }: { onWin?: () => void }) {
  const navigate = useNavigate();

  // Estado 100% React
  const [bank, setBank] = useState<Car[]>(initialBank);
  const [slots, setSlots] = useState<Array<Car | null>>([null, null, null, null]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [toast, setToast] = useState<string>("");
  const [moving, setMoving] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [showNext, setShowNext] = useState(false);

  // Locomotora fija S–N (izq-der)
  const locoRight: Pole = "N";

  function showToast(msg: string, ms = 2000) {
    setToast(msg);
    window.setTimeout(() => setToast(""), ms);
  }

  function flip(c: Car): Car {
    return { ...c, left: c.right, right: c.left };
  }

  // ===== Validaciones =====
  function polarityOkForSlot(car: Car, pos: number): boolean {
    if (pos === 0) return car.left !== locoRight;
    const leftNeigh = slots[pos - 1];
    if (!leftNeigh) return true; // permitir colocar aunque falte el anterior; ganar igual exige sin huecos
    return car.left !== leftNeigh.right;
  }
  function noGaps(): boolean {
    let gap = false;
    for (let i = 0; i < slots.length; i++) {
      if (slots[i] == null) gap = true;
      else if (gap) return false;
    }
    return true;
  }
  function allCouplersOK(): boolean {
    if (!slots[0]) return false;
    if (slots[0]!.left === locoRight) return false;
    for (let i = 1; i < slots.length; i++) {
      if (slots[i] && slots[i - 1]) {
        if (slots[i]!.left === slots[i - 1]!.right) return false;
      }
    }
    return true;
  }

  // Indicadores de acople
  const coupleStatus = useMemo(() => {
    const locoOk = slots[0] ? slots[0]!.left !== locoRight : null; // null = vacío
    const mids: Array<boolean | null> = [null, null, null];
    for (let i = 1; i < 4; i++) {
      mids[i - 1] = slots[i] && slots[i - 1] ? slots[i]!.left !== slots[i - 1]!.right : null;
    }
    return { locoOk, mids };
  }, [slots, locoRight]);

  // ===== Acciones =====
  function onSelectFromBank(id: number) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  function rotateBank(id: number) {
    setBank((b) => b.map((c) => (c.id === id ? flip(c) : c)));
  }

  function rotateInSlot(pos: number) {
    setSlots((s) => {
      const copy = s.slice();
      if (!copy[pos]) return copy;
      copy[pos] = flip(copy[pos]!);
      return copy;
    });
  }

  function placeSelectedIn(pos: number) {
    if (selectedId == null) {
      showToast("Selecciona primero un vagón del menú.", 1200);
      return;
    }
    const car = bank.find((c) => c.id === selectedId);
    if (!car) return;

    if (!polarityOkForSlot(car, pos)) {
      showToast("❌ Acople inválido: deben juntarse polos opuestos (N–S).", 1600);
      return;
    }

    setSlots((s) => {
      const copy = s.slice();
      // si ya había uno, lo devolvemos al banco
      if (copy[pos]) setBank((b) => [...b, copy[pos]!]);
      copy[pos] = car;
      return copy;
    });
    setBank((b) => b.filter((c) => c.id !== selectedId));
    setSelectedId(null);
  }

  function removeFromSlot(pos: number) {
    setSlots((s) => {
      const copy = s.slice();
      if (!copy[pos]) return copy;
      setBank((b) => [...b, copy[pos]!]);
      copy[pos] = null;
      return copy;
    });
  }

  // Win check en cada render
  const hasAll = useMemo(() => slots.filter(Boolean).length === 4, [slots]);
  if (!moving && hasAll && noGaps() && allCouplersOK() && !showWin) {
    // inicia anim + muestra modal
    setMoving(true);
    setTimeout(() => setShowWin(true), 50);
  }

  function onReset() {
    setBank(initialBank);
    setSlots([null, null, null, null]);
    setSelectedId(null);
    setToast("");
    setMoving(false);
    setShowWin(false);
    setShowNext(false);
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
    onWin?.();
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
            {bank.map((c) => (
              <div
                key={c.id}
                className={`car ${selectedId === c.id ? "selected" : ""}`}
                onClick={() => onSelectFromBank(c.id)}
                onDoubleClick={() => rotateBank(c.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  rotateBank(c.id);
                }}
                data-left={c.left}
                data-right={c.right}
              >
                <span className={`pole ${c.left === "N" ? "n" : "s"}`}>{c.left}</span>
                <span>V</span>
                <span className={`pole ${c.right === "N" ? "n" : "s"}`}>{c.right}</span>
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
          <div className={`couple ${coupleStatus.locoOk === null ? "" : coupleStatus.locoOk ? "ok" : "bad"}`} id="cpl-loco">
            {coupleStatus.locoOk === null ? "•" : coupleStatus.locoOk ? "✔" : "✖"}
          </div>

          <div className="slots" id="slots">
            {[0, 1, 2, 3].map((pos) => (
              <div key={pos} className="flex items-center gap-2">
                <div
                  className={`slot ${slots[pos] ? "filled" : ""}`}
                  data-pos={pos}
                  onClick={() => placeSelectedIn(pos)}
                  onDoubleClick={() => removeFromSlot(pos)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    rotateInSlot(pos);
                  }}
                >
                  {slots[pos] ? (
                    <div className="car" data-left={slots[pos]!.left} data-right={slots[pos]!.right}>
                      <span className={`pole ${slots[pos]!.left === "N" ? "n" : "s"}`}>{slots[pos]!.left}</span>
                      <span>V</span>
                      <span className={`pole ${slots[pos]!.right === "N" ? "n" : "s"}`}>{slots[pos]!.right}</span>
                    </div>
                  ) : (
                    <>{4 - pos}</>
                  )}
                </div>

                {pos < 3 && (
                  <div className={`couple ${coupleStatus.mids[pos] === null ? "" : coupleStatus.mids[pos] ? "ok" : "bad"}`} id={`cpl-${pos}`}>
                    {coupleStatus.mids[pos] === null ? "•" : coupleStatus.mids[pos] ? "✔" : "✖"}
                  </div>
                )}
              </div>
            ))}
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
