"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bd_1 = require("../bd");
const requerirAutenticacion_1 = require("../intermedios/requerirAutenticacion");
const rutasJuegos = (0, express_1.Router)();
/**
 * GET /juegos/:id/reglas
 * Lee Reglas y Umbrales para que el front valide el minijuego.
 */
rutasJuegos.get("/:id/reglas", requerirAutenticacion_1.requerirAutenticacion, async (req, res) => {
    const id = Number(req.params.id);
    if (!id)
        return res.status(400).json({ msg: "id inválido" });
    const [reglas] = await bd_1.poolConexiones.query("SELECT tipo_pieza, minimo, maximo FROM ReglaPieza WHERE id_juego=?", [id]);
    const [umb] = await bd_1.poolConexiones.query("SELECT oro_seg, plata_seg, bronce_seg FROM UmbralesJuego WHERE id_juego=? LIMIT 1", [id]);
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
rutasJuegos.post("/:id/progreso", requerirAutenticacion_1.requerirAutenticacion, async (req, res) => {
    const id_juego = Number(req.params.id);
    const { tiempo_seg, medalla, completado } = req.body || {};
    const user = req.user;
    if (!user || user.rol !== "ESTUDIANTE") {
        return res.status(403).json({ msg: "Solo los estudiantes pueden registrar progreso" });
    }
    if (!id_juego || typeof tiempo_seg !== "number") {
        return res.status(400).json({ msg: "Datos inválidos" });
    }
    const tiempo = Math.max(0, Math.round(tiempo_seg));
    const exito = completado ? 1 : 0;
    const now = new Date();
    const inicio = new Date(now.getTime() - tiempo * 1000);
    // Asegurar que exista el registro en Estudiante (por bases legacy sin seed actualizado)
    const codigo = `ALU-${String(user.id_usuario).padStart(4, "0")}`;
    await bd_1.poolConexiones.query("INSERT IGNORE INTO Estudiante (id_estudiante, codigo, grado) VALUES (?, ?, '7°')", [user.id_usuario, codigo]);
    // Leer progreso actual
    const [rows] = await bd_1.poolConexiones.query("SELECT id_progreso, mejor_tiempo, mejor_medalla FROM Progreso WHERE id_estudiante=? AND id_juego=? LIMIT 1", [user.id_usuario, id_juego]);
    const cur = rows[0];
    const mejorMedalla = (a, b) => {
        const orden = { "ORO": 3, "PLATA": 2, "BRONCE": 1, "": 0, "NULL": 0 };
        return (orden[a || ""] >= orden[b || ""]) ? a : b;
    };
    if (!cur) {
        await bd_1.poolConexiones.query("INSERT INTO Progreso (id_estudiante, id_juego, mejor_tiempo, mejor_medalla, completado, fec_ultima_actualizacion) VALUES (?, ?, ?, ?, ?, NOW())", [user.id_usuario, id_juego, tiempo, medalla || null, exito]);
        await bd_1.poolConexiones.query("INSERT INTO juego_sesiones (id_juego, id_estudiante, inicio_ts, fin_ts, tiempo_seg, exito) VALUES (?, ?, ?, ?, ?, ?)", [id_juego, user.id_usuario, inicio, now, tiempo, exito]);
        return res.json({ msg: "Progreso creado" });
    }
    let nuevoTiempo = cur.mejor_tiempo;
    let nuevaMedalla = cur.mejor_medalla;
    // Mejora por tiempo (menor es mejor)
    if (cur.mejor_tiempo == null || tiempo < cur.mejor_tiempo) {
        nuevoTiempo = tiempo;
    }
    // Mejora por medalla (ORO>PLATA>BRONCE)
    if (medalla) {
        nuevaMedalla = mejorMedalla(medalla, cur.mejor_medalla);
    }
    await bd_1.poolConexiones.query("UPDATE Progreso SET mejor_tiempo=?, mejor_medalla=?, completado=GREATEST(completado, ?), fec_ultima_actualizacion=NOW() WHERE id_progreso=?", [nuevoTiempo, nuevaMedalla, exito, cur.id_progreso]);
    await bd_1.poolConexiones.query("INSERT INTO juego_sesiones (id_juego, id_estudiante, inicio_ts, fin_ts, tiempo_seg, exito) VALUES (?, ?, ?, ?, ?, ?)", [id_juego, user.id_usuario, inicio, now, tiempo, exito]);
    res.json({ msg: "Progreso actualizado" });
});
rutasJuegos.delete("/progreso", requerirAutenticacion_1.requerirAutenticacion, async (req, res) => {
    const user = req.user;
    if (!user || user.rol !== "ESTUDIANTE") {
        return res.status(403).json({ msg: "Solo los estudiantes pueden reiniciar su progreso" });
    }
    await bd_1.poolConexiones.query("DELETE FROM juego_sesiones WHERE id_estudiante=?", [user.id_usuario]);
    await bd_1.poolConexiones.query("DELETE FROM Progreso WHERE id_estudiante=?", [user.id_usuario]);
    res.json({ msg: "Progreso reiniciado" });
});
exports.default = rutasJuegos;
