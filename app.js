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

  // Convertir paths planos a árbol jerárquico
  function makeTreeFromZip(zip) {
    const root = {};
    Object.keys(zip.files).forEach(path => {
      const parts = path.split("/");
      let node = root;
      parts.forEach((part, idx) => {
        if (!part) return; // saltar vacíos
        if (!node[part]) {
          node[part] = {
            _children: {},
            _fullPath: parts.slice(0, idx + 1).join("/"),
            _isDir: idx < parts.length - 1
          };
        }
        node = node[part]._children;
      });
    });
    return root;
  }

  // Renderizar árbol recursivamente
  function renderTree(node, parentEl) {
    Object.keys(node).forEach(key => {
      if (["_children", "_fullPath", "_isDir"].includes(key)) return;
      const data = node[key];

      const div = document.createElement("div");
      div.style.paddingLeft = "10px";
      div.dataset.expanded = false;

      if (data._isDir) {
        div.textContent = "📁 " + key;
        div.className = "folder";

        const childrenContainer = document.createElement("div");
        childrenContainer.style.display = "none";
        childrenContainer.style.paddingLeft = "15px";

        div.onclick = () => {
          const expanded = childrenContainer.style.display === "block";
          childrenContainer.style.display = expanded ? "none" : "block";
        };

        parentEl.appendChild(div);
        parentEl.appendChild(childrenContainer);

        renderTree(data._children, childrenContainer);
      } else {
        div.textContent = "📄 " + key;
        div.className = "file";
        if (key.endsWith(".class")) div.style.fontSize = "12px";

        div.onclick = async () => {
          currentPath = data._fullPath;
          const entry = zip.files[currentPath];
          if (!entry) return;

          if (key.endsWith(".class")) {
            const dataArr = await entry.async("uint8array");
            let strings = [];
            let cur = "";
            for (let b of dataArr) {
              if (b >= 32 && b <= 126) cur += String.fromCharCode(b);
              else {
                if (cur.length >= 4) strings.push(cur);
                cur = "";
              }
            }
            if (cur.length >= 4) strings.push(cur);
            editor.value =
`// Decompiled (.class) — READ ONLY

Strings detectadas (primeros 50):
${strings.slice(0, 50).join("\n")}
`;
            editor.disabled = false;
          } else {
            const text = await entry.async("string");
            editor.value = text;
            editor.disabled = false;
          }
        };
        parentEl.appendChild(div);
      }
    });
  }

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    console.log("📦 Archivo cargado:", file.name);

    zip = await JSZip.loadAsync(file);
    tree.innerHTML = "";
    editor.value = "";
    currentPath = null;

    // Ordenar: todo menos .yml primero
    const paths = Object.keys(zip.files).sort((a, b) => {
      const aYml = a.endsWith(".yml") || a.endsWith(".yaml");
      const bYml = b.endsWith(".yml") || b.endsWith(".yaml");
      if (aYml && !bYml) return 1;
      if (!aYml && bYml) return -1;
      return a.localeCompare(b);
    });

    const treeData = makeTreeFromZip(zip);
    renderTree(treeData, tree);

    console.log("🌳 Árbol jerárquico generado con iconos");
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
