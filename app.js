let zip;

const readableExt = [
  ".java",
  ".class",
  ".yml",
  ".yaml",
  ".json",
  ".txt",
  ".properties"
];

/* BLOQUEOS DUROS */
document.addEventListener("contextmenu", e => e.preventDefault());
document.addEventListener("copy", e => e.preventDefault());
document.addEventListener("cut", e => e.preventDefault());
document.addEventListener("paste", e => e.preventDefault());
document.addEventListener("dragstart", e => e.preventDefault());

document.addEventListener("keydown", e => {
  if (e.ctrlKey) e.preventDefault();
});

/* CARGA DEL JAR */
document.getElementById("jarInput").addEventListener("change", async e => {
  zip = await JSZip.loadAsync(e.target.files[0]);
  renderTree();
});

/* CONSTRUIR ÁRBOL */
function renderTree() {
  const tree = document.getElementById("tree");
  tree.innerHTML = "";

  const root = {};

  Object.keys(zip.files).forEach(path => {
    const parts = path.split("/");
    let node = root;
    parts.forEach(p => {
      if (!node[p]) node[p] = {};
      node = node[p];
    });
  });

  function draw(node, parent, base = "") {
    for (const name in node) {
      const full = base + name;

      if (Object.keys(node[name]).length) {
        const folder = document.createElement("div");
        folder.textContent = "📁 " + name;
        folder.className = "folder";

        const sub = document.createElement("div");
        sub.style.display = "none";

        folder.onclick = () => {
          sub.style.display = sub.style.display === "none" ? "block" : "none";
        };

        parent.appendChild(folder);
        parent.appendChild(sub);
        draw(node[name], sub, full + "/");
      } else {
        const ext = "." + name.split(".").pop();
        const file = document.createElement("div");
        file.textContent = "📄 " + name;
        file.className = "file";

        if (readableExt.includes(ext)) {
          file.onclick = () => openFile(full);
        } else {
          file.classList.add("disabled");
        }

        parent.appendChild(file);
      }
    }
  }

  draw(root, tree);
}

/* ABRIR ARCHIVOS (SOLO LECTURA) */
async function openFile(path) {
  const editor = document.getElementById("editor");
  const ext = "." + path.split(".").pop();

  if (ext === ".class") {
    const bytes = await zip.files[path].async("uint8array");
    editor.value = classToReadable(bytes);
  } else {
    editor.value = await zip.files[path].async("string");
  }
}

/* CLASS → TEXTO LEGIBLE (INSPECCIÓN) */
function classToReadable(bytes) {
  let out = "☕ Java .class (read-only view)\n\n";
  for (let i = 0; i < bytes.length; i += 16) {
    out += Array.from(bytes.slice(i, i + 16))
      .map(b => b.toString(16).padStart(2, "0"))
      .join(" ") + "\n";
  }
  return out;
}

/* STRING VIEWER */
document.getElementById("searchBtn").onclick = async () => {
  const search = document.getElementById("searchStr").value;
  const res = document.getElementById("stringResults");
  res.innerHTML = "";

  for (const name in zip.files) {
    if (zip.files[name].dir) continue;

    const ext = "." + name.split(".").pop();
    if (!readableExt.includes(ext) || ext === ".class") continue;

    const content = await zip.files[name].async("string");
    if (!search || content.includes(search)) {
      const div = document.createElement("div");
      div.textContent = name;
      res.appendChild(div);
    }
  }
};
