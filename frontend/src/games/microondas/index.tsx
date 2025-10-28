import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";
import { Microondas, IDS } from "./modelos/Microondas";
import type { IdComponenteMicroondas } from "./modelos/Microondas";
import type { ComponenteMicroondas } from "./modelos/ComponenteMicroondas";
import type { ZonaColocacion } from "./modelos/ZonaColocacion";

type DragCtx = { id: IdComponenteMicroondas; offsetX: number; offsetY: number } | null;

const COOK_SECONDS = 7;

type SceneProps = { onWin?: () => void };

export default function GameAmpereMaxwellScene({ onWin }: SceneProps) {
  const [juego, setJuego] = useState(() => Microondas.crearInicial(COOK_SECONDS));
  const juegoRef = useRef(juego);
  const exitoNotificado = useRef(false);

  const frameRef = useRef<HTMLDivElement | null>(null);
  const interiorRef = useRef<HTMLDivElement | null>(null);
  const foodRef = useRef<HTMLDivElement | null>(null);
  const wavesRef = useRef<HTMLDivElement | null>(null);
  const feedbackRef = useRef<HTMLDivElement | null>(null);

  const dragEl = useRef<HTMLDivElement | null>(null);
  const dragCtx = useRef<DragCtx>(null);

  const waveTimer = useRef<number | null>(null);
  const steamTimer = useRef<number | null>(null);
  const clockTimer = useRef<number | null>(null);
  const feedbackTimer = useRef<number | null>(null);

  useEffect(() => {
    juegoRef.current = juego;
  }, [juego]);

  const hideFeedback = useCallback(() => {
    if (feedbackTimer.current) {
      clearTimeout(feedbackTimer.current);
      feedbackTimer.current = null;
    }
    const feedback = feedbackRef.current;
    if (!feedback) return;
    feedback.style.display = "none";
    feedback.innerHTML = "";
  }, []);

  const showFeedback = useCallback((html: string, opts: { duration?: number } = {}) => {
    const feedback = feedbackRef.current;
    if (!feedback) return;
    const duration = opts.duration ?? 2000;
    if (feedbackTimer.current) {
      clearTimeout(feedbackTimer.current);
      feedbackTimer.current = null;
    }
    feedback.innerHTML = html;
    feedback.style.display = "block";
    if (duration > 0) {
      feedbackTimer.current = window.setTimeout(() => {
        feedbackTimer.current = null;
        hideFeedback();
      }, duration);
    }
  }, [hideFeedback]);

  const toast = useCallback((msg: string) => {
    showFeedback(`<h3>${msg}</h3>`);
  }, [showFeedback]);

  const moveDrag = useCallback((x: number, y: number) => {
    if (!dragEl.current || !dragCtx.current) return;
    dragEl.current.style.left = `${x - dragCtx.current.offsetX}px`;
    dragEl.current.style.top = `${y - dragCtx.current.offsetY}px`;
  }, []);

  const startDrag = useCallback((el: HTMLDivElement, id: IdComponenteMicroondas, x: number, y: number) => {
    if (juegoRef.current.estaComponenteColocado(id)) return;

    const rect = el.getBoundingClientRect();
    const clone = el.cloneNode(true) as HTMLDivElement;
    clone.classList.add("dragging");
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.position = "fixed";
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.zIndex = "2000";
    clone.style.pointerEvents = "none";
    document.body.appendChild(clone);

    el.setAttribute("data-dragging", "true");
    el.style.pointerEvents = "none";

    dragEl.current = clone;
    dragCtx.current = { id, offsetX: x - rect.left, offsetY: y - rect.top };
    moveDrag(x, y);

    const zonaId = juegoRef.current.zonaObjetivoPara(id);
    if (zonaId) {
      const zonaEl = document.getElementById(zonaId) as HTMLDivElement | null;
      if (zonaEl && !zonaEl.classList.contains("filled")) {
        zonaEl.classList.add("drag-over");
      }
    }
  }, [moveDrag]);

  const getDropZoneAt = useCallback((componentId: IdComponenteMicroondas, x: number, y: number) => {
    const zonaId = juegoRef.current.zonaObjetivoPara(componentId);
    if (!zonaId) return null;
    const zoneEl = document.getElementById(zonaId) as HTMLDivElement | null;
    if (!zoneEl) return null;

    const zonaModelo = juegoRef.current.zonaPorId(zonaId);
    if (zonaModelo?.ocupada) return null;

    const rect = zoneEl.getBoundingClientRect();
    const tolerancia = zonaModelo?.toleranciaExtra ?? 0;
    const dentro =
      x >= rect.left - tolerancia &&
      x <= rect.right + tolerancia &&
      y >= rect.top - tolerancia &&
      y <= rect.bottom + tolerancia;
    return dentro ? zoneEl : null;
  }, []);

  const placeComponent = useCallback((id: IdComponenteMicroondas, zoneEl: HTMLDivElement) => {
    const resultado = juegoRef.current.intentarColocarComponente(id, zoneEl.id);
    if (!resultado.exito) {
      if (resultado.mensaje) showFeedback(`<h3>${resultado.mensaje}</h3>`);
      return false;
    }

    setJuego(resultado.juego);
    if (resultado.mensaje) toast(resultado.mensaje);
    return true;
  }, [showFeedback, toast]);

  const endDrag = useCallback((x: number, y: number) => {
    const ctx = dragCtx.current;
    const clone = dragEl.current;
    dragCtx.current = null;
    dragEl.current = null;

    document.querySelectorAll<HTMLDivElement>(".drop-zone").forEach((z) => z.classList.remove("drag-over"));

    if (!ctx || !clone) return;

    const zone = getDropZoneAt(ctx.id, x, y);
    if (!zone) {
      clone.remove();
      const original = document.getElementById(ctx.id) as HTMLDivElement | null;
      if (original) {
        original.removeAttribute("data-dragging");
        original.style.pointerEvents = "";
      }
      return;
    }

    const colocado = placeComponent(ctx.id, zone);
    if (!colocado) {
      clone.remove();
      const original = document.getElementById(ctx.id) as HTMLDivElement | null;
      if (original) {
        original.removeAttribute("data-dragging");
        original.style.pointerEvents = "";
      }
      return;
    }

    const original = document.getElementById(ctx.id) as HTMLDivElement | null;
    if (original) {
      original.removeAttribute("data-dragging");
      original.style.pointerEvents = "";
      original.style.display = "none";
    }
    clone.remove();
  }, [getDropZoneAt, placeComponent]);

  const endDragRef = useRef<(x: number, y: number) => void>(() => {});
  endDragRef.current = endDrag;

  const stopAll = useCallback(() => {
    const waves = wavesRef.current;
    if (waves) {
      waves.classList.remove("visible");
      waves.innerHTML = "";
    }

    if (foodRef.current) {
      foodRef.current.classList.remove("hot");
      foodRef.current.querySelectorAll(".steam").forEach((s) => s.remove());
    }

    if (waveTimer.current) {
      clearInterval(waveTimer.current);
      waveTimer.current = null;
    }
    if (steamTimer.current) {
      clearInterval(steamTimer.current);
      steamTimer.current = null;
    }
  }, []);

  useEffect(() => {
    const onMove = (event: MouseEvent) => moveDrag(event.clientX, event.clientY);
    const onUp = (event: MouseEvent) => endDragRef.current(event.clientX, event.clientY);
    const onTouchMove = (event: TouchEvent) => {
      if (!dragEl.current) return;
      event.preventDefault();
      const touch = event.touches[0];
      moveDrag(touch.clientX, touch.clientY);
    };
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      endDragRef.current(touch.clientX, touch.clientY);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [moveDrag]);

  useEffect(() => {
    if (clockTimer.current) {
      clearInterval(clockTimer.current);
      clockTimer.current = null;
    }

    if (!juego.estaEncendido) {
      stopAll();
      return;
    }

    const waves = wavesRef.current;
    if (waves) {
      waves.classList.add("visible");
    }

    if (interiorRef.current && foodRef.current) {
      foodRef.current.classList.add("hot");
    }

    const frameRect = interiorRef.current?.getBoundingClientRect();
    if (frameRect) {
      if (waveTimer.current) clearInterval(waveTimer.current);
      waveTimer.current = window.setInterval(() => {
        const wavesContainer = wavesRef.current;
        if (!wavesContainer) return;
        for (let i = 0; i < 12; i++) {
          const wave = document.createElement("div");
          wave.className = "wave";
          const x = Math.random() * (frameRect.width - 20) + frameRect.left;
          const y = Math.random() * (frameRect.height - 20) + frameRect.top;
          wave.style.left = `${x}px`;
          wave.style.top = `${y}px`;
          wave.style.animationDelay = `${i * 0.1}s`;
          const colors = ["#e74c3c", "#f39c12", "#e67e22", "#d35400"];
          wave.style.background = colors[Math.floor(Math.random() * colors.length)];
          wavesContainer.appendChild(wave);
          window.setTimeout(() => wave.remove(), 2000);
        }
      }, 200);
    }

    if (steamTimer.current) clearInterval(steamTimer.current);
    steamTimer.current = window.setInterval(() => {
      const food = foodRef.current;
      if (!food) return;
      const steam = document.createElement("div");
      steam.className = "steam";
      steam.style.left = `${Math.random() * 80 + 10}px`;
      steam.style.bottom = "80px";
      steam.style.animationDelay = `${Math.random()}s`;
      food.appendChild(steam);
      window.setTimeout(() => steam.remove(), 2000);
    }, 400);

    clockTimer.current = window.setInterval(() => {
      setJuego((estado) => {
        if (!estado.estaEncendido) return estado;
        if (estado.tiempoRestante <= 1) {
          stopAll();
          showFeedback(`<h3>🍗 ¡Pollo listo! El microondas ha terminado.</h3>`, { duration: 2600 });
          if (!exitoNotificado.current) {
            exitoNotificado.current = true;
            onWin?.();
          }
          return estado.avanzarSegundo();
        }
        return estado.avanzarSegundo();
      });
    }, 1000);

    return () => {
      if (clockTimer.current) {
        clearInterval(clockTimer.current);
        clockTimer.current = null;
      }
      stopAll();
    };
  }, [juego.estaEncendido, onWin, showFeedback, stopAll]);

  const togglePower = () => {
    if (!juegoRef.current.ensambladoCompleto) {
      showFeedback(`<h3>❌ Primero ensambla todos los componentes.</h3>`);
      return;
    }
    setJuego((estado) => estado.alternarEncendido());
  };

  const reset = () => {
    exitoNotificado.current = false;
    stopAll();
    if (clockTimer.current) {
      clearInterval(clockTimer.current);
      clockTimer.current = null;
    }
    hideFeedback();
    document.querySelectorAll<HTMLDivElement>('.component[data-dragging="true"]').forEach((c) => {
      c.removeAttribute("data-dragging");
      c.style.pointerEvents = "";
      c.style.display = "";
    });
    document.querySelectorAll<HTMLDivElement>(".drop-zone").forEach((z) => z.classList.remove("drag-over"));
    if (dragEl.current) {
      dragEl.current.remove();
      dragEl.current = null;
    }
    dragCtx.current = null;
    const nuevo = Microondas.crearInicial(COOK_SECONDS);
    juegoRef.current = nuevo;
    setJuego(nuevo);
  };

  const progreso = juego.componentesInstalados();
  const totalComponentes = juego.totalComponentes();
  const porcentaje = useMemo(() => juego.porcentajeProgreso(), [juego]);

  const tiempoPantalla = useMemo(() => {
    const minutos = String(Math.floor(juego.tiempoRestante / 60)).padStart(2, "0");
    const segundos = String(juego.tiempoRestante % 60).padStart(2, "0");
    return `${minutos}:${segundos}`;
  }, [juego.tiempoRestante]);

  return (
    <div className="mw-game-container">
      <div className="mw-instruction">
        Ensambla el microondas arrastrando cada componente a su lugar y luego enciéndelo.
      </div>

      <div className="mw-progress">
        <div>🔧 Progreso de Ensamblaje</div>
        <div className="mw-bar">
          <div className="mw-bar-fill" style={{ width: `${porcentaje}%` }} />
        </div>
        <div>{progreso}/{totalComponentes} componentes</div>
      </div>

      <div className="mw-stage">
        <div className="mw-components">
          <div className="mw-components-title">Componentes</div>
          {juego.componentes.map((componente) =>
            componente.colocado ? null : renderComponent(componente, startDrag)
          )}
        </div>

        <div className="mw-frame" ref={frameRef}>
          <div
            className={`mw-interior ${juego.estaComponenteColocado(IDS.cavity) ? "has-cavity" : ""}`}
            ref={interiorRef}
          >
            {juego.estaComponenteColocado(IDS.cavity) ? (
              juego.estaComponenteColocado(IDS.plate) ? (
                <div
                  ref={(el) => {
                    foodRef.current = el;
                  }}
                  className={`food-heating visible${juego.estaEncendido ? " hot" : ""}`}
                >
                  🍗 Pollo
                </div>
              ) : null
            ) : (
              "Cavidad Interior"
            )}
          </div>
          <div className="mw-panel">
            <div className="mw-display">{tiempoPantalla}</div>
            <div className="mw-knob" />
            <div className="mw-knob" />
            <div className="mw-knob" />
          </div>

          {juego.zonas.map((zona) => (
            <Zone key={zona.id} zona={zona} />
          ))}

          <div className={`mw-door ${juego.estaComponenteColocado(IDS.door) ? "" : "open"}`}>
            <div className="mw-handle" />
            <div className="mw-window">
              <div className="mw-mesh" />
            </div>
          </div>
        </div>
      </div>

      <div className="mw-waves" ref={wavesRef} />

      <div className="mw-controls">
        <button
          className="btn btn-power"
          onClick={togglePower}
          disabled={!juego.ensambladoCompleto}
          style={{ background: juego.estaEncendido ? "#e74c3c" : "#27ae60" }}
        >
          {juego.estaEncendido ? "⏹️ Apagar" : "⚡ Encender"}
        </button>
        <button className="btn btn-reset" onClick={reset}>🔄 Reiniciar</button>
        <button
          className="btn btn-manual"
          onClick={() =>
            showFeedback(
              `
            <h3>📖 Manual del Microondas</h3>
            <div style="text-align:left;margin:16px 0;line-height:1.6">
              <p><b>1.</b> 📡 Magnetrón → arriba izquierda</p>
              <p><b>2.</b> 🔌 Energía → parte inferior</p>
              <p><b>3.</b> 🏠 Cavidad metálica → interior</p>
              <p><b>4.</b> 🚪 Puerta → frente</p>
              <p><b>5.</b> 🍗 Pollo → bandeja</p>
              <p><b>6.</b> Pulsa “Encender”.</p>
            </div>
          `,
              { duration: 6000 }
            )
          }
        >
          📖 Manual
        </button>
        <button
          className="btn btn-next"
          onClick={() =>
            showFeedback(
              `
            <h3>🔬 Ley de Ampère–Maxwell</h3>
            <div style="text-align:left;margin:16px 0;line-height:1.6">
              <p><b>Idea:</b> E(t) variable genera B(t) y viceversa → ondas EM.</p>
              <p><b>Magnetrón:</b> ~2.45 GHz. La cavidad refleja las ondas.</p>
              <p><b>Calentamiento:</b> vibración molecular (agua) → calor.</p>
            </div>
          `,
              { duration: 6000 }
            )
          }
        >
          ➡️ Explicación
        </button>
      </div>

      <div className="feedback" ref={feedbackRef} />
    </div>
  );
}

function renderComponent(
  componente: ComponenteMicroondas,
  onStart: (el: HTMLDivElement, id: IdComponenteMicroondas, x: number, y: number) => void
) {
  return (
    <div
      key={componente.id}
      className={`component ${classById(componente.id)}`}
      id={componente.id}
      onMouseDown={(event) => onStart(event.currentTarget, componente.id, event.clientX, event.clientY)}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        onStart(event.currentTarget, componente.id, touch.clientX, touch.clientY);
        event.preventDefault();
      }}
    >
      {componente.etiqueta}
    </div>
  );
}

function classById(id: IdComponenteMicroondas) {
  if (id === IDS.magnetron) return "magnetron";
  if (id === IDS.power) return "power-source";
  if (id === IDS.cavity) return "metal-cavity";
  if (id === IDS.door) return "door-component";
  return "food-plate";
}

function Zone({ zona }: { zona: ZonaColocacion }) {
  const classes = ["drop-zone"];
  if (zona.esCircular) classes.push("round");
  if (zona.centrada) classes.push("center");
  if (zona.ocupada) classes.push("filled");
  return (
    <div
      id={zona.id}
      className={classes.join(" ")}
      data-label={zona.etiqueta}
      style={{ top: zona.top, left: zona.left, width: zona.width, height: zona.height }}
    >
      {zona.ocupada ? "" : zona.etiqueta}
    </div>
  );
}
