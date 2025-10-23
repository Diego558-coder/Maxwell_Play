import { Router } from "express";
import { pool } from "../db";
import jwt from "jsonwebtoken";

const router = Router();

/**
 * POST /auth/login
 * body: { correo: string, contrasenia: string }
 * Nota: en el seed usamos MD5 para simplicidad con MySQL 5.5.
 * En producción migraremos a bcrypt.
 */
router.post("/login", async (req, res) => {
  const { correo, contrasenia } = req.body || {};
  if (!correo || !contrasenia) {
    return res.status(400).json({ msg: "correo y contrasenia son requeridos" });
  }

  const [rows] = await pool.query(
    "SELECT id_usuario, nombre, correo, rol FROM Usuario WHERE correo=? AND contrasenia=MD5(?) AND activo=1 LIMIT 1",
    [correo, contrasenia]
  );
  const users = rows as any[];
  if (users.length === 0) return res.status(401).json({ msg: "Credenciales inválidas" });

  const u = users[0];
  const token = jwt.sign(
    { id_usuario: u.id_usuario, nombre: u.nombre, correo: u.correo, rol: u.rol },
    process.env.JWT_SECRET as string,
    { expiresIn: "8h" }
  );

  // Registrar sesión (opcional)
  await pool.query(
    "INSERT INTO Sesion (id_usuario, inicio, expira, token) VALUES (?, NOW(), DATE_ADD(NOW(), INTERVAL 8 HOUR), ?)",
    [u.id_usuario, token]
  );

  res.json({ token, usuario: u });
});

export default router;
