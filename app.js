const input = document.getElementById("jarInput");
const treeDiv = document.getElementById("tree");
const viewer = document.getElementById("viewer");

input.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  treeDiv.innerHTML = "Cargando...";
  const zip = await JSZip.loadAsync(file);
  treeDiv.innerHTML = "";

  const tree = {};

  // construir árbol
  zip.forEach((path, entry) => {
    const parts = path.split("/");
    let current = tree;
    for (const part of parts) {
      if (!current[part]) current[part] = {};
      current = current[part];
    }
    current.__entry = entry;
  });

  renderTree(tree, treeDiv);
});

function renderTree(node, parent) {
  for (const name in node) {
    if (name === "__entry") continue;

    const entry = node[name].__entry;
    const div = document.createElement("div");

    if (entry && !entry.dir) {
      div.textContent = name;
      div.className = "file";
      div.onclick = async () => {
        const data = await entry.async("uint8array");

        if (name.endsWith(".class")) {
          viewer.textContent = showClassInfo(data);
        } else {
          viewer.textContent = new TextDecoder().decode(data);
        }
      };
    } else {
      div.textContent = "📁 " + name;
      div.className = "folder";
      const child = document.createElement("div");
      child.style.display = "none";
      div.onclick = () => {
        child.style.display = child.style.display === "none" ? "block" : "none";
      };
      parent.appendChild(div);
      renderTree(node[name], child);
      parent.appendChild(child);
      continue;
    }

    parent.appendChild(div);
  }
}

function showClassInfo(bytes) {
  let text = "CLASS FILE\n\n";
  text += "Tamaño: " + bytes.length + " bytes\n\n";
  text += "Strings detectados:\n\n";

  let str = "";
  for (let b of bytes) {
    if (b >= 32 && b <= 126) {
      str += String.fromCharCode(b);
    } else {
      if (str.length > 4) text += str + "\n";
      str = "";
    }
  }
  return text;
}
