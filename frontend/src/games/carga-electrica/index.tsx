import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./carga.css";

import {
  ALTO_GLOBO, ANCHO_GLOBO, LARGO_CUERDA,
  ATRACCION_MAXIMA_PAPELITOS, ROTACION_MAXIMA_PAPELITOS, ESCALA_MAXIMA_PAPELITOS, RADIO_ATRACCION_PAPELITOS, SUAVIZADO_ATRACCION_PAPELITOS,
  GRAVEDAD_BASE, GRAVEDAD_CARGADO, REBOTE, FRICCION_AIRE, REBOTE_PARED, COEFICIENTE_REPELENCIA, PASO_MAXIMO_REPELENCIA
} from "./constants";

import { Globo, Vector2 } from "./types";
type EstadoModal = { titulo: string; cuerpo: string } | null;
import { obtenerRectanguloLocal, globoSobreMesa, generarElectrones } from "./utils";
import PersonHair from "./components/PersonHair";

export default function CargaElectrica({ onExito }: { onExito?: () => void }) {
  const juegoRef = useRef<HTMLDivElement | null>(null);
  const cabelloRef = useRef<HTMLDivElement | null>(null);
  const areaGlobosRef = useRef<HTMLDivElement | null>(null);
  const mesaCentralRef = useRef<HTMLDivElement | null>(null);
  const mesaPapelitosRef = useRef<HTMLDivElement | null>(null);

  const [globos, definirGlobos] = useState<Globo[]>(() => [
    Globo.create({ id: 1, color: "#45c2a8" }),
    Globo.create({ id: 2, color: "#e85d5d" }),
    Globo.create({ id: 3, color: "#f77f00" }),
    Globo.create({ id: 4, color: "#fcbf49" }),
  ]);

  const [idArrastre, definirIdArrastre] = useState<number | null>(null);
  const [desplazamiento, definirDesplazamiento] = useState({ x: 0, y: 0 });

  const [modal, definirModal] = useState<EstadoModal>(null);
  const cargaMostradaRef = useRef(false);

  const [papelitosAtraidos, definirPapelitosAtraidos] = useState(false);
  const [gano, definirGano] = useState(false);
  const totalGlobos = globos.length;
  const globosCargados = globos.filter((b) => b.charged).length;
  const todosCargados = totalGlobos > 0 && globosCargados === totalGlobos;

  const exitoNotificadoRef = useRef(false);
  const alExitoRef = useRef(onExito);
  useEffect(() => { alExitoRef.current = onExito; }, [onExito]);

  
  function restablecerTransformacionPapelitos() {
    const mesa = mesaPapelitosRef.current;
    if (!mesa) return;
    const papelitos = mesa.querySelectorAll<HTMLElement>(".paper-piece");
    papelitos.forEach((p) => {
      p.style.transition = "transform 0.35s ease-in";
      p.style.transform = "translate(0px, 0px) rotate(0deg) scale(1)";
    });
  }

  const actualizarAtraccionPapelitos = useCallback((id: number, clientX: number, clientY: number) => {
    const globo = globos.find((x) => x.id === id);
    const mesa = mesaPapelitosRef.current;
    if (!globo || !mesa) return;

    if (!globo.charged) {
      definirPapelitosAtraidos(false);
      restablecerTransformacionPapelitos();
      return;
    }

    const rectMesa = mesa.getBoundingClientRect();
    const centroX = rectMesa.left + rectMesa.width / 2;
    const centroY = rectMesa.top + rectMesa.height / 2;
    const distanciaMesa = Math.hypot(clientX - centroX, clientY - centroY);

    if (distanciaMesa < RADIO_ATRACCION_PAPELITOS) {
      definirPapelitosAtraidos(true);
      const papelitos = mesa.querySelectorAll<HTMLElement>(".paper-piece");
      papelitos.forEach((p, i) => {
        if (i % 2 !== 0) return;
        const pr = p.getBoundingClientRect();
        const px = pr.left + pr.width / 2;
        const py = pr.top + pr.height / 2;

        const dx = clientX - px;
        const dy = clientY - py;
        const d  = Math.hypot(dx, dy) || 1;

        const traccion = Math.min(ATRACCION_MAXIMA_PAPELITOS, (1 - d / RADIO_ATRACCION_PAPELITOS) * ATRACCION_MAXIMA_PAPELITOS);
        const tx = (dx / d) * traccion * SUAVIZADO_ATRACCION_PAPELITOS;
        const ty = (dy / d) * traccion * SUAVIZADO_ATRACCION_PAPELITOS;

        const rand = parseFloat(p.dataset.rand || "0");
        const jitter = (rand - 0.5) * 10;
        const rot = (rand - 0.5) * ROTACION_MAXIMA_PAPELITOS;
        const escala = 1 + (1 - Math.min(d / RADIO_ATRACCION_PAPELITOS, 1)) * (ESCALA_MAXIMA_PAPELITOS - 1) * 0.7;

        p.style.transition = "transform 0.18s ease-out";
        p.style.transform = `translate(${tx + jitter}px, ${ty}px) rotate(${rot}deg) scale(${escala})`;
      });
    } else {
      definirPapelitosAtraidos(false);
      restablecerTransformacionPapelitos();
    }
  }, [globos]);

  function alPresionarGlobo(e: React.PointerEvent, id: number) {
    if (gano) return;
    const objetivo = e.currentTarget as HTMLDivElement;
    const rect = objetivo.getBoundingClientRect();
    definirDesplazamiento({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    definirIdArrastre(id);
    objetivo.setPointerCapture(e.pointerId);
    definirGlobos((prev) =>
      prev.map((globo) => (globo.id === id ? globo.withVelocity(Vector2.zero()).withRope(0).withFalling(false) : globo)),
    );
  }

  function alMoverGlobo(e: React.PointerEvent, id: number) {
    if (gano) return;
    if (idArrastre !== id) return;
    const area = areaGlobosRef.current;
    if (!area) return;
    const rectArea = area.getBoundingClientRect();
    const nuevoX = e.clientX - rectArea.left - desplazamiento.x;
    const nuevoY = e.clientY - rectArea.top - desplazamiento.y;
    definirGlobos((prev) => prev.map((globo) => (globo.id === id ? globo.withPosition(new Vector2(nuevoX, nuevoY)) : globo)));
    intentarCargar(id, e.clientX, e.clientY);
    actualizarAtraccionPapelitos(id, e.clientX, e.clientY);
  }

  const finalizarArrastreEnPantalla = useCallback((id: number, clientX: number, clientY: number) => {
    const area = areaGlobosRef.current;
    const mesa = mesaCentralRef.current;
    if (!area) return;
  const rectMesa = mesa ? obtenerRectanguloLocal(mesa, area) : null;

    definirGlobos((prev) =>
      prev.map((globo) => {
        if (globo.id !== id) return globo;
        const globoSinVelocidad = globo.withVelocity(Vector2.zero());
        if (rectMesa) {
          const tocaParteSuperior = Math.abs(globo.pos.y + ALTO_GLOBO - rectMesa.y) <= 6;
          const solapaEjeX = globo.pos.x + ANCHO_GLOBO > rectMesa.x && globo.pos.x < rectMesa.x + rectMesa.w;
          if (tocaParteSuperior && solapaEjeX) {
            return globoSinVelocidad
              .withPosition(globoSinVelocidad.pos.with({ y: rectMesa.y - ALTO_GLOBO }))
              .withFalling(false);
          }
        }
        return globoSinVelocidad.withFalling(true);
      }),
    );
    actualizarAtraccionPapelitos(id, clientX, clientY);
  }, [actualizarAtraccionPapelitos]);

  function alSoltarGlobo(e: React.PointerEvent, id: number) {
    if (gano) return;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch (error) {
      console.error("Error liberando captura de puntero:", error);
    }
    if (idArrastre === id) definirIdArrastre(null);
    finalizarArrastreEnPantalla(id, e.clientX, e.clientY);
  }

  useEffect(() => {
    function alSoltarGlobal(ev: PointerEvent) {
      if (gano) return;
      if (idArrastre == null) return;
      finalizarArrastreEnPantalla(idArrastre, ev.clientX, ev.clientY);
      definirIdArrastre(null);
    }
    window.addEventListener("pointerup", alSoltarGlobal);
    return () => window.removeEventListener("pointerup", alSoltarGlobal);
  }, [idArrastre, gano, finalizarArrastreEnPantalla]);

  function intentarCargar(id: number, clientX: number, clientY: number) {
    if (gano) return;
    const cabello = cabelloRef.current;
    if (!cabello) return;
    const rectCabello = cabello.getBoundingClientRect();
    const dentroDelCabello = clientX >= rectCabello.left && clientX <= rectCabello.right && clientY >= rectCabello.top && clientY <= rectCabello.bottom;
    if (dentroDelCabello) {
      let seCargo = false;
      definirGlobos(prev => prev.map(globo => {
        if (globo.id !== id) return globo;
  if (globo.charged) return globo.ensureElectrons(generarElectrones);
        seCargo = true;
  return globo.withCharged(true, generarElectrones);
      }));
      if (seCargo && !cargaMostradaRef.current) cargaMostradaRef.current = true;

      cabello.classList.add("animate-wiggle");
      setTimeout(() => cabello.classList.remove("animate-wiggle"), 520);

      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          const s = document.createElement("div");
          s.className = "w-1 h-1 rounded-full bg-yellow-300 opacity-100 animate-sparkle";
          s.style.position = "fixed";
          s.style.left = `${clientX + (Math.random() * 24 - 12)}px`;
          s.style.top  = `${clientY + (Math.random() * 24 - 12)}px`;
          document.body.appendChild(s);
          setTimeout(() => s.remove(), 520);
        }, i * 80);
      }
    }
  }

  useEffect(() => {
    const mesa = mesaPapelitosRef.current;
    if (!mesa) return;
    const papelitos = mesa.querySelectorAll<HTMLElement>(".paper-piece");
    papelitos.forEach((p) => { if (!p.dataset.rand) p.dataset.rand = Math.random().toFixed(3); });
  }, []);

  useEffect(() => {
    if (gano || !todosCargados) return;

    definirGano(true);
    if (!exitoNotificadoRef.current) {
      exitoNotificadoRef.current = true;
      alExitoRef.current?.();
    }
    definirModal({
      titulo: "¡Felicitaciones! 🎉",
      cuerpo:
        "¡Cargaste los cuatro globos por fricción!\n\nEl tiempo quedó registrado. Usa «Reiniciar» si deseas intentarlo de nuevo.",
    });
  }, [todosCargados, gano]);


  useEffect(() => {
    let idAnimacion = 0, tiempo = 0;
    const paso = () => {
      const area = areaGlobosRef.current;
      const mesaElemento = mesaCentralRef.current;
      if (!area || !mesaElemento) { idAnimacion = requestAnimationFrame(paso); return; }

  const rectMesa = obtenerRectanguloLocal(mesaElemento, area)!;
      const minimoX = rectMesa.x;
  const maximoX = rectMesa.x + rectMesa.w - ANCHO_GLOBO;
  const minimoY = rectMesa.y;
  const maximoY = rectMesa.y + rectMesa.h - ALTO_GLOBO;

      definirGlobos((prev) => {
        const fuerzasX: number[] = new Array(prev.length).fill(0);
        const fuerzasY: number[] = new Array(prev.length).fill(0);

        for (let i = 0; i < prev.length; i++) {
          const globoA = prev[i];
          if (!globoA.charged) continue;
          for (let j = i + 1; j < prev.length; j++) {
            const globoB = prev[j];
            if (!globoB.charged) continue;
            const dx = globoA.pos.x - globoB.pos.x;
            const dy = globoA.pos.y - globoB.pos.y;
            const distanciaCuadrada = dx * dx + dy * dy + 60;
            const distancia = Math.sqrt(distanciaCuadrada);
            const fuerza = Math.min(PASO_MAXIMO_REPELENCIA, COEFICIENTE_REPELENCIA / distanciaCuadrada);
            const normalX = dx / distancia;
            const normalY = dy / distancia;
            fuerzasX[i] += normalX * fuerza;
            fuerzasY[i] += normalY * fuerza;
            fuerzasX[j] -= normalX * fuerza;
            fuerzasY[j] -= normalY * fuerza;
          }
        }

  const radioElectronX = ANCHO_GLOBO * 0.32;
  const radioElectronY = ALTO_GLOBO * 0.38;

        return prev.map((globo, indice) => {
          const base = globo.charged ? globo.ensureElectrons(generarElectrones) : globo.withElectrons([]);

          if (idArrastre === base.id || gano) {
            const cuerda = base.rope + ((Math.max(-14, Math.min(14, -0.9 * base.vel.x)) - base.rope) * 0.2);
            return base.withRope(cuerda).stepElectrons(radioElectronX, radioElectronY);
          }

          let x = base.pos.x;
          let y = base.pos.y;
          let velocidadX = base.vel.x;
          let velocidadY = base.vel.y;
          let cayendo = base.falling;

          const sobreMesa = globoSobreMesa(base, rectMesa);
          if (!sobreMesa && y < maximoY) cayendo = true;

          velocidadY += base.charged ? GRAVEDAD_CARGADO : GRAVEDAD_BASE;

          if (base.charged) {
            velocidadX += 0.02 * Math.cos(tiempo * 0.12 + base.id * 1.7);
            velocidadY -= 0.015 * Math.sin(tiempo * 0.15 + base.id * 2.1);
            velocidadX += fuerzasX[indice] || 0;
            velocidadY += fuerzasY[indice] || 0;
          }

          if (velocidadY > 0) {
            const golpeaX = x + ANCHO_GLOBO > minimoX && x < maximoX + ANCHO_GLOBO;
            const bordeInferior = y + ALTO_GLOBO;
            if (golpeaX && bordeInferior >= minimoY && bordeInferior <= minimoY + 8) {
              y = minimoY - ALTO_GLOBO;
              velocidadY = 0;
              velocidadX *= 0.82;
              cayendo = false;
            }
          }

          if (y >= maximoY) {
            y = maximoY;
            velocidadY = -velocidadY * REBOTE;
            if (Math.abs(velocidadY) < 0.7) velocidadY = 0;
            if (Math.abs(velocidadX) < 0.1) velocidadX = 0;
          }
          if (x <= minimoX) { x = minimoX; velocidadX = -velocidadX * REBOTE_PARED; }
          if (x >= maximoX) { x = maximoX; velocidadX = -velocidadX * REBOTE_PARED; }
          if (y <  minimoY) { y = minimoY; velocidadY = -velocidadY * REBOTE; }

          velocidadX *= FRICCION_AIRE;
          velocidadY *= FRICCION_AIRE;

          const cuerda = base.rope + ((Math.max(-14, Math.min(14, -0.9 * velocidadX + 1.2 * Math.sin(tiempo * 0.08 + base.id))) - base.rope) * 0.15);

          return base
            .withPosition(new Vector2(x, y))
            .withVelocity(new Vector2(velocidadX, velocidadY))
            .withFalling(cayendo)
            .withRope(cuerda)
            .stepElectrons(radioElectronX, radioElectronY);
        });
      });

      tiempo += 1;
      idAnimacion = requestAnimationFrame(paso);
    };

    idAnimacion = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(idAnimacion);
  }, [idArrastre, gano]);

  const restablecerJuego = useCallback(() => {
    const area = areaGlobosRef.current;
    const mesa = mesaCentralRef.current;
    if (!area || !mesa) return;

  const rectMesa = obtenerRectanguloLocal(mesa, area)!;
    const columnas = 4;
    const separacion = rectMesa.w / (columnas + 1);

    definirGlobos((prev) =>
      prev.map((globo, indice) => {
  const x = rectMesa.x + separacion * (indice + 1) - ANCHO_GLOBO / 2;
  const y = rectMesa.y - ALTO_GLOBO - 2;
        return globo
          .withCharged(false)
          .withVelocity(Vector2.zero())
          .withPosition(new Vector2(x, y))
          .withFalling(false)
          .withRope(0);
      }),
    );

    definirGano(false);
    definirPapelitosAtraidos(false);
    restablecerTransformacionPapelitos();

    setTimeout(() => {
      definirModal({
        titulo: "👋 ¡Bienvenido!",
        cuerpo: "Objetivo: carga los cuatro globos por fricción y luego atrae los papelitos.\n\n1) Frota cada globo con el cabello.\n2) Cuando todos estén cargados, acércalos a los papelitos.\n3) ¡Haz que los papelitos se muevan para ganar!",
      });
    }, 50);
  }, []);

  useEffect(() => { setTimeout(() => restablecerJuego(), 0); }, [restablecerJuego]);

  return (
    <div
      ref={juegoRef}
      className="w-full relative flex flex-col bg-gradient-to-br from-indigo-400 to-purple-700 overflow-hidden rounded-xl"
      style={{ minHeight: "60vh" }}
    >
      <Link to="/menu" className="absolute top-2 left-2 z-50 px-3 py-2 rounded-xl bg-white/20 text-white font-extrabold text-base hover:bg-white/30">← Menú</Link>
      <div className="absolute top-2 right-2 z-50 px-3 py-2 rounded-xl bg-white/20 text-white font-bold text-sm backdrop-blur">
        🔋 Globos cargados: {globosCargados}/{totalGlobos}
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 p-3 relative">

        <PersonHair hairRef={cabelloRef as React.RefObject<HTMLDivElement>} disabled={gano} />


        <div className="flex flex-col items-center md:items-end md:col-start-3 md:justify-self-end md:place-self-end md:mr-4 gap-2">
          <div ref={mesaPapelitosRef} className="relative w-full max-w-[320px] h-[80px] bg-amber-800 rounded-lg shadow-lg">
            <div className="absolute left-4 -bottom-8 w-2 h-8 bg-amber-900" />
            <div className="absolute right-4 -bottom-8 w-2 h-8 bg-amber-900" />
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-[80px] flex flex-wrap gap-1 justify-center">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="paper-piece w-[12px] h-[12px] bg-white rounded-sm"
                  style={{
                    transition: "transform 0.35s ease",
                    willChange: "transform",
                    animation: !papelitosAtraidos ? "paperFloat 2.4s ease-in-out infinite" : "none",
                  }}
                />
              ))}
            </div>
          </div>
          <div className="w-full max-w-[320px] text-center md:text-right text-white font-extrabold text-lg drop-shadow-md">
            Papelitos
          </div>
        </div>


        <div ref={areaGlobosRef} className="relative md:col-span-3 rounded-xl overflow-visible" style={{ height: "28vh" }}>
          <div
            ref={mesaCentralRef}
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: 80, width: "calc(100% - 64px)", maxWidth: "1200px", height: "90px",
              borderRadius: "0.8rem", backgroundColor: "#92400e",
              boxShadow: "0 20px 60px rgba(0,0,0,.25), inset 0 -6px 12px rgba(0,0,0,0.12)",
              border: "1px solid #78350f",
            }}
            title="Mesa central"
          >
            <div className="absolute left-8 -bottom-6 w-2.5 h-8 bg-amber-900 rounded-md" />
            <div className="absolute right-8 -bottom-6 w-2.5 h-8 bg-amber-900 rounded-md" />
            <div className="absolute inset-x-0 top-0 h-2 rounded-t-2xl bg-amber-700/40 pointer-events-none" />
          </div>

          {globos.map((globo) => (
            <div
              key={globo.id}
              onPointerDown={(e) => alPresionarGlobo(e, globo.id)}
              onPointerMove={(e) => alMoverGlobo(e, globo.id)}
              onPointerUp={(e) => alSoltarGlobo(e, globo.id)}
              className="absolute z-10 cursor-grab active:cursor-grabbing select-none"
              style={{ left: globo.pos.x, top: globo.pos.y, width: ANCHO_GLOBO, height: ALTO_GLOBO, touchAction: "none", pointerEvents: gano ? "none" : "auto" }}
              title={globo.charged ? "Cargado" : "Arrástrame"}
            >

              <div
                style={{
                  position: "absolute",
                  left: ANCHO_GLOBO / 2 + globo.rope,
                  top: ALTO_GLOBO - 2,
                  transform: "translateX(-50%)",
                  width: 3,
                  height: LARGO_CUERDA,
                  background: "#111827",
                  borderRadius: "999px",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: ANCHO_GLOBO / 2 + globo.rope,
                  top: ALTO_GLOBO - 2 + LARGO_CUERDA - 2,
                  transform: "translateX(-50%)",
                  width: 8,
                  height: 6,
                  borderRadius: "999px 999px 0 0",
                  background: "#0f172a",
                  pointerEvents: "none",
                }}
              />


              <div
                className={`relative transition-transform ${idArrastre === globo.id ? "scale-105" : globo.charged ? "animate-balloonWobble" : ""}`}
                style={{
                  width: "100%", height: "100%", borderRadius: "50% / 55%",
                  background: `radial-gradient(120% 120% at 30% 25%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 10%, ${globo.color} 60%, ${globo.color} 100%)`,
                  boxShadow: globo.charged ? "0 0 22px rgba(255,255,0,0.85), inset 0 -8px 14px rgba(0,0,0,0.15)"
                                    : "inset 0 -8px 14px rgba(0,0,0,0.15)",
                  filter: globo.charged ? "saturate(1.08) contrast(1.05)" : "none",
                }}
              >
                {globo.charged && globo.electrons.map((electron, indiceElectron) => (
                  <div key={indiceElectron} style={{
                    position: "absolute", left: electron.x - electron.size / 2, top: electron.y - electron.size / 2,
                    width: electron.size, height: electron.size, borderRadius: "50%",
                    background: "radial-gradient(circle at 30% 30%, #a5d8ff 0%, #60a5fa 40%, #2563eb 100%)",
                    boxShadow: "0 0 6px rgba(96,165,250,.9)", opacity: 0.95,
                  }}/>
                ))}
                <div className="pointer-events-none" style={{ position: "absolute", left: "7%", top: "10%", width: "28%", height: "28%", borderRadius: "50%", background: "rgba(255,255,255,0.5)", filter: "blur(2px)", opacity: 0.7 }} />
                <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%) rotate(45deg)", bottom: "-6%", width: "12%", height: "12%", background: "#27272a", borderRadius: "3px" }} />
              </div>
            </div>
          ))}
        </div>
      </div>


      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white/10 p-3 rounded-xl backdrop-blur-md z-[100]">
        <button onClick={restablecerJuego} className="px-3 py-1.5 text-sm rounded-lg font-bold text-white bg-rose-500 hover:bg-rose-600 transition">🔄 Reiniciar</button>
        <button onClick={() => definirModal({ titulo: "📖 Manual", cuerpo: "1) Frota el globo con el cabello.\n2) Acércalo a los papelitos." })} className="px-3 py-1.5 text-sm rounded-lg font-bold text-white bg-amber-500 hover:bg-amber-600 transition">📖 Manual</button>
      </div>

      {modal && (
        <div className="fixed inset-0 grid place-items-center p-4 z-[120]">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white text-gray-800 rounded-xl shadow-2xl p-5 w-full max-w-md">
            <h3 className="text-lg font-extrabold mb-2">{modal.titulo}</h3>
            <p className="mb-3 text-sm whitespace-pre-line">{modal.cuerpo}</p>
            <div className="text-right">
              <button onClick={() => definirModal(null)} className="px-4 py-2 text-sm rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition">Continuar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
