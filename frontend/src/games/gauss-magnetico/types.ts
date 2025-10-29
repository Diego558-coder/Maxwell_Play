export type EmisorOndas = { posicionX: number; posicionY: number; tono: number; clave: string };

export type DatosVagonDom = {
  poloIzquierdo: string;
  poloDerecho: string;
  elemento: HTMLElement;
};

export type ConfiguracionVagonesDom = (null | DatosVagonDom)[];

export {
  DepositoVagones,
  JuegoGaussMagnetico,
  Locomotora,
  Riel,
  Vagon,
} from "./modelos";
export type {
  ConfiguracionVagon,
  EstadoAcoples,
  Polo,
} from "./modelos";
