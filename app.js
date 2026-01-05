let zip;
let files = {};
let currentClass = null;
let currentPath = null;

const tree = document.getElementById("tree");
const editor = document.getElementById("editor");

document.getElementById("jar").onchange = async e => {
  zip = await JSZip.loadAsync(e.target.files[0]);
  files = {};
  tree.innerHTML = "";

  for (const p in zip.files) {
    if (!zip.files[p].dir) {
      files[p] = await zip.files[p].async("uint8array");
    }
  }
  buildTree();
};

function buildTree() {
  const root = {};
  Object.keys(files).forEach(p => {
    let cur = root;
    p.split("/").forEach(part => {
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
    const el = document.createElement("div");

    if (Object.keys(node[key]).length) {
      el.textContent = "📁 " + key;
      el.className = "folder";
      el.onclick = () => el.nextSibling.classList.toggle("hidden");
      parent.appendChild(el);

      const child = document.createElement("div");
      child.style.paddingLeft = "15px";
      parent.appendChild(child);

      renderNode(node[key], child, path);
    } else {
      el.textContent = "📄 " + key;
      el.className = "file";
      el.onclick = () => openFile(path);
      parent.appendChild(el);
    }
  }
}

function openFile(path) {
  currentPath = path;
  document.getElementById("title").textContent = path;

  if (path.endsWith(".class")) {
    const reader = new JavaClassTools.JavaClassFileReader();
    currentClass = reader.read(files[path].buffer);

    const strings = [];
    currentClass.constant_pool.forEach((c, i) => {
      if (c?.tag === 1) strings.push(`${i}|${c.bytes}`);
    });

    editor.value = strings.join("\n");
  } else {
    editor.value = new TextDecoder().decode(files[path]);
    currentClass = null;
  }
}

document.getElementById("save").onclick = () => {
  if (!currentClass) return;

  editor.value.split("\n").forEach(line => {
    const [idx, val] = line.split("|");
    const i = parseInt(idx);
    if (!isNaN(i) && currentClass.constant_pool[i]) {
      currentClass.constant_pool[i].bytes = val;
    }
  });

  const writer = new JavaClassTools.JavaClassFileWriter();
  files[currentPath] = new Uint8Array(writer.write(currentClass));
  alert("✔ Strings del .class parcheados");
};

document.getElementById("patchAll").onclick = () => {
  const find = prompt("Buscar string:");
  const replace = prompt("Reemplazar por:");

  if (!find || replace === null) return;

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

  alert("✔ Parche global aplicado");
};

document.getElementById("download").onclick = async () => {
  const out = new JSZip();
  for (const p in files) out.file(p, files[p]);
  const blob = await out.generateAsync({ type:"blob" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "plugin_modificado.jar";
  a.click();
};
