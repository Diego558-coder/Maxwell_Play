import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import api from "@/lib/api";
import "./teacher.css";
import { cerrarSesion } from "@/state/session";

type Row = {
  id_estudiante: number;
  estudiante_nombre: string;
  codigo: string;
  aprobados: number;
  pendientes: number;
  ultima_actividad: string | null;
};

type ApiState = "idle" | "loading" | "ready" | "error";

export default function TeacherList() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const docenteId = params.get("docenteId") || "1";
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<ApiState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    setStatus("loading");
    setErrorMessage(null);

    api
      .get<Row[]>("/api/teacher/students", {
        params: {
          docenteId,
          ...(search.trim() ? { search: search.trim() } : {})
        }
      })
      .then((response) => {
        if (!isCancelled) {
          setRows(response.data);
          setStatus("ready");
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          setRows([]);
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
  }, [docenteId, search]);

  const isLoading = status === "loading";
  const isError = status === "error";

  return (
    <div className="t-container">
      <div className="t-header">
        <div className="t-title">👨‍🏫 Vista Docente</div>
        <div className="t-actions">
          <input
            placeholder="Buscar por nombre o código…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="t-btn" onClick={() => window.print()}>
            📤 Exportar listado
          </button>
          <button
            className="t-btn warn"
            onClick={() => { cerrarSesion(); nav("/login"); }}
            title="Cerrar la sesión actual"
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </div>

      <div className="t-card">
        <div className="t-table">
          <div className="t-thead">
            <div>Estudiante</div>
            <div>Código</div>
            <div>Aprobados</div>
            <div>Pendientes</div>
            <div>Última actividad</div>
            <div>Acción</div>
          </div>

          {isLoading && <div className="t-row">Cargando…</div>}

          {isError && !isLoading && (
            <div className="t-row">{errorMessage || "No se pudo cargar la información."}</div>
          )}

          {!isLoading && !isError &&
            rows.map((row) => (
              <div className="t-row" key={row.id_estudiante}>
                <div className="t-cell">{row.estudiante_nombre}</div>
                <div className="t-cell code">{row.codigo}</div>
                <div className="t-cell ok">{row.aprobados}</div>
                <div className="t-cell warn">{row.pendientes}</div>
                <div className="t-cell muted">{row.ultima_actividad ?? "—"}</div>
                <div className="t-cell">
                  <Link
                    className="t-btn small"
                    to={`/docente/alumno/${row.id_estudiante}?docenteId=${docenteId}`}
                  >
                    Ver detalle
                  </Link>
                </div>
              </div>
            ))}

          {!isLoading && !isError && rows.length === 0 && (
            <div className="t-row">Sin estudiantes asignados.</div>
          )}
        </div>
      </div>
    </div>
  );
}
