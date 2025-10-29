import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { isAxiosError } from "axios";
import type { AxiosResponse } from "axios";
import "./profesor.css";

type Insignia = "oro" | "plata" | "bronce" | "participó" | "—";

type Item = {
  id_juego: number;
  slug: string;
  juego_nombre: string;
  id_sesion: number | null;
  inicio_ts: string | null;
  fin_ts: string | null;
  tiempo_seg: number | null;
  mejor_tiempo_seg: number | null;
  exito: 0 | 1 | null;
  insignia: Insignia;
};

type DisplayItem = Item & { missing?: boolean };

const GAME_ORDER: Array<{ slug: string; nombre: string }> = [
  { slug: "cicla-dinamo", nombre: "Cicla dínamo" },
  { slug: "carga-electrica", nombre: "Globos Carga eléctrica" },
  { slug: "gauss-magnetico", nombre: "Tren Gauss magnético" },
  { slug: "microondas", nombre: "Microondas" },
  { slug: "wifi-router", nombre: "Red WiFi en acción" }
];

type ApiState = "idle" | "loading" | "ready" | "error";

export default function DetalleEstudiante() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<ApiState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const studentId = useMemo(() => Number(id), [id]);
  const docenteId = searchParams.get("docenteId");

  useEffect(() => {
    if (!studentId) {
      setStatus("error");
      setErrorMessage("Identificador inválido");
      return;
    }

    let isCancelled = false;
    setStatus("loading");
    setErrorMessage(null);

    api
      .get<Item[]>(`/api/docentes/estudiantes/${studentId}/resumen`)
      .then((response: AxiosResponse<Item[]>) => {
        if (!isCancelled) {
          setItems(response.data);
          setStatus("ready");
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) {
          setItems([]);
          setStatus("error");
          const message = isAxiosError(error)
            ? (error.response?.data as { error?: string } | undefined)?.error || error.message
            : (error as Error).message;
          setErrorMessage(message);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [studentId]);

  const isLoading = status === "loading";
  const isError = status === "error";

  const displayItems: DisplayItem[] = useMemo(() => {
    const bySlug = new Map(items.map((item) => [item.slug, item]));
    const base = GAME_ORDER.map((game, index) => {
      const current = bySlug.get(game.slug);
      if (current) {
        return {
          ...current,
          juego_nombre: game.nombre,
          slug: game.slug
        };
      }
      return {
        id_juego: -(index + 1),
        slug: game.slug,
        juego_nombre: game.nombre,
        id_sesion: null,
        inicio_ts: null,
        fin_ts: null,
        tiempo_seg: null,
        mejor_tiempo_seg: null,
        exito: null,
        insignia: "—" as Insignia,
        missing: true
      };
    });

    const extras = items
      .filter((item) => !GAME_ORDER.some((game) => game.slug === item.slug))
      .map((item) => ({ ...item, juego_nombre: item.juego_nombre || item.slug }));
    return [...base, ...extras];
  }, [items]);

  const pillClass = (insignia: Insignia) => {
    const map: Record<Insignia, string> = {
      oro: "pill oro",
      plata: "pill plata",
      bronce: "pill bronce",
      participó: "pill gray",
      "—": "pill gray"
    };
    return map[insignia];
  };

  return (
    <div className="t-container">
      <div className="t-header">
        <div className="t-title">📋 Detalle del alumno</div>
        <div className="t-actions">
          <Link
            to={docenteId ? `/docente?docenteId=${docenteId}` : "/docente"}
            className="t-btn"
          >
            ← Volver
          </Link>
        </div>
      </div>

      <div className="t-grid">
        {isLoading && <div className="t-card">Cargando…</div>}
        {isError && !isLoading && <div className="t-card">{errorMessage || "No se pudo cargar la información."}</div>}
        {!isLoading && !isError &&
          displayItems.map((item) => {
            const ultimaSesion = item.id_sesion != null ? `#${item.id_sesion}` : "—";
            const tiempoActual = item.tiempo_seg != null ? `${item.tiempo_seg} s` : "— s";
            const mejorTiempo = item.mejor_tiempo_seg != null ? `${item.mejor_tiempo_seg} s` : "— s";
            const resultado = item.exito === 1 ? "aprobado" : item.exito === 0 ? "no aprobado" : "sin intentos";

            return (
              <div className="t-card game" key={item.slug}>
                <div className="t-card-title">{item.juego_nombre}</div>
                <div className="t-meta">
                  <div>
                    <strong>Última sesión:</strong> {ultimaSesion}
                  </div>
                  <div>
                    <strong>Tiempo:</strong> {tiempoActual}
                  </div>
                  <div>
                    <strong>Mejor tiempo:</strong> {mejorTiempo}
                  </div>
                  <div>
                    <strong>Resultado:</strong> {resultado}
                  </div>
                </div>
                <div className="t-badges">
                  <span className={pillClass(item.insignia)}>{item.insignia}</span>
                </div>
              </div>
            );
          })}
        {!isLoading && !isError && displayItems.length === 0 && <div className="t-card">Sin partidas aún.</div>}
      </div>
    </div>
  );
}
