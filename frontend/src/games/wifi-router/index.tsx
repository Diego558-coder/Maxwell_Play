
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./wifi.css";
import { $, $$, C, clamp, within } from "./utils";
import type { DragCtx, GameState, ModalState } from "./types";
import { useGameTracking } from "./tracking";

const GAME_ID = 5; 

export default function GameWifiRouter() {
  const { logEvent, finalize } = useGameTracking(GAME_ID);

  const [state, setState] = useState<GameState>({
    placed: { ant: false, pow: false, pcb: false },
    running: false,
    bandGHz: 2.4,
    connected: 0,
  });

  const [hudLambda, setHudLambda] = useState("λ ≈ 0.125 m");
  const [asmPct, setAsmPct] = useState(0);
  const [hudAsm, setHudAsm] = useState("0/3 componentes");

  const [modal, setModal] = useState<ModalState>({
    open: false,
    title: "Información",
    html: "",
  });

  const appRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const routerRef = useRef<HTMLDivElement | null>(null);
  const routerBodyRef = useRef<HTMLDivElement | null>(null);
  const wavesRef = useRef<HTMLCanvasElement | null>(null);
  const ledPowerRef = useRef<HTMLDivElement | null>(null);
  const ledWifiRef = useRef<HTMLDivElement | null>(null);
  const ledNetRef = useRef<HTMLDivElement | null>(null);

  const animRef = useRef<number | null>(null);
  const dragCtx = useRef<DragCtx>(null);

  
  const openModal = (title: string, html: string) =>
    setModal({ open: true, title, html });
  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const toast = (msg: string, ms = 2200) => {
    openModal("Información", `<p>${msg}</p>`);
    setTimeout(() => setModal((m) => ({ ...m, open: false })), ms);
  };

  const canTransmit = () =>
    state.running && state.placed.ant && state.placed.pow && state.placed.pcb;

  const updateAsmHUD = (p = state.placed) => {
    const n = (p.ant ? 1 : 0) + (p.pow ? 1 : 0) + (p.pcb ? 1 : 0);
    setHudAsm(`${n}/3 componentes`);
    setAsmPct(Math.round((n / 3) * 100));
    if (n === 3) {
      ledNetRef.current?.classList.add("on");
      toast("🎉 ¡Router ensamblado! Enciende el WiFi.");
      logEvent("router_ensamblado");
    }
  };

  const setBars = (dev: Element, n: number) => {
    $$(".bar", dev).forEach((b, i) => b.classList.toggle("on", i < n));
  };

  // =================== Componentes (izquierda) DnD ===================
  useEffect(() => {
    const comps = [
      ["comp-antenna", "z-ant", "ant"],
      ["comp-power", "z-pow", "pow"],
      ["comp-pcb", "z-pcb", "pcb"],
    ] as const;

    const startDrag = (el: HTMLElement, x: number, y: number) => {
      if (el.dataset.placed === "1") return;
      const r = el.getBoundingClientRect();
      const clone = el.cloneNode(true) as HTMLDivElement;
      clone.style.width = `${r.width}px`;
      clone.style.height = `${r.height}px`;
      clone.style.position = "fixed";
      clone.style.left = `${r.left}px`;
      clone.style.top = `${r.top}px`;
      clone.style.zIndex = "1000";
      clone.style.pointerEvents = "none";
      document.body.appendChild(clone);
      el.setAttribute("aria-grabbed", "true");
      el.style.pointerEvents = "none";
      dragCtx.current = { id: el.id, offsetX: x - r.left, offsetY: y - r.top, clone, orig: el };
      moveDrag(x, y);
      $$(".zone:not(.filled)").forEach((z) => z.classList.add("drag"));
    };
    const moveDrag = (x: number, y: number) => {
      if (!dragCtx.current?.clone) return;
      dragCtx.current.clone.style.left = `${x - dragCtx.current.offsetX}px`;
      dragCtx.current.clone.style.top = `${y - dragCtx.current.offsetY}px`;
    };
    const endDrag = (x: number, y: number) => {
      const ctx = dragCtx.current;
      dragCtx.current = null;
      $$(".zone").forEach((z) => z.classList.remove("drag"));
      if (!ctx) return;
      const el = ctx.clone!;
      const orig = ctx.orig!;
      // zona de destino
      const conf = comps.find(([id]) => id === orig.id);
      const zoneEl = conf ? document.getElementById(conf[1])! : null;

      // restaurar si no hay zona
      if (!zoneEl || zoneEl.classList.contains("filled") === true) {
        el.remove();
        orig.removeAttribute("aria-grabbed");
        orig.style.pointerEvents = "";
        return;
      }
      const p = { x, y };
      const zr = zoneEl.getBoundingClientRect();
      if (!within(p.x, p.y, zr)) {
        el.remove();
        orig.removeAttribute("aria-grabbed");
        orig.style.pointerEvents = "";
        toast("💡 Arrastra cada componente a su zona correcta del router.");
        return;
      }

      // Colocar
      zoneEl.classList.add("filled");
      zoneEl.textContent = "";
      const rz = routerRef.current!.getBoundingClientRect();
      const dx = zr.left - rz.left;
      const dy = zr.top - rz.top;
      el.style.position = "absolute";
      el.style.left = `${dx}px`;
      el.style.top = `${dy}px`;
      el.style.width = `${zr.width}px`;
      el.style.height = `${zr.height}px`;
      el.style.zIndex = "5";
      routerRef.current!.appendChild(el);
      orig.style.display = "none";
      orig.dataset.placed = "1";

      setState((s) => {
        const placed = { ...s.placed, [conf![2]]: true } as GameState["placed"];
        // efectos
        if (conf![2] === "pow") ledPowerRef.current?.classList.add("on");
        if (conf![2] === "pcb") {
          routerBodyRef.current?.classList.add("ok");
          if (routerBodyRef.current) routerBodyRef.current.textContent = "";
        }
        if (conf![2] === "ant") el.textContent = "📡";
        updateAsmHUD(placed);
        logEvent("componente_colocado", { componente: conf![2] });
        return { ...s, placed };
      });
    };

    // Listeners globales
    const onMouseMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const onMouseUp = (e: MouseEvent) => endDrag(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (!dragCtx.current) return;
      const t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
    };
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      endDrag(t.clientX, t.clientY);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    // Start handlers en cada .comp
    $$(".comp", appRef.current!).forEach((el) => {
      el.addEventListener("mousedown", (e) => startDrag(el as HTMLElement, (e as MouseEvent).clientX, (e as MouseEvent).clientY));
      el.addEventListener("touchstart", (e) => {
        const t = (e as TouchEvent).touches[0];
        startDrag(el as HTMLElement, t.clientX, t.clientY);
        e.preventDefault();
      }, { passive: false });
    });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [logEvent]);

  // =================== Dispositivos: drag a escenario ===================
  useEffect(() => {
    const stage = stageRef.current!;
    const beginDragDevice = (e: MouseEvent | TouchEvent, el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const ghost = el.cloneNode(true) as HTMLDivElement;
      ghost.id = el.id + "-clone";
      ghost.classList.add("ghost");
      ghost.style.width = `${r.width}px`;
      ghost.style.height = `${r.height}px`;
      ghost.style.left = `${r.left}px`;
      ghost.style.top = `${r.top}px`;
      ghost.style.position = "fixed";
      document.body.appendChild(ghost);

      const getXY = (ev: MouseEvent | TouchEvent) =>
        "touches" in ev ? { x: ev.touches[0].clientX, y: ev.touches[0].clientY } : { x: ev.clientX, y: ev.clientY };

      const start = getXY(e);
      const offX = start.x - r.left;
      const offY = start.y - r.top;

      const moveAt = (x: number, y: number) => {
        ghost.style.left = `${x - offX}px`;
        ghost.style.top = `${y - offY}px`;
        updateBarsForGhost(ghost);
      };
      moveAt(start.x, start.y);

      const onMove = (ev: MouseEvent | TouchEvent) => {
        const p = getXY(ev);
        moveAt(p.x, p.y);
      };

      const onEnd = () => {
        document.removeEventListener("mousemove", onMove as any);
        document.removeEventListener("mouseup", onEnd);
        document.removeEventListener("touchmove", onMove as any);
        document.removeEventListener("touchend", onEnd);

        const g = ghost.getBoundingClientRect();
        const s = stage.getBoundingClientRect();
        const inside = g.left >= s.left && g.right <= s.right && g.top >= s.top && g.bottom <= s.bottom;

        if (inside) {
          ghost.style.left = `${g.left - s.left}px`;
          ghost.style.top = `${g.top - s.top}px`;
          ghost.style.position = "absolute";
          stage.appendChild(ghost);
          ghost.dataset.onstage = "1";
          ghost.classList.remove("ghost");
          makeMovableInsideStage(ghost, stage);
          connectAll();
          logEvent("dispositivo_colocado", { id: el.id });
        } else {
          ghost.remove();
        }
      };

      document.addEventListener("mousemove", onMove as any);
      document.addEventListener("mouseup", onEnd);
      document.addEventListener("touchmove", onMove as any, { passive: false });
      document.addEventListener("touchend", onEnd);
    };

    $$(".device", appRef.current!).forEach((el) => {
      el.addEventListener("mousedown", (e) => beginDragDevice(e as MouseEvent, el as HTMLElement));
      el.addEventListener("touchstart", (e) => beginDragDevice(e as TouchEvent, el as HTMLElement), { passive: true });
    });

    return () => {};
  }, [logEvent]);

  const makeMovableInsideStage = (node: HTMLDivElement, stage: HTMLDivElement) => {
    let dragging = false;
    let offX = 0, offY = 0;
    let bounds: DOMRect;

    const start = (e: MouseEvent | TouchEvent) => {
      dragging = true;
      const r = node.getBoundingClientRect();
      bounds = stage.getBoundingClientRect();
      const t = "touches" in e ? e.touches[0] : (e as MouseEvent);
      offX = t.clientX - r.left;
      offY = t.clientY - r.top;
      node.style.cursor = "grabbing";
    };
    const move = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const t = "touches" in e ? e.touches[0] : (e as MouseEvent);
      let nx = t.clientX - offX - bounds.left;
      let ny = t.clientY - offY - bounds.top;
      nx = Math.max(0, Math.min(bounds.width - node.offsetWidth, nx));
      ny = Math.max(0, Math.min(bounds.height - node.offsetHeight, ny));
      node.style.left = `${nx}px`;
      node.style.top = `${ny}px`;
      updateBarsForPlaced(node);
    };
    const end = () => {
      if (!dragging) return;
      dragging = false;
      node.style.cursor = "grab";
      connectAll();
    };

    node.style.cursor = "grab";
    node.addEventListener("mousedown", start);
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", end);
    node.addEventListener("touchstart", start, { passive: true });
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", end);
  };

  // =================== Canvas ondas ===================
  useEffect(() => {
    const c = wavesRef.current!;
    const ctx = c.getContext("2d")!;
    const resize = () => {
      c.width = c.clientWidth;
      c.height = c.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      animRef.current = requestAnimationFrame(loop);
      drawScene(ctx, c);
    };

    const drawScene = (ctx2: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      ctx2.clearRect(0, 0, canvas.width, canvas.height);
      if (!canTransmit()) return;

      const r = routerRef.current!.getBoundingClientRect();
      const cr = canvas.getBoundingClientRect();
      const R = { x: r.left - cr.left + r.width / 2, y: r.top - cr.top + r.height / 2 };

      // halo
      const g = ctx2.createRadialGradient(R.x, R.y, 0, R.x, R.y, Math.min(canvas.width, canvas.height) * 0.7);
      g.addColorStop(0, "rgba(56,189,248,0.22)");
      g.addColorStop(1, "rgba(56,189,248,0.00)");
      ctx2.fillStyle = g;
      ctx2.beginPath();
      ctx2.arc(R.x, R.y, Math.min(canvas.width, canvas.height) * 0.7, 0, Math.PI * 2);
      ctx2.fill();

      const t = performance.now() / 1000;
      const maxR = Math.hypot(canvas.width, canvas.height);

      for (let k = 0; k < 4; k++) {
        const base = t * 180 + k * 45;
        for (let r0 = 30; r0 <= maxR; r0 += 95) {
          const rad = (base + r0) % maxR;
          ctx2.beginPath();
          ctx2.arc(R.x, R.y, rad, 0, Math.PI * 2);
          ctx2.strokeStyle = "rgba(56,189,248,0.28)";
          ctx2.lineWidth = 2;
          ctx2.stroke();
        }
      }

      // flechas E/B hacia dispositivos
      const nodes = $$(".stage > .device, .stage > [id$='-clone']", appRef.current!);
      const t2 = performance.now() / 1000;
      nodes.forEach((nd) => {
        const nr = nd.getBoundingClientRect();
        const x = nr.left - cr.left + nr.width / 2;
        const y = nr.top - cr.top + nr.height / 2;
        const dx = x - R.x, dy = y - R.y, ang = Math.atan2(dy, dx), dist = Math.hypot(dx, dy);

        // ondas viajando
        for (let i = 0; i < 3; i++) {
          const prog = (t2 * 160 + i * 26) % dist;
          const px = R.x + Math.cos(ang) * prog;
          const py = R.y + Math.sin(ang) * prog;
          ctx2.beginPath();
          ctx2.arc(px, py, 9 + i * 4, 0, Math.PI * 2);
          ctx2.strokeStyle = "rgba(56,189,248,0.35)";
          ctx2.lineWidth = 2;
          ctx2.stroke();
        }

        // E y B
        const amp = 16;
        const phase = t2 * 4 + dist * 0.02;
        const ex = -Math.sin(ang) * amp * Math.sin(phase);
        const ey = Math.cos(ang) * amp * Math.sin(phase);
        const bx = -Math.cos(ang) * amp * 0.7 * Math.sin(phase);
        const by = -Math.sin(ang) * amp * 0.7 * Math.sin(phase);
        arrow(ctx2, x, y, x + ex, y + ey, "#f97316");
        arrow(ctx2, x, y, x + bx, y + by, "#22c55e");
      });
    };

    const arrow = (ctx2: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) => {
      const ang = Math.atan2(y2 - y1, x2 - x1);
      const len = Math.hypot(x2 - x1, y2 - y1);
      ctx2.save();
      ctx2.translate(x1, y1);
      ctx2.rotate(ang);
      ctx2.beginPath();
      ctx2.moveTo(0, 0);
      ctx2.lineTo(len, 0);
      ctx2.strokeStyle = color;
      ctx2.lineWidth = 3;
      ctx2.stroke();
      ctx2.beginPath();
      ctx2.moveTo(len, 0);
      ctx2.lineTo(len - 8, -6);
      ctx2.lineTo(len - 8, 6);
      ctx2.closePath();
      ctx2.fillStyle = color;
      ctx2.fill();
      ctx2.restore();
    };

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [state.running, state.placed]); // redibuja si cambian

  // =================== Señal y conexión ===================
  const strengthAt = (x: number, y: number) => {
    if (!canTransmit()) return 0;
    const r = routerRef.current!.getBoundingClientRect();
    const c = wavesRef.current!.getBoundingClientRect();
    const R = { x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2 };
    const dist = Math.hypot(x - R.x, y - R.y);
    const base = state.bandGHz === 2.4 ? 3.4 : 2.7;
    const distPenalty = dist / 380;
    return Math.round(clamp(base - distPenalty, 0, 4));
  };

  const updateBarsForGhost = (ghost: HTMLElement) => {
    const c = wavesRef.current!.getBoundingClientRect();
    const g = ghost.getBoundingClientRect();
    const cx = g.left - c.left + g.width / 2;
    const cy = g.top - c.top + g.height / 2;
    const s = strengthAt(cx, cy);
    setBars(ghost, s);
  };

  const updateBarsForPlaced = (node: HTMLElement) => {
    const c = wavesRef.current!.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    const x = r.left - c.left + r.width / 2;
    const y = r.top - c.top + r.height / 2;
    const s = strengthAt(x, y);
    setBars(node, s);
  };

  const connectAll = () => {
    let count = 0;
    $$(".stage > .device, .stage > [id$='-clone']", appRef.current!).forEach((d) => {
      updateBarsForPlaced(d as HTMLElement);
      const on = d.querySelectorAll(".bar.on").length;
      if (on >= 2 && canTransmit()) {
        d.classList.add("ok");
        count++;
      } else d.classList.remove("ok");
    });
    setState((s) => ({ ...s, connected: count }));
  };

  const disconnectAll = () => {
    $$(".device, .stage > .device, .stage > [id$='-clone']", appRef.current!).forEach((d) => {
      setBars(d, 0);
      d.classList.remove("ok");
    });
    setState((s) => ({ ...s, connected: 0 }));
  };

  // =================== Controles ===================
  const toggleWiFi = () => {
    if (!(state.placed.ant && state.placed.pow && state.placed.pcb)) {
      toast("❌ Ensambla las 3 piezas antes de encender.");
      return;
    }
    const running = !state.running;
    setState((s) => ({ ...s, running }));
    ledWifiRef.current?.classList.toggle("on", running);
    if (running) {
      toast("📡 WiFi activado – arrastra los dispositivos sobre las ondas.");
      logEvent("wifi_encendido");
    } else {
      logEvent("wifi_apagado");
    }
    setTimeout(connectAll, 10);
  };

  const setBand = (ghz: 2.4 | 5) => {
    const lambda = C / (ghz * 1e9);
    setHudLambda(`λ ≈ ${lambda.toFixed(3)} m`);
    setState((s) => ({ ...s, bandGHz: ghz }));
    logEvent("banda_cambiada", { ghz });
    setTimeout(connectAll, 10);
  };

  const reset = async () => {
    // terminar sesión como no exitosa (si no se terminó antes)
    await finalize(0);
    // limpiar
    setState({ placed: { ant: false, pow: false, pcb: false }, running: false, bandGHz: 2.4, connected: 0 });
    // LEDs y cuerpo
    routerBodyRef.current?.classList.remove("ok");
    if (routerBodyRef.current) routerBodyRef.current.textContent = "Cuerpo del router";
    [ledPowerRef, ledWifiRef, ledNetRef].forEach((r) => r.current?.classList.remove("on"));
    // devolver componentes
    const cont = $(".components", appRef.current!) as HTMLElement;
    ["comp-antenna", "comp-power", "comp-pcb"].forEach((id) => {
      const el = document.getElementById(id)! as HTMLDivElement;
      el.dataset.placed = "0";
      el.style.cssText = "";
      el.style.display = "";
      el.textContent = id === "comp-antenna" ? "📡 Antena WiFi" : id === "comp-power" ? "🔌 Adaptador" : "🔧 Circuito";
      cont.appendChild(el);
    });
    // limpiar zonas
    $$(".zone", appRef.current!).forEach((z) => {
      z.classList.remove("filled");
      const label = z.getAttribute("aria-label") || "Zona";
      z.textContent = label.includes("Antena") ? "Antena" : label.includes("Energía") ? "Energía" : "Circuito";
    });
    // limpiar dispositivos del stage
    $$(".stage > .device, .stage > [id$='-clone']", appRef.current!).forEach((n) => n.remove());
    setHudAsm("0/3 componentes");
    setAsmPct(0);
    setBand(2.4);
    disconnectAll();
    logEvent("reset");
  };

  // final simple cuando hay 3 conectados
  useEffect(() => {
    if (state.running && state.connected === 3) {
      setState((s) => ({ ...s, running: false }));
      ledWifiRef.current?.classList.remove("on");
      openModal("🏁 ¡Reto completado!", `<p><strong>¡Excelente!</strong> Los 3 dispositivos quedaron con buena señal.</p>`);
      logEvent("completado");
      finalize(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.connected, state.running]);

  // init banda lambda en primer render
  useEffect(() => {
    setBand(2.4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="wifi-app" ref={appRef} role="application" aria-label="Reto final: Red WiFi en acción">
      <header className="wifi-header">
        <div className="wifi-title">🔶 MaxwellPlay · Red WiFi en acción</div>
        <div className="hud" aria-live="polite">
          <div className="pill">📡 Conectados: <strong>{state.connected}</strong>/3</div>
          <div className="pill">
            <span className="badge">{state.bandGHz === 2.4 ? "2.4 GHz" : "5 GHz"}</span>
            <span className="badge">{hudLambda}</span>
          </div>
        </div>
      </header>

      <div className="wifi-main">
        {/* Panel izquierdo */}
        <aside className="panel components" aria-label="Componentes para ensamblar">
          <h3>Componentes</h3>
          <div className="hint">Arrastra cada pieza a su zona del router.</div>
          <div className="comp ant" id="comp-antenna" tabIndex={0} role="button" aria-label="Antena WiFi" aria-grabbed="false">📡 Antena WiFi</div>
          <div className="comp pow" id="comp-power" tabIndex={0} role="button" aria-label="Adaptador de energía" aria-grabbed="false">🔌 Adaptador</div>
          <div className="comp pcb" id="comp-pcb" tabIndex={0} role="button" aria-label="Circuito principal" aria-grabbed="false">🔧 Circuito</div>

          <h3 style={{ marginTop: 10 }}>Modo de juego</h3>
          <div className="opts">
            <div className="seg" role="tablist" aria-label="Selector de modo">
              {/* Sólo visuales (manual/libre); la lógica de pistas la podemos ampliar luego */}
              <button className="active" role="tab" aria-selected="true">Manual</button>
              <button role="tab" aria-selected="false">Libre</button>
            </div>
          </div>

          <h3 style={{ marginTop: 10 }}>Banda</h3>
          <div className="opts">
            <div className="seg" role="tablist" aria-label="Selector de banda WiFi">
              <button className={state.bandGHz === 2.4 ? "active" : ""} aria-selected={state.bandGHz === 2.4} onClick={() => setBand(2.4)}>2.4 GHz</button>
              <button className={state.bandGHz === 5 ? "active" : ""} aria-selected={state.bandGHz === 5} onClick={() => setBand(5)}>5 GHz</button>
            </div>
          </div>

          <h3 style={{ marginTop: 6 }}>Progreso</h3>
          <div className="opts">
            <div className="pill">📦 <span>{hudAsm}</span></div>
            <div className="pill ring" data-pct={asmPct} title="Porcentaje de ensamble"></div>
          </div>
        </aside>

        {/* Centro */}
        <section className="panel stage" ref={stageRef} aria-label="Escenario del juego">
          <canvas id="waves" ref={wavesRef} />
          <div className="router" id="router" ref={routerRef} aria-label="Router">
            <div className="body" id="routerBody" ref={routerBodyRef}>Cuerpo del router</div>
            <div className="leds">
              <div className="led power" id="ledPower" ref={ledPowerRef} aria-label="LED energía" title="Energía"></div>
              <div className="led wifi" id="ledWiFi" ref={ledWifiRef} aria-label="LED WiFi" title="WiFi"></div>
              <div className="led net"  id="ledNet"  ref={ledNetRef}  aria-label="LED Internet" title="Internet"></div>
            </div>
            <div className="zone z-ant" id="z-ant" aria-label="Zona Antena">Antena</div>
            <div className="zone z-pow" id="z-pow" aria-label="Zona Energía">Energía</div>
            <div className="zone z-pcb" id="z-pcb" aria-label="Zona Circuito">Circuito</div>
          </div>
        </section>

        {/* Derecha */}
        <aside className="panel devices" aria-label="Dispositivos a conectar">
          <h3>Dispositivos</h3>
          <div className="hint">Arrástralos al escenario; solo tendrán señal si el WiFi está encendido.</div>

          <div className="device" id="dev-laptop" aria-label="Portátil">
            💻
            <div className="bars"><div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div></div>
          </div>
          <div className="device" id="dev-phone" aria-label="Teléfono">
            📱
            <div className="bars"><div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div></div>
          </div>
          <div className="device" id="dev-tablet" aria-label="Tableta">
            📟
            <div className="bars"><div className="bar"></div><div className="bar"></div><div className="bar"></div><div className="bar"></div></div>
          </div>
        </aside>
      </div>

      <footer className="wifi-footer">
        <button className="btn b-ok" onClick={toggleWiFi} disabled={!(state.placed.ant && state.placed.pow && state.placed.pcb)}>
          {state.running ? "📡 Apagar WiFi" : "📡 Encender WiFi"}
        </button>
        <button className="btn b-warn" onClick={() =>
          openModal("📖 Manual",
            `<p><strong>Objetivo:</strong> Ensambla el router, enciende el WiFi y <b>arrastra los dispositivos</b> hacia las <b>ondas</b> para obtener señal.</p>
             <ol style="line-height:1.6">
               <li>Coloca 📡 Antena, 🔌 Adaptador y 🔧 Circuito en sus zonas.</li>
               <li>Presiona <b>Encender WiFi</b>.</li>
               <li>Arrastra 💻 📱 📟 al escenario.</li>
             </ol>`
          )
        }>📖 Manual</button>
        <button className="btn b-info" onClick={() => {
          const lambda = C / (state.bandGHz * 1e9);
          openModal("🔬 Explicación",
            `<div class="grid2">
              <div>
                <p><strong>Ondas EM:</strong> aparecen y se propagan <b>solo</b> cuando el router está armado y encendido.</p>
                <p><strong>Direcciones:</strong> <b>E</b> ⟂ <b>B</b> ⟂ <b>k</b>.</p>
                <p><strong>Velocidad:</strong> <code>c = 1/√(μ₀ε₀)</code>.</p>
              </div>
              <div>
                <p><strong>WiFi</strong> en <b>${state.bandGHz} GHz</b> → <b>λ ≈ ${lambda.toFixed(3)} m</b>.</p>
                <p>La señal disminuye con la distancia.</p>
              </div>
            </div>`
          );
        }}>🔬 Explicación</button>
        <button className="btn b-err" onClick={reset}>🔄 Reiniciar</button>

        <Link to="/menu" className="btn" style={{ background: "#6b7c93" }}>← Menú</Link>
      </footer>

      {/* Modal */}
      <div className={`modal ${modal.open ? "show" : ""}`} onClick={(e) => (e.target === e.currentTarget ? closeModal() : null)}>
        <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="m-title">
          <h2 id="m-title" dangerouslySetInnerHTML={{ __html: modal.title }} />
          <div id="m-body" className="content" dangerouslySetInnerHTML={{ __html: modal.html }} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <button className="btn b-ok" onClick={closeModal}>Entendido</button>
          </div>
        </div>
      </div>
    </div>
  );
}
