import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./rutas/auth";
import rutasJuegos from "./rutas/juegos";
import teacherRoutes from "./rutas/teacher";

dotenv.config();

const aplicacion = express();
aplicacion.use(cors());
aplicacion.use(express.json());

aplicacion.get("/", (_req, res) => res.json({ ok: true, nombre: "MaxwellPlay API" }));

aplicacion.use("/auth", authRoutes);
aplicacion.use("/juegos", rutasJuegos);
aplicacion.use("/api/docentes", teacherRoutes);

export default aplicacion;
