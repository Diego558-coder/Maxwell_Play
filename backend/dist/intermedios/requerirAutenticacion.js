"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requerirAutenticacion = requerirAutenticacion;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function requerirAutenticacion(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;
        if (!token)
            return res.status(401).json({ msg: "Falta token" });
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    }
    catch {
        return res.status(401).json({ msg: "Token inválido" });
    }
}
