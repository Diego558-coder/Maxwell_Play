// src/games/microondas/index.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";

type GameState = {
  magnetronPlaced: boolean;
  powerSourcePlaced: boolean;
  metalCavityPlaced: boolean;
  doorPlaced: boolean;
  foodPlatePlaced: boolean;
  isRunning: boolean;
  assemblyComplete: boolean;
  timeLeft: number;
};

type DragCtx = { id: string; offsetX: number; offsetY: number } | null;

const IDS = {
  magnetron: "magnetron",
  power: "powerSource",
  cavity: "metalCavity",
  door: "doorComponent",
  plate: "foodPlate",
} as const;

const allowedZoneByComponent: Record<string, string> = {
  [IDS.magnetron]: "magnetronZone",
  [IDS.power]: "powerZone",
  [IDS.cavity]: "cavityZone",
  [IDS.door]: "doorZone",
  [IDS.plate]: "plateZone",
};

export default function GameAmpereMaxwellScene({ onWin }: { onWin?: () => void }) {
  const exitoNotificado = useRef(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const interiorRef = useRef<HTMLDivElement | null>(null);
  const wavesRef = useRef<HTMLDivElement | null>(null);
  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const displayRef = useRef<HTMLDivElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const progressTextRef = useRef<HTMLDivElement | null>(null);

  const dragEl = useRef<HTMLDivElement | null>(null);
  const dragCtx = useRef<DragCtx>(null);

  const waveTimer = useRef<number | null>(null);
  const steamTimer = useRef<number | null>(null);
  const clockTimer = useRef<number | null>(null);
  const feedbackTimer = useRef<number | null>(null);

  const [gs, setGs] = useState<GameState>({
    magnetronPlaced: false,
    powerSourcePlaced: false,
    metalCavityPlaced: false,
    doorPlaced: false,
    foodPlatePlaced: false,
    isRunning: false,
    assemblyComplete: false,
    timeLeft: 120,
  });

  // zonas relativas al frame
  const zones = useMemo(
    () => ({
      magnetron: { top: 28, left: 28, width: 56, height: 28 },
      power:     { top: 160, left: 80, width: 100, height: 30 },
      cavity:    { top: 24,  left: 24, width: 150, height: 130 },
      door:      { top: 24,  left: 24, width: 150, height: 130 },
      plate:     { top: 89,  left: 99, width: 90,  height: 90, round: true, center: true },
    }),
    []
  );

  const hideFeedback = useCallback(() => {
    if (feedbackTimer.current) {
      clearTimeout(feedbackTimer.current);
      feedbackTimer.current = null;
    }
    if (!feedbackRef.current) return;
    feedbackRef.current.style.display = "none";
    feedbackRef.current.innerHTML = "";
  }, []);

  const showFeedback = useCallback((html: string, opts: { duration?: number } = {}) => {
    if (!feedbackRef.current) return;
    const duration = opts.duration ?? 2000;
    if (feedbackTimer.current) {
      clearTimeout(feedbackTimer.current);
      feedbackTimer.current = null;
    }
    feedbackRef.current.innerHTML = html;
    feedbackRef.current.style.display = "block";
    if (duration > 0) {
      feedbackTimer.current = window.setTimeout(() => {
        feedbackTimer.current = null;
        hideFeedback();
      }, duration);
    }
  }, [hideFeedback]);

  const updateProgress = (s: GameState) => {
    const done = [s.magnetronPlaced, s.powerSourcePlaced, s.metalCavityPlaced, s.doorPlaced, s.foodPlatePlaced].filter(Boolean).length;
    if (progressFillRef.current) progressFillRef.current.style.width = `${(done / 5) * 100}%`;
    if (progressTextRef.current) progressTextRef.current.textContent = `${done}/5 componentes`;
  };

  const startDrag = (el: HTMLDivElement, id: string, x: number, y: number) => {
    const r = el.getBoundingClientRect();
    const clone = el.cloneNode(true) as HTMLDivElement;
    clone.classList.add("dragging");
    clone.style.width = `${r.width}px`;
    clone.style.height = `${r.height}px`;
    clone.style.position = "fixed";
    clone.style.left = `${r.left}px`;
    clone.style.top = `${r.top}px`;
    clone.style.zIndex = "2000";
    clone.style.pointerEvents = "none";
    document.body.appendChild(clone);

    el.setAttribute("data-dragging", "true");
    el.style.pointerEvents = "none";

    dragEl.current = clone;
    dragCtx.current = { id, offsetX: x - r.left, offsetY: y - r.top };
    moveDrag(x, y);

    frameRef.current?.querySelectorAll<HTMLDivElement>(".drop-zone:not(.filled)").forEach((z) => z.classList.add("drag-over"));
  };

  const moveDrag = (x: number, y: number) => {
    if (!dragEl.current || !dragCtx.current) return;
    dragEl.current.style.left = `${x - dragCtx.current.offsetX}px`;
    dragEl.current.style.top  = `${y - dragCtx.current.offsetY}px`;
  };

  const endDrag = (x: number, y: number) => {
    const el = dragEl.current;
    const ctx = dragCtx.current;
    dragEl.current = null; dragCtx.current = null;
    if (!el || !ctx) return;

    frameRef.current?.querySelectorAll<HTMLDivElement>(".drop-zone").forEach((z) => z.classList.remove("drag-over"));

    let zone = getDropZoneAt(ctx.id, x, y);
    if (!zone && ctx.id === IDS.plate) {
      const plateZone = frameRef.current?.querySelector<HTMLDivElement>("#plateZone") ?? null;
      if (plateZone) {
        const r = plateZone.getBoundingClientRect();
        if (x >= r.left - 20 && x <= r.right + 20 && y >= r.top - 20 && y <= r.bottom + 20 && !plateZone.classList.contains("filled")) {
          zone = plateZone;
        }
      }
    }
    if (!zone) { // cancelar
      if (el.parentElement === document.body) el.remove();
      const orig = document.getElementById(ctx.id) as HTMLDivElement | null;
      if (orig) { orig.removeAttribute("data-dragging"); orig.style.pointerEvents = ""; }
      return;
    }

    const ok =
      (ctx.id === IDS.magnetron && zone.id === "magnetronZone") ||
      (ctx.id === IDS.power     && zone.id === "powerZone")     ||
      (ctx.id === IDS.cavity    && zone.id === "cavityZone")    ||
      (ctx.id === IDS.door      && zone.id === "doorZone")      ||
      (ctx.id === IDS.plate     && zone.id === "plateZone");

    if (!ok) {
      if (el.parentElement === document.body) el.remove();
      const orig = document.getElementById(ctx.id) as HTMLDivElement | null;
      if (orig) { orig.removeAttribute("data-dragging"); orig.style.pointerEvents = ""; }
  showFeedback(`<h3>❌ Componente incorrecto para esta posición</h3>`);
      return;
    }

    const placed = placeComponent(ctx.id, zone);
    if (!placed) {
      if (el.parentElement === document.body) el.remove();
      const orig = document.getElementById(ctx.id) as HTMLDivElement | null;
      if (orig) { orig.removeAttribute("data-dragging"); orig.style.pointerEvents = ""; }
      return;
    }

    const orig = document.getElementById(ctx.id) as HTMLDivElement | null;
    if (orig) { orig.removeAttribute("data-dragging"); orig.style.pointerEvents = ""; orig.style.display = "none"; }
    if (el.parentElement === document.body) el.remove();
  };

  const endDragRef = useRef<(x: number, y: number) => void>(() => {});
  endDragRef.current = endDrag;

  const getDropZoneAt = (componentId: string, x: number, y: number) => {
    const zonesEls = frameRef.current?.querySelectorAll<HTMLDivElement>(".drop-zone") ?? [];
    const allowed = allowedZoneByComponent[componentId];
    for (const z of zonesEls) {
      if (allowed && z.id !== allowed) continue;
      const r = z.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom && !z.classList.contains("filled")) return z;
    }
    return null;
  };

  const placeComponent = (id: string, zoneEl: HTMLDivElement) => {
    if (id === IDS.door) {
      const s = gs;
      if (!(s.magnetronPlaced && s.powerSourcePlaced && s.metalCavityPlaced && s.foodPlatePlaced)) {
  showFeedback(`<h3>❌ La puerta debe instalarse al final, después de los demás componentes.</h3>`);
        return false;
      }
    }

    zoneEl.classList.add("filled");
    zoneEl.textContent = "";
    setGs((s) => {
      const n = { ...s };
      if (id === IDS.magnetron) { toast("✅ Magnetrón instalado"); n.magnetronPlaced = true; }
      if (id === IDS.power)     { toast("✅ Fuente de energía conectada"); n.powerSourcePlaced = true; }
      if (id === IDS.cavity)    { n.metalCavityPlaced = true; interiorRef.current?.classList.add("has-cavity"); if (interiorRef.current) interiorRef.current.textContent = ""; toast("✅ Cavidad metálica instalada"); }
      if (id === IDS.door)      { toast("✅ Puerta del horno montada"); n.doorPlaced = true; }
      if (id === IDS.plate)     { n.foodPlatePlaced = true; showFood(); toast("✅ Pollo colocado en el microondas"); }

      n.assemblyComplete = n.magnetronPlaced && n.powerSourcePlaced && n.metalCavityPlaced && n.doorPlaced && n.foodPlatePlaced;
      return n;
    });
    return true;
  };

  const toast = (msg: string) => showFeedback(`<h3>${msg}</h3>`);

  const showFood = () => {
    const interior = interiorRef.current; if (!interior) return;
    const food = document.createElement("div");
    food.className = "food-heating visible";
    food.id = "foodHeating";
    food.textContent = "🍗 Pollo";
    interior.appendChild(food);
  };

  const togglePower = () => {
    if (!gs.assemblyComplete) {
  showFeedback(`<h3>❌ Primero ensambla todos los componentes.</h3>`);
      return;
    }
    setGs((s) => ({ ...s, isRunning: !s.isRunning, timeLeft: s.isRunning ? s.timeLeft : 120 }));
  };

  // reloj / animaciones
  useEffect(() => {
    if (displayRef.current) {
      const m = String(Math.floor(gs.timeLeft / 60)).padStart(2, "0");
      const sec = String(gs.timeLeft % 60).padStart(2, "0");
      displayRef.current.textContent = gs.isRunning ? `${m}:${sec}` : "00:00";
    }

    if (gs.isRunning) {
      wavesRef.current?.classList.add("visible");

      const interior = interiorRef.current;
      if (interior) {
        interior.querySelector("#foodHeating")?.classList.add("hot");
        const rect = interior.getBoundingClientRect();
        if (waveTimer.current) clearInterval(waveTimer.current);
        waveTimer.current = window.setInterval(() => {
          if (!wavesRef.current) return;
          for (let i = 0; i < 12; i++) {
            const w = document.createElement("div");
            w.className = "wave";
            const x = Math.random() * (rect.width - 20) + rect.left;
            const y = Math.random() * (rect.height - 20) + rect.top;
            w.style.left = `${x}px`;
            w.style.top  = `${y}px`;
            w.style.animationDelay = `${i * 0.1}s`;
            const colors = ["#e74c3c", "#f39c12", "#e67e22", "#d35400"];
            w.style.background = colors[Math.floor(Math.random() * colors.length)];
            wavesRef.current.appendChild(w);
            setTimeout(() => w.remove(), 2000);
          }
        }, 200);
      }

      if (steamTimer.current) clearInterval(steamTimer.current);
      steamTimer.current = window.setInterval(() => {
        const food = document.getElementById("foodHeating"); if (!food) return;
        const s = document.createElement("div");
        s.className = "steam";
        s.style.left = `${Math.random() * 80 + 10}px`;
        s.style.bottom = "80px";
        s.style.animationDelay = `${Math.random()}s`;
        food.appendChild(s);
        setTimeout(() => s.remove(), 2000);
      }, 400);

      if (clockTimer.current) clearInterval(clockTimer.current);
      clockTimer.current = window.setInterval(() => {
        setGs((s) => {
          if (s.timeLeft <= 1) {
            clearInterval(clockTimer.current!);
            stopAll();
            showFeedback(`<h3>🍗 ¡Pollo listo! El microondas ha terminado.</h3>`, { duration: 2600 });
            if (!exitoNotificado.current) { exitoNotificado.current = true; onWin?.(); }
            return { ...s, isRunning: false, timeLeft: 0 };
          }
          return { ...s, timeLeft: s.timeLeft - 1 };
        });
      }, 1000);
    } else {
      stopAll();
    }

    return () => { if (clockTimer.current) clearInterval(clockTimer.current); stopAll(); };
  }, [gs.isRunning, gs.timeLeft, onWin, showFeedback]);

  const stopAll = () => {
    if (wavesRef.current) { wavesRef.current.classList.remove("visible"); wavesRef.current.innerHTML = ""; }
    document.getElementById("foodHeating")?.classList.remove("hot");
    document.getElementById("foodHeating")?.querySelectorAll(".steam").forEach((s) => s.remove());
    if (waveTimer.current) clearInterval(waveTimer.current);
    if (steamTimer.current) clearInterval(steamTimer.current);
  };

  const reset = () => {
    exitoNotificado.current = false;
    stopAll();
    setGs({
      magnetronPlaced: false, powerSourcePlaced: false, metalCavityPlaced: false,
      doorPlaced: false, foodPlatePlaced: false, isRunning: false, assemblyComplete: false, timeLeft: 120,
    });
    frameRef.current?.querySelectorAll<HTMLDivElement>(".drop-zone").forEach((z) => {
      z.classList.remove("filled"); z.textContent = z.dataset.label ?? "";
    });
    interiorRef.current?.classList.remove("has-cavity");
    if (interiorRef.current) interiorRef.current.textContent = "Cavidad Interior";
    document.querySelectorAll<HTMLDivElement>(".component").forEach((c) => (c.style.display = ""));
    hideFeedback();
    updateProgress({
      magnetronPlaced: false, powerSourcePlaced: false, metalCavityPlaced: false,
      doorPlaced: false, foodPlatePlaced: false, isRunning: false, assemblyComplete: false, timeLeft: 120,
    });
  };

  useEffect(() => { updateProgress(gs); }, [gs]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const onUp   = (e: MouseEvent) => endDragRef.current(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (!dragEl.current) return; e.preventDefault();
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]; endDragRef.current(t.clientX, t.clientY);
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
  }, []);

  return (
    <div className="mw-game-container">
      {/* aviso superior e indicador de progreso */}
      <div className="mw-instruction">
        Ensambla el microondas arrastrando cada componente a su lugar y luego enciéndelo.
      </div>

      <div className="mw-progress">
        <div>🔧 Progreso de Ensamblaje</div>
        <div className="mw-bar">
          <div className="mw-bar-fill" ref={progressFillRef} />
        </div>
        <div ref={progressTextRef}>0/5 componentes</div>
      </div>

      {/* Zona central sin scroll */}
      <div className="mw-stage">
        {/* Lista de componentes */}
        <div className="mw-components">
          <div className="mw-components-title">Componentes</div>
          {renderComponent("📡 Magnetrón", "magnetron", startDrag)}
          {renderComponent("🔌 Fuente de Energía", "powerSource", startDrag)}
          {renderComponent("🏠 Cavidad Metálica", "metalCavity", startDrag)}
          {renderComponent("🚪 Puerta del Horno", "doorComponent", startDrag)}
          {renderComponent("🍗 Pollo", "foodPlate", startDrag)}
        </div>

        {/* Microondas (dibujado en CSS) */}
        <div className="mw-frame" ref={frameRef}>
          <div className="mw-interior" ref={interiorRef}>Cavidad Interior</div>
          <div className="mw-panel">
            <div className="mw-display" ref={displayRef}>00:00</div>
            <div className="mw-knob" /><div className="mw-knob" /><div className="mw-knob" />
          </div>

          {/* Zonas de drop */}
          <Zone id="magnetronZone" label="Magnetrón" rect={zones.magnetron} />
          <Zone id="powerZone"     label="Energía"   rect={zones.power} />
          <Zone id="cavityZone"    label="Cavidad"   rect={zones.cavity} />
          <Zone id="doorZone"      label="Puerta"    rect={zones.door} />
          <Zone id="plateZone"     label="Pollo"     rect={zones.plate} round center />

          {/* Puerta */}
          <div className={`mw-door ${gs.doorPlaced ? "" : "open"}`}>
            <div className="mw-handle" />
            <div className="mw-window"><div className="mw-mesh" /></div>
          </div>
        </div>
      </div>

      <div className="mw-waves" ref={wavesRef} />

      {/* Controles inferiores */}
      <div className="mw-controls">
        <button className="btn btn-power" onClick={togglePower} disabled={!gs.assemblyComplete}
          style={{ background: gs.isRunning ? "#e74c3c" : "#27ae60" }}>
          {gs.isRunning ? "⏹️ Apagar" : "⚡ Encender"}
        </button>
        <button className="btn btn-reset" onClick={reset}>🔄 Reiniciar</button>
        <button className="btn btn-manual" onClick={() =>
          showFeedback(`
            <h3>📖 Manual del Microondas</h3>
            <div style="text-align:left;margin:16px 0;line-height:1.6">
              <p><b>1.</b> 📡 Magnetrón → arriba izquierda</p>
              <p><b>2.</b> 🔌 Energía → parte inferior</p>
              <p><b>3.</b> 🏠 Cavidad metálica → interior</p>
              <p><b>4.</b> 🚪 Puerta → frente</p>
              <p><b>5.</b> 🍗 Pollo → bandeja</p>
              <p><b>6.</b> Pulsa “Encender”.</p>
            </div>
          `, { duration: 6000 })
        }>📖 Manual</button>
        <button className="btn btn-next" onClick={() =>
          showFeedback(`
            <h3>🔬 Ley de Ampère–Maxwell</h3>
            <div style="text-align:left;margin:16px 0;line-height:1.6">
              <p><b>Idea:</b> E(t) variable genera B(t) y viceversa → ondas EM.</p>
              <p><b>Magnetrón:</b> ~2.45 GHz. La cavidad refleja las ondas.</p>
              <p><b>Calentamiento:</b> vibración molecular (agua) → calor.</p>
            </div>
          `, { duration: 6000 })
        }>➡️ Explicación</button>
      </div>

      <div className="feedback" id="feedback" ref={feedbackRef} />
    </div>
  );
}

function renderComponent(
  label: string,
  id: string,
  onStart: (el: HTMLDivElement, id: string, x: number, y: number) => void
) {
  return (
    <div
      className={`component ${classById(id)}`}
      id={id}
      onMouseDown={(e) => onStart(e.currentTarget, id, e.clientX, e.clientY)}
      onTouchStart={(e) => {
        const t = e.touches[0];
        onStart(e.currentTarget, id, t.clientX, t.clientY);
        e.preventDefault();
      }}
    >
      {label}
    </div>
  );
}
function classById(id: string) {
  if (id === "magnetron") return "magnetron";
  if (id === "powerSource") return "power-source";
  if (id === "metalCavity") return "metal-cavity";
  if (id === "doorComponent") return "door-component";
  return "food-plate";
}

function Zone({
  id, label, rect, round, center,
}: {
  id: string;
  label: string;
  rect: { top: number; left: number; width: number; height: number };
  round?: boolean;
  center?: boolean;
}) {
  return (
    <div
      id={id}
      className={`drop-zone ${round ? "round" : ""} ${center ? "center" : ""}`}
      data-label={label}
      style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
    >
      {label}
    </div>
  );
}
