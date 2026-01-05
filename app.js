let zip;
let currentFile = null;

document.getElementById("jarInput").addEventListener("change", async e => {
  zip = await JSZip.loadAsync(e.target.files[0]);
  renderTree();
});

function renderTree() {
  const tree = document.getElementById("tree");
  tree.innerHTML = "";

  Object.keys(zip.files).forEach(name => {
    const div = document.createElement("div");
    div.textContent = name;
    div.onclick = () => openFile(name);
    tree.appendChild(div);
  });
}

async function openFile(name) {
  currentFile = name;
  const file = zip.files[name];

  if (file.dir) return;

  if (name.endsWith(".class")) {
    const buffer = await file.async("uint8array");
    document.getElementById("editor").value =
      Array.from(buffer).map(b => b.toString(16).padStart(2, "0")).join(" ");
  } else {
    document.getElementById("editor").value =
      await file.async("string");
  }
}

document.getElementById("saveFile").onclick = () => {
  if (!currentFile) return;
  zip.file(currentFile, document.getElementById("editor").value);
};

document.getElementById("downloadJar").onclick = async () => {
  const blob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "modificado.jar";
  a.click();
};

document.getElementById("applyStrings").onclick = () => {
  const search = document.getElementById("searchStr").value;
  const replace = document.getElementById("replaceStr").value;

  Object.keys(zip.files).forEach(async name => {
    if (name.endsWith(".class") || zip.files[name].dir) return;

    let content = await zip.files[name].async("string");
    if (content.includes(search)) {
      zip.file(name, content.replaceAll(search, replace));
    }
  });

  alert("Strings aplicados");
};
