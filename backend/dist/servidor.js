"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aplicacion_1 = __importDefault(require("./aplicacion"));
const PUERTO = Number(process.env.PORT || 3000);
aplicacion_1.default.listen(PUERTO, () => {
    console.log(`API MaxwellPlay escuchando en http://localhost:${PUERTO}`);
});
