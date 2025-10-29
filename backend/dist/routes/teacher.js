"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
router.get("/students", async (req, res) => {
    try {
        const docenteId = Number(req.query.docenteId);
        const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
        if (!docenteId) {
            return res.status(400).json({ error: "docenteId requerido" });
        }
        const params = [docenteId];
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
        const rows = await (0, db_1.q)(sql, params);
        res.json(rows);
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
});
router.get("/students/:id/resume", async (req, res) => {
    try {
        const idEst = Number(req.params.id);
        if (!idEst) {
            return res.status(400).json({ error: "id_estudiante inválido" });
        }
        const resumen = await (0, db_1.q)(`
      SELECT
        id_juego, slug, juego_nombre,
        id_sesion, inicio_ts, fin_ts, tiempo_seg, exito, insignia
      FROM vw_alumno_juego_resumen
      WHERE id_estudiante = ?
    `, [idEst]);
        const juegos = await (0, db_1.q)(`
      SELECT id_juego, slug, nombre
      FROM juegos
      ORDER BY nombre ASC
    `);
        const resumenPorJuego = new Map();
        for (const row of resumen) {
            resumenPorJuego.set(row.id_juego, row);
        }
        const merged = juegos.map((juego) => {
            const data = resumenPorJuego.get(juego.id_juego);
            if (data) {
                return {
                    ...data,
                    juego_nombre: data.juego_nombre || juego.nombre,
                    slug: data.slug || juego.slug
                };
            }
            return {
                id_juego: juego.id_juego,
                slug: juego.slug,
                juego_nombre: juego.nombre,
                id_sesion: null,
                inicio_ts: null,
                fin_ts: null,
                tiempo_seg: null,
                exito: null,
                insignia: "—"
            };
        });
        const mejores = await (0, db_1.q)(`
      SELECT
        s.id_juego,
        MIN(COALESCE(s.tiempo_seg, TIMESTAMPDIFF(SECOND, s.inicio_ts, s.fin_ts))) AS mejor_tiempo_seg
      FROM juego_sesiones s
      WHERE s.id_estudiante = ? AND s.exito = 1
      GROUP BY s.id_juego
    `, [idEst]);
        const bestMap = new Map();
        for (const item of mejores) {
            bestMap.set(item.id_juego, item.mejor_tiempo_seg);
        }
        const out = merged.map((r) => ({
            ...r,
            mejor_tiempo_seg: bestMap.get(r.id_juego) ?? null
        }));
        res.json(out);
    }
    catch (error) {
        const err = error;
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
