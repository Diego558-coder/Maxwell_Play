import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rutasAutenticacion from "./rutas/autenticacion";
import rutasJuegos from "./rutas/juegos";
import rutasDocentes from "./rutas/docentes";

dotenv.config();

const aplicacion = express();
aplicacion.use(cors());
aplicacion.use(express.json());

aplicacion.get("/", (_req, res) => res.json({ ok: true, nombre: "MaxwellPlay API" }));

aplicacion.use("/auth", rutasAutenticacion);
aplicacion.use("/juegos", rutasJuegos);
aplicacion.use("/api/docentes", rutasDocentes);

export default aplicacion;
