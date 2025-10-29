"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.poolConexiones = void 0;
exports.consultar = consultar;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const hostBD = process.env.DB_HOST || "localhost";
const puertoBD = parseInt(process.env.DB_PORT || "3306", 10);
const usuarioBD = process.env.DB_USER || "root";
const contraseniaBD = process.env.DB_PASSWORD || "";
const nombreBD = process.env.DB_NAME || "database";
exports.poolConexiones = promise_1.default.createPool({
    host: hostBD,
    port: puertoBD,
    user: usuarioBD,
    password: contraseniaBD,
    database: nombreBD,
    waitForConnections: true,
    connectionLimit: 10,
    charset: "utf8mb4"
});
async function consultar(sql, params) {
    const [filas] = await exports.poolConexiones.query(sql, params);
    return filas;
}
