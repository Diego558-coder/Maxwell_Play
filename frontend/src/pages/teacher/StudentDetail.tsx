import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import api from "@/lib/api";
import "./teacher.css";

type Insignia = "oro" | "plata" | "bronce" | "participó" | "—";

type Item = {
  id_juego: number;
  slug: string;
  juego_nombre: string;
  id_sesion: number;
  inicio_ts: string;
  fin_ts: string | null;
  tiempo_seg: number | null;
  mejor_tiempo_seg: number | null;
  exito: 0 | 1;
  insignia: Insignia;
};

type ApiState = "idle" | "loading" | "ready" | "error";

export default function StudentDetail() {
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
      .get<Item[]>(`/api/teacher/students/${studentId}/resume`)
      .then((response) => {
        if (!isCancelled) {
          setItems(response.data);
          setStatus("ready");
        }
      })
      .catch((error) => {
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
          items.map((item) => (
            <div className="t-card game" key={item.id_juego}>
              <div className="t-card-title">{item.juego_nombre}</div>
              <div className="t-meta">
                <div>
                  <strong>Última sesión:</strong> #{item.id_sesion}
                </div>
                <div>
                  <strong>Tiempo:</strong> {item.tiempo_seg ?? "—"} s
                </div>
                <div>
                  <strong>Mejor tiempo:</strong> {item.mejor_tiempo_seg ?? "—"} s
                </div>
                <div>
                  <strong>Resultado:</strong> {item.exito ? "aprobado" : "no aprobado"}
                </div>
              </div>
              <div className="t-badges">
                <span className={pillClass(item.insignia)}>{item.insignia}</span>
              </div>
              <div className="t-actions">
                <Link className="t-btn small" to={`/play/${item.slug}`}>
                  Ver juego
                </Link>
              </div>
            </div>
          ))}
        {!isLoading && !isError && items.length === 0 && <div className="t-card">Sin partidas aún.</div>}
      </div>
    </div>
  );
}
