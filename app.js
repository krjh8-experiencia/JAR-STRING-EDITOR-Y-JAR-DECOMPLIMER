let zip;
let files = {};
let currentClass = null;
let currentPath = null;

const tree = document.getElementById("tree");
const editor = document.getElementById("editor");
const title = document.getElementById("title");

document.getElementById("jarInput").addEventListener("change", async e => {
  zip = await JSZip.loadAsync(e.target.files[0]);
  files = {};
  tree.innerHTML = "";

  for (const p in zip.files) {
    if (!zip.files[p].dir) {
      files[p] = await zip.files[p].async("uint8array");
    }
  }

  buildTree();
});

function buildTree() {
  const root = {};

  Object.keys(files).forEach(path => {
    let cur = root;
    path.split("/").forEach(part => {
      cur[part] ??= {};
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

    if (Object.keys(node[key]).length) {
      div.textContent = "📁 " + key;
      div.className = "folder";

      const children = document.createElement("div");
      children.className = "hidden";
      children.style.paddingLeft = "15px";

      div.onclick = () => children.classList.toggle("hidden");

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
  currentPath = path;
  title.textContent = path;

  if (path.endsWith(".class")) {
    const reader = new JavaClassTools.JavaClassFileReader();
    currentClass = reader.read(files[path].buffer);

    const lines = [];
    currentClass.constant_pool.forEach((c, i) => {
      if (c?.tag === 1) {
        lines.push(i + "|" + c.bytes);
      }
    });

    editor.value = lines.join("\n");
  } else {
    editor.value = new TextDecoder().decode(files[path]);
    currentClass = null;
  }
}

document.getElementById("save").onclick = () => {
  if (currentClass) {
    editor.value.split("\n").forEach(line => {
      const [i, val] = line.split("|");
      const idx = parseInt(i);
      if (!isNaN(idx) && currentClass.constant_pool[idx]) {
        currentClass.constant_pool[idx].bytes = val;
      }
    });

    const writer = new JavaClassTools.JavaClassFileWriter();
    files[currentPath] = new Uint8Array(writer.write(currentClass));
    alert("✔ .class parcheado");
  } else {
    files[currentPath] = new TextEncoder().encode(editor.value);
    alert("✔ archivo guardado");
  }
};

document.getElementById("patchAll").onclick = () => {
  const find = prompt("Buscar string");
  const replace = prompt("Reemplazar por");

  if (!find) return;

  Object.keys(files).forEach(p => {
    if (!p.endsWith(".class")) return;

    const reader = new JavaClassTools.JavaClassFileReader();
    const cls = reader.read(files[p].buffer);

    cls.constant_pool.forEach(c => {
      if (c?.tag === 1 && c.bytes.includes(find)) {
        c.bytes = c.bytes.replaceAll(find, replace);
      }
    });

    const writer = new JavaClassTools.JavaClassFileWriter();
    files[p] = new Uint8Array(writer.write(cls));
  });

  alert("✔ parche global aplicado");
};

document.getElementById("download").onclick = async () => {
  const out = new JSZip();
  for (const p in files) out.file(p, files[p]);

  const blob = await out.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "plugin_modificado.jar";
  a.click();
};
