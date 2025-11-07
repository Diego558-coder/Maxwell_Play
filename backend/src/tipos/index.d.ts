import type { DatosAutenticacion } from "../intermedios/requireAuth";

declare global {
  namespace Express {
    interface Request {
      user?: DatosAutenticacion;
    }
  }
}

export {};
