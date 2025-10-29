import aplicacion from "./aplicacion";

const PUERTO = Number(process.env.PORT || 3000);

aplicacion.listen(PUERTO, () => {
  console.log(`API MaxwellPlay escuchando en http://localhost:${PUERTO}`);
});
