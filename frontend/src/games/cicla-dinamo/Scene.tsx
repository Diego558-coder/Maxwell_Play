import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { acotar } from "./utils";
import { CiclaDinamo } from "./types";
import {
  CONFIGURACION_DINAMO,
  MARCO,
  POSICIONES_INICIALES,
  PUNTO_CONTACTO_TRASERO,
  RADIO_LLANTA,
  TOLERANCIA_ENCAJE,
} from "./constants";
import "./cicla.css";


import framePng from "@/assets/bike-frame.png";
import wheelPng from "@/assets/wheel.png";
import dynamoPng from "@/assets/dynamo.png";

type Props = { alGanar?: () => void | Promise<void>; segundosTranscurridos?: number };

export default function EscenaJuegoCiclaDinamo({ alGanar, segundosTranscurridos = 0 }: Props) {
  const [cicla, setCicla] = useState(() => CiclaDinamo.inicial());

  const sceneRef = useRef<SVGSVGElement | null>(null);

  
  const grupoRuedaDelantera = useRef<SVGGElement | null>(null);
  const grupoRuedaTrasera = useRef<SVGGElement | null>(null);
  const rotorDelantero = useRef<SVGGElement | null>(null);
  const rotorTrasero = useRef<SVGGElement | null>(null);
  const grupoDinamo = useRef<SVGGElement | null>(null);

  const ejeDelanteroObjetivo = useRef<SVGCircleElement | null>(null);
  const ejeTraseroObjetivo = useRef<SVGCircleElement | null>(null);
  const destelloEjeDelantero = useRef<SVGCircleElement | null>(null);
  const destelloEjeTrasero = useRef<SVGCircleElement | null>(null);

  const puntoContactoRueda = useRef<SVGCircleElement | null>(null);
  const destelloContactoRueda = useRef<SVGCircleElement | null>(null);

  const terminalDinamoPositivo = useRef<SVGCircleElement | null>(null);
  const terminalDinamoNegativo = useRef<SVGCircleElement | null>(null);
  const terminalBombilloPositivo = useRef<SVGCircleElement | null>(null);
  const terminalBombilloNegativo = useRef<SVGCircleElement | null>(null);
  const destelloDinamoPositivo = useRef<SVGCircleElement | null>(null);
  const destelloDinamoNegativo = useRef<SVGCircleElement | null>(null);
  const destelloBombilloPositivo = useRef<SVGCircleElement | null>(null);
  const destelloBombilloNegativo = useRef<SVGCircleElement | null>(null);

  const cablePositivo = useRef<SVGLineElement | null>(null);
  const cableNegativo = useRef<SVGLineElement | null>(null);
  const extremoPositivoA = useRef<SVGCircleElement | null>(null);
  const extremoPositivoB = useRef<SVGCircleElement | null>(null);
  const extremoNegativoA = useRef<SVGCircleElement | null>(null);
  const extremoNegativoB = useRef<SVGCircleElement | null>(null);

  const vidrioBombillo = useRef<SVGEllipseElement | null>(null);
  const barraPotencia = useRef<HTMLDivElement | null>(null);
  const etiquetaPorcentaje = useRef<HTMLDivElement | null>(null);

  const [mensajeGuia, setMensajeGuia] = useState("Las zonas de destino se iluminan al tomar una pieza.");
  const [mensajeTemporal, setMensajeTemporal] = useState<string | null>(null);
  const [victoriaAlcanzada, setVictoriaAlcanzada] = useState(false);

  
  const llevarAlFrente = (elemento?: Element | null) => elemento?.parentNode?.appendChild(elemento);
  const convertirCoordenadasASvg = (coordenadaX: number, coordenadaY: number) => {
    const s = sceneRef.current!;
    const pt = s.createSVGPoint();
    pt.x = coordenadaX;
    pt.y = coordenadaY;
    return pt.matrixTransform(s.getScreenCTM()!.inverse());
  };
  const obtenerCentro = (elemento: SVGGraphicsElement) => {
    const limites = elemento.getBoundingClientRect();
    const centro = convertirCoordenadasASvg(
      limites.left + limites.width / 2,
      limites.top + limites.height / 2,
    );
    return { x: centro.x, y: centro.y };
  };
  const calcularDistancia = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.hypot(a.x - b.x, a.y - b.y);

  
  const configurarArrastreGrupo = (
    grupo: SVGGElement,
    alIniciar?: () => void,
    alSoltar?: () => void,
  ) => {
    let arrastrando = false;
    let puntoInicio = { x: 0, y: 0 };
    let base = { x: 0, y: 0 };

    const alPresionar = (evento: PointerEvent) => {
      evento.preventDefault();
      arrastrando = true;
      try { grupo.setPointerCapture(evento.pointerId); } catch {  }
      llevarAlFrente(grupo);
      const transformacion = grupo.transform.baseVal.consolidate()?.matrix;
      base = {
        x: transformacion ? transformacion.e : 0,
        y: transformacion ? transformacion.f : 0,
      };
      puntoInicio = convertirCoordenadasASvg(evento.clientX, evento.clientY);
      alIniciar?.();
      window.addEventListener("pointermove", alMover);
      window.addEventListener("pointerup", alLiberar, { once: true });
      window.addEventListener("pointercancel", alLiberar, { once: true });
    };
    const alMover = (evento: PointerEvent) => {
      if (!arrastrando) return;
      const posicion = convertirCoordenadasASvg(evento.clientX, evento.clientY);
      grupo.setAttribute(
        "transform",
        `translate(${base.x + posicion.x - puntoInicio.x},${base.y + posicion.y - puntoInicio.y})`,
      );
    };
    const alLiberar = () => {
      if (!arrastrando) return;
      arrastrando = false;
      alSoltar?.();
      window.removeEventListener("pointermove", alMover);
    };
    grupo.addEventListener("pointerdown", alPresionar);
    return () => {
      grupo.removeEventListener("pointerdown", alPresionar);
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("pointerup", alLiberar);
      window.removeEventListener("pointercancel", alLiberar);
    };
  };

  const configurarCableDeDosExtremos = (
    polaridad: "positivo" | "negativo",
    extremoA: SVGCircleElement,
    extremoB: SVGCircleElement,
    cable: SVGLineElement,
  ) => {
  const puntoDinamo = polaridad === "positivo" ? terminalDinamoPositivo.current! : terminalDinamoNegativo.current!;
  const puntoBombillo = polaridad === "positivo" ? terminalBombilloPositivo.current! : terminalBombilloNegativo.current!;
    const inicio = obtenerCentro(puntoDinamo);

    extremoA.setAttribute("cx", String(inicio.x));
    extremoA.setAttribute("cy", String(inicio.y));
    cable.setAttribute("x1", String(inicio.x));
    cable.setAttribute("y1", String(inicio.y));

    const destino = polaridad === "positivo" ? { x: 140, y: 296 } : { x: 200, y: 308 };
    extremoB.setAttribute("cx", String(destino.x));
    extremoB.setAttribute("cy", String(destino.y));
    cable.setAttribute("x2", String(destino.x));
    cable.setAttribute("y2", String(destino.y));

  const resplandorDinamo = polaridad === "positivo" ? destelloDinamoPositivo.current! : destelloDinamoNegativo.current!;
  const resplandorBombillo = polaridad === "positivo" ? destelloBombilloPositivo.current! : destelloBombilloNegativo.current!;

    const prepararExtremo = (extremo: SVGCircleElement, posicionCable: "A" | "B") => {
      let arrastrando = false;
      const posicionInicial = { x: +extremo.getAttribute("cx")!, y: +extremo.getAttribute("cy")! };
      let punteroActivo: number | null = null;
      let identificadorAnimacion: number | null = null;
      let ultimaPosicion: { x: number; y: number } | null = null;

      const actualizarPosicion = () => {
        if (!ultimaPosicion) return;
        const punto = ultimaPosicion;
        extremo.setAttribute("cx", String(punto.x));
        extremo.setAttribute("cy", String(punto.y));
        if (posicionCable === "A") { cable.setAttribute("x1", String(punto.x)); cable.setAttribute("y1", String(punto.y)); }
        else { cable.setAttribute("x2", String(punto.x)); cable.setAttribute("y2", String(punto.y)); }
        identificadorAnimacion = null;
      };

      const alPresionar = (evento: PointerEvent) => {
        evento.preventDefault();
        arrastrando = true;
        punteroActivo = evento.pointerId;
        try { (evento.target as Element).setPointerCapture(evento.pointerId); } catch { /* ignorar */ }
        llevarAlFrente(cable);
        llevarAlFrente(extremo);
  resplandorDinamo.classList.add("show");
        resplandorBombillo.classList.add("show");
        window.addEventListener("pointermove", alMover);
        window.addEventListener("pointerup", alSoltar);
        window.addEventListener("pointercancel", alSoltar);
      };

      const alMover = (evento: PointerEvent) => {
        if (!arrastrando) return;
        if (punteroActivo !== null && evento.pointerId !== punteroActivo) return;
        const punto = convertirCoordenadasASvg(evento.clientX, evento.clientY);
        ultimaPosicion = { x: punto.x, y: punto.y };
        if (identificadorAnimacion == null) {
          identificadorAnimacion = window.requestAnimationFrame(actualizarPosicion);
        }
      };

      const alSoltar = (evento?: PointerEvent) => {
        if (!arrastrando) return;
        arrastrando = false;
        if (punteroActivo !== null && evento && (evento.pointerId === undefined || evento.pointerId === punteroActivo)) {
          try { (evento.target as Element).releasePointerCapture(punteroActivo); } catch { /* ignorar */ }
        }
        punteroActivo = null;

        window.removeEventListener("pointermove", alMover);
        window.removeEventListener("pointerup", alSoltar);
        window.removeEventListener("pointercancel", alSoltar);
        if (identificadorAnimacion) {
          window.cancelAnimationFrame(identificadorAnimacion);
          identificadorAnimacion = null;
        }

        const centroExtremo = obtenerCentro(extremo);
        const centroDinamo = obtenerCentro(puntoDinamo);
        const centroBombillo = obtenerCentro(puntoBombillo);
        let encajado = false;
        if (calcularDistancia(centroExtremo, centroDinamo) < TOLERANCIA_ENCAJE) {
          extremo.setAttribute("cx", String(centroDinamo.x));
          extremo.setAttribute("cy", String(centroDinamo.y));
          if (posicionCable === "A") { cable.setAttribute("x1", String(centroDinamo.x)); cable.setAttribute("y1", String(centroDinamo.y)); }
          else { cable.setAttribute("x2", String(centroDinamo.x)); cable.setAttribute("y2", String(centroDinamo.y)); }
          encajado = true;
        } else if (calcularDistancia(centroExtremo, centroBombillo) < TOLERANCIA_ENCAJE) {
          extremo.setAttribute("cx", String(centroBombillo.x));
          extremo.setAttribute("cy", String(centroBombillo.y));
          if (posicionCable === "A") { cable.setAttribute("x1", String(centroBombillo.x)); cable.setAttribute("y1", String(centroBombillo.y)); }
          else { cable.setAttribute("x2", String(centroBombillo.x)); cable.setAttribute("y2", String(centroBombillo.y)); }
          encajado = true;
        }
        if (!encajado) {
          extremo.setAttribute("cx", String(posicionInicial.x));
          extremo.setAttribute("cy", String(posicionInicial.y));
          if (posicionCable === "A") { cable.setAttribute("x1", String(posicionInicial.x)); cable.setAttribute("y1", String(posicionInicial.y)); }
          else { cable.setAttribute("x2", String(posicionInicial.x)); cable.setAttribute("y2", String(posicionInicial.y)); }
        }
  resplandorDinamo.classList.remove("show");
        resplandorBombillo.classList.remove("show");
        verificarConexiones();
      };

      extremo.addEventListener("pointerdown", alPresionar);
      return () => {
        extremo.removeEventListener("pointerdown", alPresionar);
        window.removeEventListener("pointermove", alMover);
        window.removeEventListener("pointerup", alSoltar);
        window.removeEventListener("pointercancel", alSoltar);
        if (identificadorAnimacion) {
          window.cancelAnimationFrame(identificadorAnimacion);
        }
      };
    };

    const limpiarExtremoA = prepararExtremo(extremoA, "A");
    const limpiarExtremoB = prepararExtremo(extremoB, "B");
    return () => { limpiarExtremoA(); limpiarExtremoB(); };
  };

  const verificarConexiones = () => {
  const dP = obtenerCentro(terminalDinamoPositivo.current!);
  const bP = obtenerCentro(terminalBombilloPositivo.current!);
  const dM = obtenerCentro(terminalDinamoNegativo.current!);
  const bM = obtenerCentro(terminalBombilloNegativo.current!);
  const pA = obtenerCentro(extremoPositivoA.current!);
  const pB = obtenerCentro(extremoPositivoB.current!);
  const mA = obtenerCentro(extremoNegativoA.current!);
  const mB = obtenerCentro(extremoNegativoB.current!);

    const positivo = (calcularDistancia(pA, dP) < 14 && calcularDistancia(pB, bP) < 14)
      || (calcularDistancia(pB, dP) < 14 && calcularDistancia(pA, bP) < 14);
    const negativo = (calcularDistancia(mA, dM) < 14 && calcularDistancia(mB, bM) < 14)
      || (calcularDistancia(mB, dM) < 14 && calcularDistancia(mA, bM) < 14);

    setCicla((estado) => estado.conCables(
      estado.cables
        .conPositivoConectado(positivo)
        .conNegativoConectado(negativo),
    ));
  };

  useEffect(() => {
    if (victoriaAlcanzada) {
  rotorDelantero.current?.classList.remove("spin");
  rotorTrasero.current?.classList.remove("spin");
      return;
    }
    let id: number | undefined;
    if (cicla.estaPedaleando) {
  rotorDelantero.current?.classList.add("spin");
  rotorTrasero.current?.classList.add("spin");
      const loop = () => {
        setCicla((actual) => {
          const siguienteCadencia = acotar(actual.cadencia + 0.06, 0, 1);
          const incrementoBase = actual.dinamo.estaApoyada ? 1 : 0.2;
          const siguientePotencia = acotar(actual.potencia * 0.85 + incrementoBase * actual.cadencia * 25, 0, 100);
          return actual.conMetricas(siguienteCadencia, siguientePotencia);
        });
        id = window.setTimeout(loop, 120);
      };
      loop();
    } else {
  rotorDelantero.current?.classList.remove("spin");
  rotorTrasero.current?.classList.remove("spin");
      const enfriar = () => {
        setCicla((actual) => {
          const siguienteCadencia = acotar(actual.cadencia - 0.08, 0, 1);
          const siguientePotencia = acotar(actual.potencia - 4, 0, 100);
          return actual.conMetricas(siguienteCadencia, siguientePotencia);
        });
        if (id) window.setTimeout(enfriar, 120);
      };
      enfriar();
    }
    return () => { if (id) window.clearTimeout(id); };
  }, [cicla.estaPedaleando, cicla.dinamo.estaApoyada, victoriaAlcanzada]);


  const paso1 = cicla.ruedas.estanMontadas;
  const paso2 = paso1 && cicla.dinamo.estaApoyada;
  const paso3 = paso2 && cicla.cables.estanCompletos;
  const listoParaPedalear = paso3;

  useEffect(() => {
  if (barraPotencia.current) barraPotencia.current.style.width = `${cicla.potencia | 0}%`;
  if (etiquetaPorcentaje.current) etiquetaPorcentaje.current.textContent = `${cicla.potencia | 0}%`;
    const bombilloEncendido = cicla.bombillo.estaEncendido;
    const iluminado = bombilloEncendido && listoParaPedalear;
  vidrioBombillo.current?.classList.toggle("bulb-lit", iluminado);

    if (!paso1) setMensajeGuia("Encaja las dos ruedas en los ejes verdes.");
    else if (!cicla.dinamo.estaApoyada) setMensajeGuia("Apoya la dínamo: su rodillo debe tocar la rueda trasera (izquierda).");
    else if (!paso3) setMensajeGuia("Conecta cables: rojo al + y negro al – (en la dínamo y el bombillo).");
    else if (bombilloEncendido) setMensajeGuia("¡Excelente! Llegaste al 100%. Espera un momento.");
    else setMensajeGuia("¡Listo! Pedalea hasta que la potencia llegue a 100%.");
  }, [cicla, listoParaPedalear, paso1, paso3]);

  useEffect(() => {
    if (victoriaAlcanzada || !listoParaPedalear || cicla.potencia < 100) return;
    setVictoriaAlcanzada(true);
    setCicla((actual) => actual.detenerPedaleo());
  }, [listoParaPedalear, cicla.potencia, victoriaAlcanzada]);

  useEffect(() => {
    if (!alGanar || !victoriaAlcanzada) return;
    const temporizadorVictoria = window.setTimeout(() => alGanar?.(), 600);
    return () => { if (temporizadorVictoria) clearTimeout(temporizadorVictoria); };
  }, [victoriaAlcanzada, alGanar]);


  useEffect(() => {
    const limpiarRuedaDelantera = grupoRuedaDelantera.current ? configurarArrastreGrupo(
      grupoRuedaDelantera.current,
      () => destelloEjeDelantero.current?.classList.add("show"),
      () => {
        destelloEjeDelantero.current?.classList.remove("show");
        const centroRueda = obtenerCentro(grupoRuedaDelantera.current!);
        const objetivo = obtenerCentro(ejeDelanteroObjetivo.current!);
        if (calcularDistancia(centroRueda, objetivo) < TOLERANCIA_ENCAJE) {
          grupoRuedaDelantera.current!.setAttribute("transform", `translate(${objetivo.x},${objetivo.y})`);
          setCicla((estado) => estado.conRuedas(estado.ruedas.conDelanteraMontada(true)));
        }
      }
    ) : undefined;

    const limpiarRuedaTrasera = grupoRuedaTrasera.current ? configurarArrastreGrupo(
      grupoRuedaTrasera.current,
      () => destelloEjeTrasero.current?.classList.add("show"),
      () => {
        destelloEjeTrasero.current?.classList.remove("show");
        const centroRueda = obtenerCentro(grupoRuedaTrasera.current!);
        const objetivo = obtenerCentro(ejeTraseroObjetivo.current!);
        if (calcularDistancia(centroRueda, objetivo) < TOLERANCIA_ENCAJE) {
          grupoRuedaTrasera.current!.setAttribute("transform", `translate(${objetivo.x},${objetivo.y})`);
          setCicla((estado) => estado.conRuedas(estado.ruedas.conTraseraMontada(true)));
        }
      }
    ) : undefined;

    const limpiarDinamo = grupoDinamo.current ? configurarArrastreGrupo(
      grupoDinamo.current,
      () => destelloContactoRueda.current?.classList.add("show"),
      () => {
        destelloContactoRueda.current?.classList.remove("show");
        const gC = obtenerCentro(grupoDinamo.current!);
        const puntoRodillo = {
          x: gC.x + CONFIGURACION_DINAMO.rodillo.x,
          y: gC.y + CONFIGURACION_DINAMO.rodillo.y,
        };
        const puntoContacto = obtenerCentro(puntoContactoRueda.current!);
        if (calcularDistancia(puntoRodillo, puntoContacto) < TOLERANCIA_ENCAJE) {
          const m = grupoDinamo.current!.transform.baseVal.consolidate()?.matrix;
          const bx = m ? m.e : 0, by = m ? m.f : 0;
          const dx = puntoContacto.x - puntoRodillo.x - 2;
          const dy = puntoContacto.y - puntoRodillo.y;
          grupoDinamo.current!.setAttribute("transform", `translate(${bx + dx},${by + dy})`);
          llevarAlFrente(grupoDinamo.current);
          llevarAlFrente(sceneRef.current!.querySelector("#wires"));
          setCicla((estado) => estado.conDinamo(estado.dinamo.conApoyo(true)));
        }
      }
    ) : undefined;

    const limpiarCablePositivo = (extremoPositivoA.current && extremoPositivoB.current && cablePositivo.current)
      ? configurarCableDeDosExtremos("positivo", extremoPositivoA.current, extremoPositivoB.current, cablePositivo.current) : undefined;
    const limpiarCableNegativo = (extremoNegativoA.current && extremoNegativoB.current && cableNegativo.current)
      ? configurarCableDeDosExtremos("negativo", extremoNegativoA.current, extremoNegativoB.current, cableNegativo.current) : undefined;

    return () => { limpiarRuedaDelantera?.(); limpiarRuedaTrasera?.(); limpiarDinamo?.(); limpiarCablePositivo?.(); limpiarCableNegativo?.(); };
    
  }, []);

 
  const reiniciarEscenario = () => {
    setVictoriaAlcanzada(false);
    setCicla(() => CiclaDinamo.inicial());

    grupoRuedaDelantera.current?.setAttribute(
      "transform",
      `translate(${POSICIONES_INICIALES.ruedaDelantera.x},${POSICIONES_INICIALES.ruedaDelantera.y})`
    );
    grupoRuedaTrasera.current?.setAttribute(
      "transform",
      `translate(${POSICIONES_INICIALES.ruedaTrasera.x},${POSICIONES_INICIALES.ruedaTrasera.y})`
    );
    grupoDinamo.current?.setAttribute(
      "transform",
      `translate(${POSICIONES_INICIALES.dinamo.x},${POSICIONES_INICIALES.dinamo.y})`
    );

    const dP = obtenerCentro(terminalDinamoPositivo.current!);
    const dM = obtenerCentro(terminalDinamoNegativo.current!);

    if (extremoPositivoA.current && extremoPositivoB.current && cablePositivo.current) {
      extremoPositivoA.current.setAttribute("cx", String(dP.x));
      extremoPositivoA.current.setAttribute("cy", String(dP.y));
      extremoPositivoB.current.setAttribute("cx", "140");
      extremoPositivoB.current.setAttribute("cy", "296");
      cablePositivo.current.setAttribute("x1", String(dP.x));
      cablePositivo.current.setAttribute("y1", String(dP.y));
      cablePositivo.current.setAttribute("x2", "140");
      cablePositivo.current.setAttribute("y2", "296");
    }
    if (extremoNegativoA.current && extremoNegativoB.current && cableNegativo.current) {
      extremoNegativoA.current.setAttribute("cx", String(dM.x));
      extremoNegativoA.current.setAttribute("cy", String(dM.y));
      extremoNegativoB.current.setAttribute("cx", "200");
      extremoNegativoB.current.setAttribute("cy", "308");
      cableNegativo.current.setAttribute("x1", String(dM.x));
      cableNegativo.current.setAttribute("y1", String(dM.y));
      cableNegativo.current.setAttribute("x2", "200");
      cableNegativo.current.setAttribute("y2", "308");
    }
  };

  const alternarPedaleo = () => {
    if (!paso3 || victoriaAlcanzada) return;
    setCicla((actual) => actual.alternarPedaleo());
  };
  const mostrarAviso = (mensaje: string, duracionMs = 3500) => {
    setMensajeTemporal(mensaje);
    window.setTimeout(() => setMensajeTemporal(null), duracionMs);
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-gradient-to-br from-[#1e3c72] to-[#2a5298] select-none">
      <div className="fixed top-0 left-0 w-full h-16 z-40 bg-white/5 backdrop-blur">
        <div className="relative w-full h-full grid place-items-center">
          <div className="text-white font-extrabold text-[clamp(1.2rem,2.4vw,2.2rem)] drop-shadow">Generación de energía</div>
          <Link to="/menu" className="absolute left-3 px-4 py-2 rounded-xl bg-white/20 text-white font-extrabold hover:bg-white/30">← Menú</Link>
          <div className="absolute right-4 -translate-y-1/2 top-1/2 rounded-lg bg-white/20 px-3 py-1 font-bold text-white shadow-sm">
            ⏱ {segundosTranscurridos}s
          </div>
        </div>
      </div>


      <div className="fixed left-3 top-20 w-[300px] bg-white/10 text-white rounded-2xl p-3 backdrop-blur-md z-30">
        <div className={`step ${cicla.ruedas.estanMontadas ? "done" : "active"}`}>
          <span className="dot" /> 1 Encaja <b>ruedas</b>
        </div>
        <div className={`step ${cicla.dinamo.estaApoyada ? "done" : cicla.ruedas.estanMontadas ? "active" : ""}`}>
          <span className="dot" /> 2) Apoya <b>dínamo</b>
        </div>
        <div className={`step ${cicla.cables.estanCompletos ? "done" : cicla.dinamo.estaApoyada ? "active" : ""}`}>
          <span className="dot" /> 3) Conecta <b>cables</b>
        </div>
        <div className={`step ${cicla.cables.estanCompletos ? (cicla.bombillo.estaEncendido ? "done" : "active") : ""}`}>
          <span className="dot" /> 4) <b>Pedalea</b>
        </div>
        <div className="text-sm opacity-90 mt-2">{mensajeGuia}</div>
      </div>


      <div className="fixed right-3 top-20 w-[260px] bg-white/10 text-white rounded-2xl p-3 backdrop-blur-md z-30">
        <div>⚡ Potencia</div>
        <div className="h-4 bg-white/30 rounded-md overflow-hidden">
          <div ref={barraPotencia} className="h-full w-0" style={{ background: "linear-gradient(90deg,#e74c3c,#f39c12,#27ae60)", transition: "width .12s" }} />
        </div>
        <div ref={etiquetaPorcentaje} className="mt-1 font-bold text-right">0%</div>
      </div>


      {mensajeTemporal && (
        <div className="fixed left-1/2 -translate-x-1/2 top-[90px] bg-white text-gray-800 px-3 py-2 rounded-lg shadow-2xl font-bold max-w-[80vw]">
          {mensajeTemporal}
        </div>
      )}


      <div className="absolute inset-x-0 top-16 bottom-20 grid place-items-center">
        <svg ref={sceneRef} viewBox="0 0 900 520" className="max-h-full w-[min(92vw,1000px)] h-auto">
          <rect x="0" y="470" width="900" height="50" fill="rgba(0,0,0,.15)" />


          <g id="frame">
            <image href={framePng} x={MARCO.x} y={MARCO.y} width={MARCO.ancho} height={MARCO.alto} />
            <circle ref={ejeDelanteroObjetivo} cx={MARCO.ejeDelantero.x} cy={MARCO.ejeDelantero.y} r="10" fill="#27ae60" />
            <circle ref={ejeTraseroObjetivo}  cx={MARCO.ejeTrasero.x}  cy={MARCO.ejeTrasero.y}  r="10" fill="#27ae60" />
            <circle ref={destelloEjeDelantero} className="targetGlow" cx={MARCO.ejeDelantero.x} cy={MARCO.ejeDelantero.y} r="22" fill="none" stroke="#fff" strokeWidth={4} />
            <circle ref={destelloEjeTrasero}  className="targetGlow" cx={MARCO.ejeTrasero.x}  cy={MARCO.ejeTrasero.y}  r="22" fill="none" stroke="#fff" strokeWidth={4} />
          </g>


          <g ref={grupoRuedaTrasera} className="wheel" transform={`translate(${POSICIONES_INICIALES.ruedaTrasera.x},${POSICIONES_INICIALES.ruedaTrasera.y})`}>
            <g ref={rotorTrasero} className="rotor">
              <image href={wheelPng} x={-RADIO_LLANTA - 5} y={-RADIO_LLANTA - 5} width={(RADIO_LLANTA + 5) * 2} height={(RADIO_LLANTA + 5) * 2} />
              <circle ref={puntoContactoRueda} cx={PUNTO_CONTACTO_TRASERO.x} cy={PUNTO_CONTACTO_TRASERO.y} r="8" fill="#27ae60" />
              <circle ref={destelloContactoRueda} className="targetGlow" cx={PUNTO_CONTACTO_TRASERO.x} cy={PUNTO_CONTACTO_TRASERO.y} r="18" fill="none" stroke="#fff" strokeWidth={4} />
            </g>
          </g>


          <g ref={grupoRuedaDelantera} className="wheel" transform={`translate(${POSICIONES_INICIALES.ruedaDelantera.x},${POSICIONES_INICIALES.ruedaDelantera.y})`}>
            <g ref={rotorDelantero} className="rotor">
              <image href={wheelPng} x={-RADIO_LLANTA - 5} y={-RADIO_LLANTA - 5} width={(RADIO_LLANTA + 5) * 2} height={(RADIO_LLANTA + 5) * 2} />
            </g>
          </g>


          <g ref={grupoDinamo} className="dynamo" transform={`translate(${POSICIONES_INICIALES.dinamo.x},${POSICIONES_INICIALES.dinamo.y})`}>
            <image href={dynamoPng} x={-CONFIGURACION_DINAMO.ancho / 2} y={-CONFIGURACION_DINAMO.alto / 2} width={CONFIGURACION_DINAMO.ancho} height={CONFIGURACION_DINAMO.alto} />
            <circle cx={CONFIGURACION_DINAMO.rodillo.x} cy={CONFIGURACION_DINAMO.rodillo.y} r="10" fill="#7f8c8d" stroke="#95a5a6" strokeWidth={3}/>
            <circle ref={terminalDinamoPositivo}  cx={CONFIGURACION_DINAMO.positivo.x}  cy={CONFIGURACION_DINAMO.positivo.y}  r="7" fill="#e74c3c" stroke="#fff" strokeWidth={2}/>
            <circle ref={terminalDinamoNegativo} cx={CONFIGURACION_DINAMO.negativo.x} cy={CONFIGURACION_DINAMO.negativo.y} r="7" fill="#34495e" stroke="#fff" strokeWidth={2}/>
            <text x={CONFIGURACION_DINAMO.positivo.x - 10}  y={CONFIGURACION_DINAMO.positivo.y - 8}  fill="#fff" fontSize={11} fontWeight={700}>+</text>
            <text x={CONFIGURACION_DINAMO.negativo.x - 10} y={CONFIGURACION_DINAMO.negativo.y - 8} fill="#fff" fontSize={11} fontWeight={700}>–</text>
            <circle ref={destelloDinamoPositivo}  className="targetGlow" cx={CONFIGURACION_DINAMO.positivo.x}  cy={CONFIGURACION_DINAMO.positivo.y}  r="17" fill="none" stroke="#fff" strokeWidth={4}/>
            <circle ref={destelloDinamoNegativo} className="targetGlow" cx={CONFIGURACION_DINAMO.negativo.x} cy={CONFIGURACION_DINAMO.negativo.y} r="17" fill="none" stroke="#fff" strokeWidth={4}/>
          </g>


          <g transform="translate(700,180)">
            <defs>
              <radialGradient id="gBulb" cx="50%" cy="35%"><stop offset="0%" stopColor="#f1c40f" /><stop offset="100%" stopColor="#f39c12" /></radialGradient>
            </defs>
            <ellipse ref={vidrioBombillo} cx="0" cy="0" rx="40" ry="55" fill="url(#gBulb)" className="bulb-glass" />
            <rect x="-18" y="50" width="36" height="26" rx="6" fill="#95a5a6" stroke="#7f8c8d" strokeWidth={3} />
            <circle ref={terminalBombilloPositivo}  cx="-12" cy="78" r="8" fill="#e74c3c" stroke="#fff" strokeWidth={2} />
            <circle ref={terminalBombilloNegativo} cx=" 12" cy="78" r="8" fill="#34495e" stroke="#fff" strokeWidth={2} />
            <text x="-30" y="98" fill="#fff" fontSize={12} fontWeight={700}>+</text>
            <text x="20"  y="98" fill="#fff" fontSize={12} fontWeight={700}>–</text>
            <circle ref={destelloBombilloPositivo}  className="targetGlow" cx="-12" cy="78" r="18" fill="none" stroke="#fff" strokeWidth={4}/>
            <circle ref={destelloBombilloNegativo} className="targetGlow" cx=" 12" cy="78" r="18" fill="none" stroke="#fff" strokeWidth={4}/>
          </g>

          <g id="wires">

            <line ref={cablePositivo}  x1="102" y1="296" x2="140" y2="296" stroke="#e74c3c" strokeWidth={5} strokeLinecap="round"/>
            <circle ref={extremoPositivoA} className="lead" cx="102" cy="296" r="10" fill="#e74c3c" stroke="#fff" strokeWidth={2}/>
            <circle ref={extremoPositivoB} className="lead" cx="140" cy="296" r="10" fill="#e74c3c" stroke="#fff" strokeWidth={2}/>

            <line ref={cableNegativo} x1="160" y1="328" x2="200" y2="308" stroke="#34495e" strokeWidth={5} strokeLinecap="round"/>
            <circle ref={extremoNegativoA} className="lead" cx="160" cy="328" r="10" fill="#34495e" stroke="#fff" strokeWidth={2}/>
            <circle ref={extremoNegativoB} className="lead" cx="200" cy="308" r="10" fill="#34495e" stroke="#fff" strokeWidth={2}/>
          </g>
        </svg>
      </div>




      <div className="fixed left-1/2 -translate-x-1/2 bottom-3 flex gap-2 bg-white/10 backdrop-blur-md p-2 rounded-xl z-40">
        <button className={`px-4 py-2 rounded-lg font-bold text-white ${listoParaPedalear ? "bg-emerald-600" : "bg-emerald-600/40 cursor-not-allowed"}`} onClick={alternarPedaleo} disabled={!listoParaPedalear}>
          {cicla.estaPedaleando ? "⏹️ Parar" : "🚴 Pedalear"}
        </button>
        <button className="px-4 py-2 rounded-lg font-bold text-white bg-rose-600" onClick={reiniciarEscenario}>🔄 Reiniciar</button>
        <button className="px-4 py-2 rounded-lg font-bold text-white bg-amber-500" onClick={() => mostrarAviso("Encaja ruedas → dínamo → cables → pedalea.")}>📖 Ayuda</button>
        <button className="px-4 py-2 rounded-lg font-bold text-white bg-sky-600" onClick={() => mostrarAviso("Faraday: ε = -dΦ/dt")}>➡️ Siguiente</button>
      </div>
    </div>
  );
}
