document.getElementById("dropCompress").addEventListener("click", () => {
  document.getElementById("fileInput").click();
});
document.getElementById("dropDecompress").addEventListener("click", () => {
  document.getElementById("zipInput").click();
});

["dropCompress", "dropDecompress"].forEach(id => {
  const zone = document.getElementById(id);
  zone.addEventListener("dragover", e => {
    e.preventDefault();
    zone.style.background = "rgba(255,255,255,0.1)";
  });
  zone.addEventListener("dragleave", () => {
    zone.style.background = "transparent";
  });
  zone.addEventListener("drop", e => {
    e.preventDefault();
    zone.style.background = "transparent";
    const inputId = id === "dropCompress" ? "fileInput" : "zipInput";
    document.getElementById(inputId).files = e.dataTransfer.files;
    if (id === "dropCompress") {
      document.getElementById("compressFileName").textContent = e.dataTransfer.files[0].name;
    }
  });
});

document.getElementById("fileInput").addEventListener("change", e => {
  document.getElementById("compressFileName").textContent = e.target.files[0]?.name || "";
});

document.getElementById("modeToggle").addEventListener("change", () => {
  document.body.classList.toggle("light-mode");
});

async function compressFile() {
  const file = document.getElementById("fileInput").files[0];
  const status = document.getElementById("status");
  if (!file) return status.textContent = "❌ Choose a file to compress.";

  const zip = new JSZip();
  zip.file(file.name, file);
  status.textContent = "⏳ Compressing...";

  const blob = await zip.generateAsync({ type: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = file.name + ".zip";
  link.click();

  status.textContent = "✅ File compressed!";
}

async function decompressFile() {
  const file = document.getElementById("zipInput").files[0];
  const status = document.getElementById("status");
  const list = document.getElementById("extractedFilesList");
  list.innerHTML = "";

  if (!file) return status.textContent = "❌ Choose a ZIP file to extract.";

  const zip = new JSZip();
  status.textContent = "⏳ Extracting...";

  const contents = await zip.loadAsync(file);
  for (const filename in contents.files) {
    const content = await contents.files[filename].async("blob");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = filename;
    link.textContent = `📄 ${filename}`;
    link.style.display = "block";

    const li = document.createElement("li");
    li.appendChild(link);
    list.appendChild(li);
  }

  status.textContent = "✅ Extraction complete!";
}
