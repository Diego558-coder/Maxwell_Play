import type { DatosAutenticacion } from "../intermedios/requerirAutenticacion";

declare global {
  namespace Express {
    interface Request {
      user?: DatosAutenticacion;
    }
  }
}

export {};
