import { Router } from "express";
import { pool } from "../db";
import { requireAuth } from "../intermedios/requireAuth";

const rutasJuegos = Router();


rutasJuegos.get("/:id/reglas", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ msg: "id inválido" });

  const [reglas] = await pool.query(
    "SELECT tipo_pieza, minimo, maximo FROM ReglaPieza WHERE id_juego=?",
    [id]
  );

  const [umb] = await pool.query(
    "SELECT oro_seg, plata_seg, bronce_seg FROM UmbralesJuego WHERE id_juego=? LIMIT 1",
    [id]
  );

  res.json({
    reglas: reglas as any[],
    umbrales: (umb as any[])[0] || null
  });
});


rutasJuegos.post("/:id/progreso", requireAuth, async (req, res) => {
  const id_juego = Number(req.params.id);
  const { tiempo_seg, medalla, completado } = req.body || {};
  const user = (req as any).user;

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

  
  const codigo = `ALU-${String(user.id_usuario).padStart(4, "0")}`;
  await pool.query(
    "INSERT IGNORE INTO Estudiante (id_estudiante, codigo, grado) VALUES (?, ?, '7°')",
    [user.id_usuario, codigo]
  );

  const [rows] = await pool.query(
    "SELECT id_progreso, mejor_tiempo, mejor_medalla FROM Progreso WHERE id_estudiante=? AND id_juego=? LIMIT 1",
    [user.id_usuario, id_juego]
  );
  const cur = (rows as any[])[0];

  const mejorMedalla = (a?: string, b?: string) => {
    const orden = { "ORO": 3, "PLATA": 2, "BRONCE": 1, "": 0, "NULL": 0 } as any;
    return (orden[a || ""] >= orden[b || ""]) ? a : b;
  };

  if (!cur) {
  await pool.query(
      "INSERT INTO Progreso (id_estudiante, id_juego, mejor_tiempo, mejor_medalla, completado, fec_ultima_actualizacion) VALUES (?, ?, ?, ?, ?, NOW())",
      [user.id_usuario, id_juego, tiempo, medalla || null, exito]
    );
  await pool.query(
      "INSERT INTO juego_sesiones (id_juego, id_estudiante, inicio_ts, fin_ts, tiempo_seg, exito) VALUES (?, ?, ?, ?, ?, ?)",
      [id_juego, user.id_usuario, inicio, now, tiempo, exito]
    );
    return res.json({ msg: "Progreso creado" });
  }

  let nuevoTiempo = cur.mejor_tiempo;
  let nuevaMedalla = cur.mejor_medalla;

  if (cur.mejor_tiempo == null || tiempo < cur.mejor_tiempo) {
    nuevoTiempo = tiempo;
  }
  if (medalla) {
    nuevaMedalla = mejorMedalla(medalla, cur.mejor_medalla);
  }

  await pool.query(
    "UPDATE Progreso SET mejor_tiempo=?, mejor_medalla=?, completado=GREATEST(completado, ?), fec_ultima_actualizacion=NOW() WHERE id_progreso=?",
    [nuevoTiempo, nuevaMedalla, exito, cur.id_progreso]
  );

  await pool.query(
    "INSERT INTO juego_sesiones (id_juego, id_estudiante, inicio_ts, fin_ts, tiempo_seg, exito) VALUES (?, ?, ?, ?, ?, ?)",
    [id_juego, user.id_usuario, inicio, now, tiempo, exito]
  );

  res.json({ msg: "Progreso actualizado" });
});

rutasJuegos.delete("/progreso", requireAuth, async (req, res) => {
  const user = (req as any).user;

  if (!user || user.rol !== "ESTUDIANTE") {
    return res.status(403).json({ msg: "Solo los estudiantes pueden reiniciar su progreso" });
  }

  await pool.query("DELETE FROM juego_sesiones WHERE id_estudiante=?", [user.id_usuario]);
  await pool.query("DELETE FROM Progreso WHERE id_estudiante=?", [user.id_usuario]);

  res.json({ msg: "Progreso reiniciado" });
});

export default rutasJuegos;
