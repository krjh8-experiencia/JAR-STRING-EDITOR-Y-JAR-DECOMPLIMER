let zip;
let files = {};

const tree = document.getElementById("tree");
const editor = document.getElementById("editor");
const title = document.getElementById("title");

document.getElementById("jarInput").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;

  // 🔴 PASO CLAVE: leer como ArrayBuffer
  const buffer = await file.arrayBuffer();
  zip = await JSZip.loadAsync(buffer);

  files = {};
  tree.innerHTML = "Cargando archivos...";

  // 🔴 PASO CLAVE: esperar TODOS los archivos
  const entries = Object.entries(zip.files);

  for (const [path, entry] of entries) {
    if (!entry.dir) {
      files[path] = await entry.async("uint8array");
    }
  }

  console.log("Archivos cargados:", Object.keys(files));

  if (Object.keys(files).length === 0) {
    tree.innerHTML = "❌ El JAR no contiene archivos";
    return;
  }

  buildTree();
});

function buildTree() {
  const root = {};

  Object.keys(files).forEach(path => {
    let cur = root;
    path.split("/").forEach(part => {
      if (!cur[part]) cur[part] = {};
      cur = cur[part];
    });
  });

  tree.innerHTML = "";
  renderNode(root, tree, "");
}

function renderNode(node, parent, base) {
  for (const key in node) {
    const path = base ? base + "/" + key : key;
    const div = document.createElement("div");

    if (Object.keys(node[key]).length > 0) {
      div.textContent = "📁 " + key;
      div.className = "folder";

      const children = document.createElement("div");
      children.style.paddingLeft = "15px";
      children.style.display = "none";

      div.onclick = () => {
        children.style.display =
          children.style.display === "none" ? "block" : "none";
      };

      parent.appendChild(div);
      parent.appendChild(children);

      renderNode(node[key], children, path);
    } else {
      div.textContent = "📄 " + key;
      div.className = "file";
      div.onclick = () => openFile(path);
      parent.appendChild(div);
    }
  }
}

function openFile(path) {
  title.textContent = path;

  if (path.endsWith(".class")) {
    editor.value = "Archivo .class cargado correctamente\n\nTamaño: " + files[path].length + " bytes";
  } else {
    editor.value = new TextDecoder().decode(files[path]);
  }
}
