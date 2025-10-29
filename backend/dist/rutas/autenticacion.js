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
rutasAutenticacion.post("/inicio-sesion", manejarInicioSesion);
rutasAutenticacion.post("/login", manejarInicioSesion); // alias para compatibilidad
exports.default = rutasAutenticacion;
