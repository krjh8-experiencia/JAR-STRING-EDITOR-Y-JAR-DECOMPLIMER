document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM CARGADO");

  const fileInput = document.getElementById("fileInput");
  const tree = document.getElementById("tree");
  const editor = document.getElementById("editor");
  const downloadBtn = document.getElementById("downloadBtn");

  let zip = null;
  let currentPath = null;

  // Crear nodo del árbol
  function createNode(name, isDir) {
    const div = document.createElement("div");
    div.textContent = name;
    div.className = isDir ? "folder" : "file";
    if (!isDir && name.endsWith(".class")) div.style.fontSize = "12px";
    div.style.paddingLeft = "10px";
    div.dataset.expanded = false;
    return div;
  }

  // Construir árbol jerárquico recursivo
  function buildTree(paths) {
    const root = {};
    paths.forEach(p => {
      const parts = p.split("/");
      let node = root;
      parts.forEach((part, idx) => {
        if (!node[part]) node[part] = { _children: {}, _fullPath: parts.slice(0, idx+1).join("/"), _isDir: idx < parts.length-1 };
        node = node[part]._children;
      });
    });
    return root;
  }

  function renderTree(node, parentElement) {
    Object.keys(node).forEach(key => {
      if (key === "_children" || key === "_isDir" || key === "_fullPath") return;
      const data = node[key];
      const div = createNode(key, data._isDir);
      parentElement.appendChild(div);

      if (data._isDir) {
        const childrenContainer = document.createElement("div");
        childrenContainer.style.display = "none";
        childrenContainer.style.paddingLeft = "15px";
        parentElement.appendChild(childrenContainer);

        div.onclick = () => {
          const expanded = div.dataset.expanded === "true";
          childrenContainer.style.display = expanded ? "none" : "block";
          div.dataset.expanded = !expanded;
        };

        renderTree(data._children, childrenContainer);
      } else {
        div.onclick = async () => {
          currentPath = data._fullPath;
          const entry = zip.files[currentPath];
          if (!entry) return;

          if (currentPath.endsWith(".class")) {
            const dataArr = await entry.async("uint8array");
            let strings = [];
            let cur = "";
            for (let b of dataArr) {
              if (b >= 32 && b <= 126) cur += String.fromCharCode(b);
              else {
                if(cur.length>=4) strings.push(cur);
                cur="";
              }
            }
            if(cur.length>=4) strings.push(cur);
            editor.value =
`// Decompiled (.class) — READ ONLY

Strings detected (primeros 50):
${strings.slice(0,50).join("\n")}
`;
            editor.disabled = true;
          } else {
            const text = await entry.async("string");
            editor.value = text;
            editor.disabled = false;
          }
        };
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

    // Orden: todo menos .yml / .yaml primero, luego yml
    const paths = Object.keys(zip.files).sort((a,b)=>{
      const aYml = a.endsWith(".yml") || a.endsWith(".yaml");
      const bYml = b.endsWith(".yml") || b.endsWith(".yaml");
      if(aYml && !bYml) return 1;
      if(!aYml && bYml) return -1;
      return a.localeCompare(b);
    });

    const treeData = buildTree(paths);
    renderTree(treeData, tree);

    console.log("🌳 Árbol jerárquico generado");
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
