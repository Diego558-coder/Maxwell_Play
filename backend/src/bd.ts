import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const hostBD = process.env.DB_HOST || "localhost";
const puertoBD = parseInt(process.env.DB_PORT || "3306", 10);
const usuarioBD = process.env.DB_USER || "root";
const contraseniaBD = process.env.DB_PASSWORD || "";
const nombreBD = process.env.DB_NAME || "database";

export const poolConexiones = mysql.createPool({
  host: hostBD,
  port: puertoBD,
  user: usuarioBD,
  password: contraseniaBD,
  database: nombreBD,
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4"
});

export async function consultar<T = unknown>(sql: string, params?: any[]): Promise<T[]> {
  const [filas] = await poolConexiones.query(sql, params);
  return filas as T[];
}
