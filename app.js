console.log("JS CARGADO OK");

const fileInput = document.getElementById("fileInput");
const tree = document.getElementById("tree");
const editor = document.getElementById("editor");
const downloadBtn = document.getElementById("downloadBtn");

let zip = null;
let currentPath = null;

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

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

      // .class → hex / info
      if (path.endsWith(".class")) {
        const data = await entry.async("uint8array");
        editor.value =
          "Archivo .class\n" +
          "Tamaño: " + data.length + " bytes\n\n" +
          "HEX:\n" +
          Array.from(data)
            .slice(0, 500)
            .map(b => b.toString(16).padStart(2, "0"))
            .join(" ");
        editor.disabled = true;
        return;
      }

      // Texto editable
      const text = await entry.async("string");
      editor.value = text;
      editor.disabled = false;
    };

    tree.appendChild(div);
  });
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
