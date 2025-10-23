// viewBox base 900x520. Ajusta aquí si cambian tus PNG o quieres mover piezas.

// dónde se dibuja el PNG del marco
export const FRAME = {
  x: 84,
  y: 153,
  w: 650,
  h: 420,
  axleFront: { x: 260, y: 375 },
  axleRear:  { x: 465, y: 375 },
};

// tamaño lógico para centrar la rueda PNG
export const WHEEL_R = 60;

// dínamo: offsets relativos al centro del grupo (0,0)
export const DYN = {
  w: 110,
  h: 70,
  roller: { x: 48, y: 0 },     // rodillo a la derecha
  plus:   { x: -28, y: -30 },
  minus:  { x:  28, y: -30 },
};

// punto de contacto con la rueda trasera (izquierda)
export const REAR_CONTACT = { x: -WHEEL_R - 10, y: 0 };

// tolerancia del “snap” al soltar
export const SNAP = 16;

// posiciones iniciales (puedes mover solo aquí)
export const START = {
  wheelFront: { x: 640, y: 330 },
  wheelRear:  { x: 160, y: 430 },
  dynamo:     { x: 110, y: 320 },
};
