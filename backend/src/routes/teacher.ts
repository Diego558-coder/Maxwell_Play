import { Router } from "express";
import { q } from "../db";

interface TeacherStudentRow {
  id_estudiante: number;
  estudiante_nombre: string;
  codigo: string;
  aprobados: number;
  pendientes: number;
  ultima_actividad: Date | null;
}

interface ResumeRow {
  id_juego: number;
  slug: string;
  juego_nombre: string;
  id_sesion: number | null;
  inicio_ts: Date | null;
  fin_ts: Date | null;
  tiempo_seg: number | null;
  exito: 0 | 1 | null;
  insignia: "oro" | "plata" | "bronce" | "participó" | "—";
}

interface BestRow {
  id_juego: number;
  mejor_tiempo_seg: number;
}

const router = Router();

router.get("/students", async (req, res) => {
  try {
    const docenteId = Number(req.query.docenteId);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

    if (!docenteId) {
      return res.status(400).json({ error: "docenteId requerido" });
    }

    const params: any[] = [docenteId];
    let sql = `
      SELECT r.*
      FROM vw_docente_alumnos_resumen r
      JOIN Asignacion a ON a.id_estudiante = r.id_estudiante
  WHERE a.id_docente = ? AND a.activo = 1
    `;

    if (search) {
      sql += ` AND (r.estudiante_nombre LIKE ? OR r.codigo LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY r.estudiante_nombre ASC`;

    const rows = await q<TeacherStudentRow>(sql, params);
    res.json(rows);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

router.get("/students/:id/resume", async (req, res) => {
  try {
    const idEst = Number(req.params.id);
    if (!idEst) {
      return res.status(400).json({ error: "id_estudiante inválido" });
    }

    const resumen = await q<ResumeRow>(
      `
      SELECT
        j.id_juego,
        j.slug,
        j.nombre AS juego_nombre,
        s.id_sesion,
        s.inicio_ts,
        s.fin_ts,
        CASE
          WHEN s.id_sesion IS NULL THEN NULL
          ELSE COALESCE(s.tiempo_seg, TIMESTAMPDIFF(SECOND, s.inicio_ts, s.fin_ts))
        END AS tiempo_seg,
        s.exito,
        CASE
          WHEN s.id_sesion IS NULL THEN '—'
          WHEN s.exito = 0 THEN '—'
          WHEN COALESCE(s.tiempo_seg, TIMESTAMPDIFF(SECOND, s.inicio_ts, s.fin_ts)) <= r.oro_seg THEN 'oro'
          WHEN COALESCE(s.tiempo_seg, TIMESTAMPDIFF(SECOND, s.inicio_ts, s.fin_ts)) <= r.plata_seg THEN 'plata'
          WHEN COALESCE(s.tiempo_seg, TIMESTAMPDIFF(SECOND, s.inicio_ts, s.fin_ts)) <= r.bronce_seg THEN 'bronce'
          ELSE 'participó'
        END AS insignia
      FROM juegos j
      LEFT JOIN (
        SELECT s.*
        FROM juego_sesiones s
        JOIN (
          SELECT id_juego, MAX(id_sesion) AS last_sesion_id
          FROM juego_sesiones
          WHERE id_estudiante = ?
          GROUP BY id_juego
        ) latest ON latest.id_juego = s.id_juego AND latest.last_sesion_id = s.id_sesion
        WHERE s.id_estudiante = ?
      ) s ON s.id_juego = j.id_juego
      LEFT JOIN reglas_juego r ON r.id_juego = j.id_juego
      ORDER BY j.nombre ASC
    `,
      [idEst, idEst]
    );

    const mejores = await q<BestRow>(
      `
      SELECT
        s.id_juego,
        MIN(COALESCE(s.tiempo_seg, TIMESTAMPDIFF(SECOND, s.inicio_ts, s.fin_ts))) AS mejor_tiempo_seg
      FROM juego_sesiones s
      WHERE s.id_estudiante = ? AND s.exito = 1
      GROUP BY s.id_juego
    `,
      [idEst]
    );

    const bestMap = new Map<number, number>();
    for (const item of mejores) {
      bestMap.set(item.id_juego, item.mejor_tiempo_seg);
    }

    const out = resumen.map((r) => ({
      ...r,
      mejor_tiempo_seg: bestMap.get(r.id_juego) ?? null
    }));

    res.json(out);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

export default router;
