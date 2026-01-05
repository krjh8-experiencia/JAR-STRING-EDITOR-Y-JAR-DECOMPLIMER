const paths = Object.keys(zip.files).sort((a, b) => {
  const aYml = a.endsWith(".yml") || a.endsWith(".yaml");
  const bYml = b.endsWith(".yml") || b.endsWith(".yaml");

  if (aYml && !bYml) return 1;
  if (!aYml && bYml) return -1;
  return a.localeCompare(b);
});

paths.forEach(path => {
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

    // ---- .CLASS MEJORADO ----
    if (path.endsWith(".class")) {
      const data = await entry.async("uint8array");

      const magic = data.slice(0, 4)
        .map(b => b.toString(16).padStart(2, "0"))
        .join(" ");

      const major = (data[6] << 8) | data[7];

      // detectar strings ASCII
      let ascii = "";
      for (let b of data) {
        if (b >= 32 && b <= 126) ascii += String.fromCharCode(b);
        else ascii += " ";
      }

      editor.value =
`Archivo .class (SOLO LECTURA)

Magic: ${magic.toUpperCase()}  (${magic === "ca fe ba be" ? "OK" : "?"})
Versión Java (major): ${major}
Tamaño: ${data.length} bytes

Strings detectadas:
${ascii.match(/[a-zA-Z0-9_./$]{4,}/g)?.slice(0, 40).join("\n") || "Ninguna"}

HEX (primeros bytes):
${Array.from(data)
  .slice(0, 300)
  .map(b => b.toString(16).padStart(2, "0"))
  .join(" ")}
`;
      editor.disabled = true;
      return;
    }

    // ---- TEXTO EDITABLE ----
    const text = await entry.async("string");
    editor.value = text;
    editor.disabled = false;
  };

  tree.appendChild(div);
});
