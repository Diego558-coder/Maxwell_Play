import app from "./app";
const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`API MaxwellPlay escuchando en http://localhost:${PORT}`);
});
