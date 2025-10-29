import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface DatosAutenticacion {
  id_usuario: number;
  rol: "DOCENTE" | "ESTUDIANTE";
  nombre: string;
  correo: string;
}

export function requerirAutenticacion(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ msg: "Falta token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as DatosAutenticacion;
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ msg: "Token inválido" });
  }
}
