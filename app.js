let jarFile;
let editor;

require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }});
require(['vs/editor/editor.main'], () => {
  editor = monaco.editor.create(document.getElementById('editor'), {
    value: '',
    language: 'java',
    readOnly: true
  });
});

document.getElementById("jar").onchange = async e => {
  jarFile = e.target.files[0];

  const form = new FormData();
  form.append("file", jarFile);

  const res = await fetch("http://localhost:8080/upload", {
    method: "POST",
    body: form
  });

  const json = await res.json();
  renderTree(json.tree, "");
};

function renderTree(node, base) {
  for (const k in node) {
    const div = document.createElement("div");
    div.textContent = k;
    document.body.appendChild(div);

    if (Object.keys(node[k]).length === 0) {
      div.onclick = () => openFile(base + k);
    } else {
      renderTree(node[k], base + k + "/");
    }
  }
}

async function openFile(path) {
  const form = new FormData();
  form.append("jar", jarFile);
  form.append("path", path);

  const res = await fetch("http://localhost:8080/file", {
    method: "POST",
    body: form
  });

  const text = await res.text();
  editor.setValue(text);

  monaco.editor.setModelLanguage(
    editor.getModel(),
    path.endsWith(".yml") ? "yaml" : "java"
  );
}
