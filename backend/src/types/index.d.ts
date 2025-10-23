import type { AuthPayload } from "../middlewares/requireAuth";

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export {};
