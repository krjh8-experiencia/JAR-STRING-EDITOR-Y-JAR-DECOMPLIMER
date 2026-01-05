const input = document.getElementById("file");
const tree = document.getElementById("tree");
const view = document.getElementById("view");

console.log("JS cargado");

input.addEventListener("change", async () => {
  const file = input.files[0];
  if (!file) return;

  console.log("Archivo:", file.name);

  const zip = await JSZip.loadAsync(file);
  tree.innerHTML = "";

  for (const name in zip.files) {
    const entry = zip.files[name];

    const div = document.createElement("div");
    div.textContent = entry.dir ? "📁 " + name : name;

    if (!entry.dir) {
      div.style.cursor = "pointer";
      div.onclick = async () => {
        const data = await entry.async("uint8array");

        if (name.endsWith(".class")) {
          view.textContent = mostrarStrings(data);
        } else {
          view.textContent = new TextDecoder().decode(data);
        }
      };
    }

    tree.appendChild(div);
  }
});

function mostrarStrings(bytes) {
  let out = "CLASS FILE\n\nStrings detectados:\n\n";
  let s = "";

  for (const b of bytes) {
    if (b >= 32 && b <= 126) {
      s += String.fromCharCode(b);
    } else {
      if (s.length > 4) out += s + "\n";
      s = "";
    }
  }
  return out;
}
