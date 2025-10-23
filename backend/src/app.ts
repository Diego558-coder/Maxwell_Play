import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import juegosRoutes from "./routes/juegos";
import teacherRoutes from "./routes/teacher";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.json({ ok: true, name: "MaxwellPlay API" }));

app.use("/auth", authRoutes);
app.use("/juegos", juegosRoutes);
app.use("/api/teacher", teacherRoutes);

export default app;
