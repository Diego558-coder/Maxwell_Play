"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const requireAuth_1 = require("../middlewares/requireAuth");
const router = (0, express_1.Router)();
/**
 * GET /juegos/:id/reglas
 * Lee Reglas y Umbrales para que el front valide el minijuego.
 */
router.get("/:id/reglas", requireAuth_1.requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    if (!id)
        return res.status(400).json({ msg: "id inválido" });
    const [reglas] = await db_1.pool.query("SELECT tipo_pieza, minimo, maximo FROM ReglaPieza WHERE id_juego=?", [id]);
    const [umb] = await db_1.pool.query("SELECT oro_seg, plata_seg, bronce_seg FROM UmbralesJuego WHERE id_juego=? LIMIT 1", [id]);
    res.json({
        reglas: reglas,
        umbrales: umb[0] || null
    });
});
/**
 * POST /juegos/:id/progreso
 * Body: { tiempo_seg: number, completado: 0|1, medalla?: 'ORO'|'PLATA'|'BRONCE' }
 * Lógica: guardar SOLO si mejora mejor_tiempo o mejor_medalla.
 */
router.post("/:id/progreso", requireAuth_1.requireAuth, async (req, res) => {
    const id_juego = Number(req.params.id);
    const { tiempo_seg, medalla, completado } = req.body || {};
    const user = req.user;
    if (!id_juego || typeof tiempo_seg !== "number") {
        return res.status(400).json({ msg: "Datos inválidos" });
    }
    // Leer progreso actual
    const [rows] = await db_1.pool.query("SELECT id_progreso, mejor_tiempo, mejor_medalla FROM Progreso WHERE id_estudiante=? AND id_juego=? LIMIT 1", [user.id_usuario, id_juego]);
    const cur = rows[0];
    const mejorMedalla = (a, b) => {
        const orden = { "ORO": 3, "PLATA": 2, "BRONCE": 1, "": 0, "NULL": 0 };
        return (orden[a || ""] >= orden[b || ""]) ? a : b;
    };
    if (!cur) {
        await db_1.pool.query("INSERT INTO Progreso (id_estudiante, id_juego, mejor_tiempo, mejor_medalla, completado, fec_ultima_actualizacion) VALUES (?, ?, ?, ?, ?, NOW())", [user.id_usuario, id_juego, tiempo_seg, medalla || null, completado ? 1 : 0]);
        return res.json({ msg: "Progreso creado" });
    }
    let nuevoTiempo = cur.mejor_tiempo;
    let nuevaMedalla = cur.mejor_medalla;
    // Mejora por tiempo (menor es mejor)
    if (cur.mejor_tiempo == null || tiempo_seg < cur.mejor_tiempo) {
        nuevoTiempo = tiempo_seg;
    }
    // Mejora por medalla (ORO>PLATA>BRONCE)
    if (medalla) {
        nuevaMedalla = mejorMedalla(medalla, cur.mejor_medalla);
    }
    await db_1.pool.query("UPDATE Progreso SET mejor_tiempo=?, mejor_medalla=?, completado=GREATEST(completado, ?), fec_ultima_actualizacion=NOW() WHERE id_progreso=?", [nuevoTiempo, nuevaMedalla, completado ? 1 : 0, cur.id_progreso]);
    res.json({ msg: "Progreso actualizado" });
});
exports.default = router;
