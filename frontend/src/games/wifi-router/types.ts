
export type Placed = { ant: boolean; pow: boolean; pcb: boolean };

export type GameState = {
  placed: Placed;
  running: boolean;
  bandGHz: 2.4 | 5;
  connected: number; 
};

export type ModalState = { open: boolean; title: string; html: string };

export type DragCtx = {
  id: string;
  offsetX: number;
  offsetY: number;
  clone?: HTMLDivElement;
  orig?: HTMLElement;
} | null;
