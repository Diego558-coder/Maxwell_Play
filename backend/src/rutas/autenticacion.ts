import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { poolConexiones } from "../bd";

const rutasAutenticacion = Router();

/**
 * Maneja el inicio de sesión tradicional de estudiantes y docentes.
 */
async function manejarInicioSesion(req: Request, res: Response) {
  const { correo, contrasenia } = req.body || {};
  if (!correo || !contrasenia) {
    return res.status(400).json({ msg: "correo y contrasenia son requeridos" });
  }

  const [filas] = await poolConexiones.query(
    "SELECT id_usuario, nombre, correo, rol FROM Usuario WHERE correo=? AND contrasenia=MD5(?) AND activo=1 LIMIT 1",
    [correo, contrasenia]
  );
  const usuarios = filas as Array<{ id_usuario: number; nombre: string; correo: string; rol: "DOCENTE" | "ESTUDIANTE" }>;
  if (usuarios.length === 0) {
    return res.status(401).json({ msg: "Credenciales inválidas" });
  }

  const usuario = usuarios[0];
  const token = jwt.sign(
    { id_usuario: usuario.id_usuario, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
    process.env.JWT_SECRET as string,
    { expiresIn: "8h" }
  );

  await poolConexiones.query(
    "INSERT INTO Sesion (id_usuario, inicio, expira, token) VALUES (?, NOW(), DATE_ADD(NOW(), INTERVAL 8 HOUR), ?)",
    [usuario.id_usuario, token]
  );

  return res.json({ token, usuario });
}

rutasAutenticacion.post("/inicio-sesion", manejarInicioSesion);
rutasAutenticacion.post("/login", manejarInicioSesion); // alias para compatibilidad

export default rutasAutenticacion;
