document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM CARGADO");

  const fileInput = document.getElementById("fileInput");
  const tree = document.getElementById("tree");
  const editor = document.getElementById("editor");
  const downloadBtn = document.getElementById("downloadBtn");

  if (!fileInput) {
    console.error("❌ NO EXISTE el input con id='fileInput'");
    return;
  }

  console.log("✅ Input encontrado");

  let zip = null;
  let currentPath = null;

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    console.log("📦 Archivo cargado:", file.name);

    zip = await JSZip.loadAsync(file);
    tree.innerHTML = "";
    editor.value = "";
    currentPath = null;

    Object.keys(zip.files).forEach(path => {
      const div = document.createElement("div");
      div.className = "file";
      div.textContent = path;

      div.onclick = async () => {
        const entry = zip.files[path];
        currentPath = path;

        if (entry.dir) {
          editor.value = "// Carpeta";
          editor.disabled = true;
          return;
        }

        if (path.endsWith(".class")) {
          const data = await entry.async("uint8array");
          editor.value =
            "Archivo .class\n" +
            "Tamaño: " + data.length + " bytes\n\n" +
            "HEX (primeros bytes):\n" +
            Array.from(data)
              .slice(0, 400)
              .map(b => b.toString(16).padStart(2, "0"))
              .join(" ");
          editor.disabled = true;
          return;
        }

        const text = await entry.async("string");
        editor.value = text;
        editor.disabled = false;
      };

      tree.appendChild(div);
    });

    console.log("🌳 Árbol generado");
  });

  downloadBtn.addEventListener("click", async () => {
    if (!zip) return alert("No hay archivo cargado");

    if (currentPath && !currentPath.endsWith(".class")) {
      zip.file(currentPath, editor.value);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "plugin_modificado.jar";
    a.click();
  });
});
