const canvas = document.getElementById("screenshotCanvas");
const ctx = canvas.getContext("2d");
const intervalInput = document.getElementById("intervalInput");
const captureBtn = document.getElementById("captureBtn");
const startAutoBtn = document.getElementById("startAutoBtn");
const stopAutoBtn = document.getElementById("stopAutoBtn");
const downloadZipBtn = document.getElementById("downloadZipBtn");
const previewContainer = document.getElementById("previewContainer");

let video = document.createElement("video");
let autoCaptureInterval;
let screenshots = [];

async function captureScreen() {
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  video.srcObject = stream;
  await video.play();

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);

  const dataUrl = canvas.toDataURL("image/png");
  screenshots.push(dataUrl);

  // Show preview
  const img = document.createElement("img");
  img.src = dataUrl;
  img.width = 300;
  previewContainer.appendChild(img);

  stream.getTracks().forEach(track => track.stop());
}

captureBtn.addEventListener("click", () => {
  captureScreen();
});

startAutoBtn.addEventListener("click", () => {
  const interval = parseInt(intervalInput.value || "5") * 1000;
  if (isNaN(interval) || interval < 1000) {
    alert("Please enter a valid interval (min 1 sec).");
    return;
  }

  autoCaptureInterval = setInterval(captureScreen, interval);
  startAutoBtn.disabled = true;
  stopAutoBtn.disabled = false;
});

stopAutoBtn.addEventListener("click", () => {
  clearInterval(autoCaptureInterval);
  startAutoBtn.disabled = false;
  stopAutoBtn.disabled = true;
});

downloadZipBtn.addEventListener("click", () => {
  if (screenshots.length === 0) {
    alert("No screenshots to download.");
    return;
  }

  const zip = new JSZip();
  screenshots.forEach((dataUrl, index) => {
    const base64 = dataUrl.split(",")[1];
    zip.file(`screenshot_${index + 1}.png`, base64, { base64: true });
  });

  zip.generateAsync({ type: "blob" }).then(blob => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "screenshots.zip";
    a.click();
  });
});
