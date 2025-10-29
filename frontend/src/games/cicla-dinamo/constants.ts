export const ID_JUEGO = 4;
export const CLAVE_JUEGO = "cicla-dinamo";

// viewBox base 900x520. Ajusta aquí si cambian tus PNG o quieres mover piezas.

// Dónde se dibuja el PNG del marco
export const MARCO = {
  x: 84,
  y: 153,
  ancho: 650,
  alto: 420,
  ejeDelantero: { x: 260, y: 375 },
  ejeTrasero:  { x: 465, y: 375 },
};

// Tamaño lógico para centrar la rueda PNG
export const RADIO_LLANTA = 60;

// Dínamo: offsets relativos al centro del grupo (0,0)
export const CONFIGURACION_DINAMO = {
  ancho: 110,
  alto: 70,
  rodillo: { x: 48, y: 0 },     // rodillo a la derecha
  positivo:   { x: -28, y: -30 },
  negativo:  { x:  28, y: -30 },
};

// Punto de contacto con la rueda trasera (izquierda)
export const PUNTO_CONTACTO_TRASERO = { x: -RADIO_LLANTA - 10, y: 0 };

// Tolerancia del “snap” al soltar
export const TOLERANCIA_ENCAJE = 16;

// Posiciones iniciales (puedes mover solo aquí)
export const POSICIONES_INICIALES = {
  ruedaDelantera: { x: 640, y: 330 },
  ruedaTrasera:  { x: 160, y: 430 },
  dinamo:     { x: 110, y: 320 },
};
