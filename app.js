
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM CARGADO");

  const input = document.getElementById("file");
  const tree = document.getElementById("tree");
  const view = document.getElementById("view");

  console.log("Input:", input);

  if (!input) {
    console.error("❌ NO EXISTE el input con id='file'");
    return;
  }

  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;

    console.log("Archivo seleccionado:", file.name);

    tree.textContent = "Leyendo JAR...";

    try {
      const zip = await JSZip.loadAsync(file);
      const names = Object.keys(zip.files);

      console.log("Archivos en JAR:", names.length);

      tree.innerHTML = "";

      for (const name of names) {
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

    } catch (err) {
      console.error("ERROR leyendo JAR:", err);
      tree.textContent = "❌ Error leyendo JAR (ver consola)";
    }
  });
});

function mostrarStrings(bytes) {
  let out = "CLASS FILE\n\nStrings detectados:\n\n";
  let temp = "";

  for (const b of bytes) {
    if (b >= 32 && b <= 126) {
      temp += String.fromCharCode(b);
    } else {
      if (temp.length > 4) out += temp + "\n";
      temp = "";
    }
  }

  return out;
}
