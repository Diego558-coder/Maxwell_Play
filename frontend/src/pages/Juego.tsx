import { useState } from "react";
import { useReglasDelJuego } from "../hooks/useReglasDelJuego";
import { registrarProgreso } from "../lib/api";

export default function Juego({ idJuego }: { idJuego: number }) {
  const { reglas, umbrales, cargando, error } = useReglasDelJuego(idJuego);
  const [tiempo, setTiempo] = useState(58);
  const [medalla, setMedalla] = useState<"ORO"|"PLATA"|"BRONCE"|"">("PLATA");
  const [msg, setMsg] = useState<string>("");

  const enviar = async () => {
    setMsg("");
    try {
  const { msg } = await registrarProgreso(idJuego, {
        tiempo_seg: Number(tiempo),
        completado: true,
        medalla: medalla || undefined
      });
      setMsg(msg);
    } catch (e) {
      const error = e as { response?: { data?: { msg?: string } } };
      setMsg(error?.response?.data?.msg || "Error guardando progreso");
    }
  };

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-bold">Juego #{idJuego} — Microondas</h1>

      {cargando && <div>Cargando reglas...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!cargando && !error && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Reglas (piezas requeridas)</h2>
            <ul className="list-disc pl-6 text-sm">
              {reglas.map(r => (
                <li key={r.tipo_pieza}>
                  <span className="font-mono">{r.tipo_pieza}</span>: {r.minimo}–{r.maximo}
                </li>
              ))}
            </ul>
            <h2 className="font-semibold mt-4 mb-2">Umbrales (segundos)</h2>
            {umbrales ? (
              <ul className="text-sm">
                <li>Oro ≤ {umbrales.oro_seg}</li>
                <li>Plata ≤ {umbrales.plata_seg}</li>
                <li>Bronce ≤ {umbrales.bronce_seg}</li>
              </ul>
            ) : <div className="text-sm text-gray-500">Sin umbrales</div>}
          </div>

          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Simular envío de progreso</h2>
            <div className="space-y-2">
              <label className="block text-sm">Tiempo (seg)</label>
              <input type="number" className="border rounded-lg px-3 py-2 w-full"
                     value={tiempo} onChange={e=>setTiempo(Number(e.target.value))} />
              <label className="block text-sm mt-2">Medalla</label>
              <select className="border rounded-lg px-3 py-2 w-full"
                      value={medalla} onChange={e=>setMedalla(e.target.value as "ORO" | "PLATA" | "BRONCE" | "")}>
                <option value="">(automática)</option>
                <option value="ORO">ORO</option>
                <option value="PLATA">PLATA</option>
                <option value="BRONCE">BRONCE</option>
              </select>
              <button onClick={enviar}
                      className="mt-3 bg-green-600 text-white rounded-lg px-4 py-2">
                Guardar progreso
              </button>
              {msg && <div className="text-sm mt-2">{msg}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}