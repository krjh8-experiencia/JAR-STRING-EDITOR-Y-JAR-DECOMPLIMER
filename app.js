console.log("JS CARGADO OK");

document.getElementById("jarInput").addEventListener("change", e => {
  console.log("Archivo seleccionado:", e.target.files[0]);
});
