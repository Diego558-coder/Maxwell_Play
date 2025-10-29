"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bd_1 = require("../bd");
const rutasAutenticacion = (0, express_1.Router)();
/**
 * Maneja el inicio de sesión tradicional de estudiantes y docentes.
 */
async function manejarInicioSesion(req, res) {
    const { correo, contrasenia } = req.body || {};
    if (!correo || !contrasenia) {
        return res.status(400).json({ msg: "correo y contrasenia son requeridos" });
    }
    const [filas] = await bd_1.poolConexiones.query("SELECT id_usuario, nombre, correo, rol FROM Usuario WHERE correo=? AND contrasenia=MD5(?) AND activo=1 LIMIT 1", [correo, contrasenia]);
    const usuarios = filas;
    if (usuarios.length === 0) {
        return res.status(401).json({ msg: "Credenciales inválidas" });
    }
    const usuario = usuarios[0];
    const token = jsonwebtoken_1.default.sign({ id_usuario: usuario.id_usuario, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: "8h" });
    await bd_1.poolConexiones.query("INSERT INTO Sesion (id_usuario, inicio, expira, token) VALUES (?, NOW(), DATE_ADD(NOW(), INTERVAL 8 HOUR), ?)", [usuario.id_usuario, token]);
    return res.json({ token, usuario });
}
/**
 * Maneja el registro de nuevos usuarios.
 */
async function manejarRegistro(req, res) {
    const { nombre, correo, contrasenia } = req.body || {};
    if (!nombre || !correo || !contrasenia) {
        return res.status(400).json({ msg: "nombre, correo y contrasenia son requeridos" });
    }
    try {
        // Verificar si el correo ya está registrado
        const [usuariosExistentes] = await bd_1.poolConexiones.query("SELECT id_usuario FROM Usuario WHERE correo = ? LIMIT 1", [correo]);
        if (usuariosExistentes.length > 0) {
            return res.status(409).json({ msg: "El correo ya está registrado" });
        }
        // Insertar el nuevo usuario
        const [resultado] = await bd_1.poolConexiones.query("INSERT INTO Usuario (nombre, correo, contrasenia, rol, activo) VALUES (?, ?, MD5(?), 'ESTUDIANTE', 1)", [nombre, correo, contrasenia]);
        const id_usuario = resultado.insertId;
        // Crear ficha del estudiante (código ALU-####)
        const codigo = `ALU-${String(id_usuario).padStart(4, "0")}`;
        await bd_1.poolConexiones.query("INSERT INTO Estudiante (id_estudiante, codigo, grado) VALUES (?, ?, NULL)", [id_usuario, codigo]);
        // Asignar automáticamente al primer docente activo disponible
        const [docentes] = await bd_1.poolConexiones.query("SELECT d.id_docente FROM Docente d JOIN Usuario u ON u.id_usuario = d.id_docente WHERE u.activo = 1 ORDER BY d.id_docente ASC LIMIT 1");
        const docente = docentes[0];
        if (docente?.id_docente) {
            await bd_1.poolConexiones.query("INSERT INTO Asignacion (id_docente, id_estudiante, fecha, activo) VALUES (?, ?, CURDATE(), 1)", [docente.id_docente, id_usuario]);
        }
        // Generar token JWT
        const token = jsonwebtoken_1.default.sign({ id_usuario, nombre, correo, rol: "ESTUDIANTE" }, process.env.JWT_SECRET, { expiresIn: "8h" });
        // Registrar la sesión
        await bd_1.poolConexiones.query("INSERT INTO Sesion (id_usuario, inicio, expira, token) VALUES (?, NOW(), DATE_ADD(NOW(), INTERVAL 8 HOUR), ?)", [id_usuario, token]);
        return res.status(201).json({ token, usuario: { id_usuario, nombre, correo, rol: "ESTUDIANTE" } });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ msg: "Error interno del servidor" });
    }
}
rutasAutenticacion.post("/inicio-sesion", manejarInicioSesion);
rutasAutenticacion.post("/login", manejarInicioSesion); // alias para compatibilidad
rutasAutenticacion.post("/registro", manejarRegistro);
exports.default = rutasAutenticacion;
