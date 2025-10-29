// Utilitarios de UI/DOM sin estado de React
export function aplicarClasePolo(elemento: HTMLElement, polo: string) {
  elemento.textContent = polo;
  elemento.classList.toggle("n", polo === "N");
  elemento.classList.toggle("s", polo === "S");
}

export function invertirVagonDom(elementoVagon: HTMLElement) {
  const poloIzquierdo = elementoVagon.dataset.izquierda!;
  const poloDerecho = elementoVagon.dataset.derecha!;
  elementoVagon.dataset.izquierda = poloDerecho;
  elementoVagon.dataset.derecha = poloIzquierdo;
  const polos = elementoVagon.querySelectorAll<HTMLElement>(".pole");
  aplicarClasePolo(polos[0], elementoVagon.dataset.izquierda!);
  aplicarClasePolo(polos[1], elementoVagon.dataset.derecha!);
}

export function obtenerCentro(elemento: HTMLElement) {
  const rect = elemento.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function establecerEstiloArrastreRanura(
  ranura: HTMLElement,
  estilo: "drag-ok" | "drag-bad" | null
) {
  ranura.classList.remove("drag-ok", "drag-bad");
  if (estilo) ranura.classList.add(estilo);
}

export function mostrarAvisoFlotante(contenedor: HTMLElement, html: string, duracionMs = 2200) {
  contenedor.innerHTML = html;
  contenedor.style.display = "block";
  type FuncionAviso = typeof mostrarAvisoFlotante & { temporizador?: ReturnType<typeof setTimeout> };
  clearTimeout((mostrarAvisoFlotante as FuncionAviso).temporizador);
  (mostrarAvisoFlotante as FuncionAviso).temporizador = setTimeout(
    () => (contenedor.style.display = "none"),
    duracionMs,
  );
}
