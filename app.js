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

    // ---------------------------
    // Orden: todo menos .yml / .yaml primero, luego yml
    const paths = Object.keys(zip.files).sort((a,b)=>{
      const aYml = a.endsWith(".yml") || a.endsWith(".yaml");
      const bYml = b.endsWith(".yml") || b.endsWith(".yaml");
      if(aYml && !bYml) return 1;
      if(!aYml && bYml) return -1;
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

        // ------------------- .class pseudo decompiled
        if (path.endsWith(".class")) {
          const data = await entry.async("uint8array");

          // Extraer strings legibles
          let strings = [];
          let cur = "";
          for (let b of data) {
            if (b >= 32 && b <= 126) cur += String.fromCharCode(b);
            else {
              if(cur.length>=4) strings.push(cur);
              cur="";
            }
          }
          if(cur.length>=4) strings.push(cur);

          const readU16 = i => (data[i]<<8)|data[i+1];
          const major = readU16(6);

          const className = strings.find(s => s.includes("/") && !s.includes("(")) || "UnknownClass";
          const methods = strings.filter(s =>
            /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(s) &&
            !["Code","LineNumberTable","SourceFile"].includes(s)
          );

          editor.value =
`// Decompiled (.class) — READ ONLY

Java version (major): ${major}

Class:
${className.replace(/\//g, ".")}

Methods detected:
${[...new Set(methods)].slice(0,30).map(m=>"  - "+m).join("\n")}

Strings:
${strings.slice(0,50).join("\n")}
`;

          editor.disabled = true;
          return;
        }

        // ------------------- editable
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
