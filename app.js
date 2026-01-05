const input = document.getElementById("file");
const tree = document.getElementById("tree");
const view = document.getElementById("view");

console.log("JS CARGADO OK");

input.addEventListener("change", async () => {
  const file = input.files[0];
  if (!file) return;

  console.log("Archivo seleccionado:", file.name, file.size);

  tree.innerHTML = "Leyendo JAR...";

  try {
    const zip = await JSZip.loadAsync(file);
    console.log("ZIP cargado:", Object.keys(zip.files).length, "archivos");

    tree.innerHTML = "";

    let count = 0;

    for (const name in zip.files) {
      count++;
      const entry = zip.files[name];

      const div = document.createElement("div");
      div.textContent = entry.dir ? "📁 " + name : "📄 " + name;

      if (!entry.dir) {
        div.style.cursor = "pointer";
        div.onclick = async () => {
          const data = await entry.async("uint8array");

          if (name.endsWith(".class")) {
            view.textContent = mostrarStrings(data);
          } else {
            view.textContent = new TextDecoder().decode(data);
          }
        };
      }

      tree.appendChild(div);
    }

    console.log("Renderizados:", count);

    if (count === 0) {
      tree.innerHTML = "⚠️ El JAR no contiene archivos visibles";
    }

  } catch (e) {
    console.error("ERROR leyendo JAR:", e);
    tree.innerHTML = "❌ Error leyendo el JAR (mirá la consola)";
  }
});

function mostrarStrings(bytes) {
  let out = "CLASS FILE\n\nStrings detectados:\n\n";
  let s = "";

  for (const b of bytes) {
    if (b >= 32 && b <= 126) {
      s += String.fromCharCode(b);
    } else {
      if (s.length > 4) out += s + "\n";
      s = "";
    }
  }
  return out;
}
