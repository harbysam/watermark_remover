const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const maskCanvas = document.createElement('canvas');
const maskCtx = maskCanvas.getContext('2d');
const brushSize = document.getElementById('brushSize');
const brushValue = document.getElementById('brushValue');
const brushCursor = document.getElementById('brushCursor');
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');
const applyBtn = document.getElementById('applyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resultSection = document.getElementById('resultSection');
const resultPreview = document.getElementById('resultPreview');
const statusEl = document.getElementById('status');
const emptyState = document.getElementById('emptyState');
const canvasPanel = document.getElementById('canvasPanel');
const fileNameBadge = document.getElementById('fileNameBadge');

const MAX_HISTORY = 40;

function t(key, vars = {}) {
    return window.wmI18n ? window.wmI18n.t(key, vars) : key;
}

let image = new Image();
let originalFile = null;
let drawing = false;
let maskHistory = [];
let resultBlob = null;
let resultFilename = '';
let resultUrl = '';

function updateUndoButton() {
    undoBtn.disabled = maskHistory.length === 0;
}

function clearResult() {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = '';
    resultBlob = null;
    resultFilename = '';
    resultPreview.removeAttribute('src');
    resultSection.classList.add('d-none');
    downloadBtn.disabled = true;
}

function invalidateResult() {
    if (!resultBlob) return;
    clearResult();
    setStatus(t('statusMaskChanged'), 'warning');
}

function saveMaskState() {
    maskHistory.push(maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height));
    if (maskHistory.length > MAX_HISTORY) maskHistory.shift();
    updateUndoButton();
}

function undoMask() {
    if (maskHistory.length === 0) return;
    const state = maskHistory.pop();
    maskCtx.putImageData(state, 0, 0);
    redraw();
    updateUndoButton();
    invalidateResult();
}

function updateBrushCursor(event) {
    if (!originalFile) return;
    const rect = canvas.getBoundingClientRect();
    const size = Number(brushSize.value);
    const displaySize = (size / canvas.width) * rect.width;
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    brushCursor.style.display = 'block';
    brushCursor.style.width = `${displaySize}px`;
    brushCursor.style.height = `${displaySize}px`;
    brushCursor.style.left = `${clientX - rect.left}px`;
    brushCursor.style.top = `${clientY - rect.top}px`;
}

function hideBrushCursor() {
    brushCursor.style.display = 'none';
}

function setStatus(text, type = 'info') {
    statusEl.className = `alert alert-${type} mb-0`;
    statusEl.textContent = text;
    statusEl.classList.remove('d-none');
}

function hideStatus() {
    statusEl.classList.add('d-none');
}

function setupCanvas(width, height) {
    canvas.width = width;
    canvas.height = height;
    maskCanvas.width = width;
    maskCanvas.height = height;
    maskCtx.clearRect(0, 0, width, height);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0);
    emptyState.classList.add('d-none');
    canvasPanel.classList.remove('canvas-panel--empty');
    document.getElementById('canvasWrap').classList.remove('d-none');
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    const overlay = document.createElement('canvas');
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    const overlayCtx = overlay.getContext('2d');
    overlayCtx.fillStyle = '#ef4444';
    overlayCtx.fillRect(0, 0, overlay.width, overlay.height);
    overlayCtx.globalCompositeOperation = 'destination-in';
    overlayCtx.drawImage(maskCanvas, 0, 0);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.drawImage(overlay, 0, 0);
    ctx.restore();
}

function getPos(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
    };
}

function drawStroke(x, y) {
    const size = Number(brushSize.value);
    maskCtx.fillStyle = '#fff';
    maskCtx.beginPath();
    maskCtx.arc(x, y, size / 2, 0, Math.PI * 2);
    maskCtx.fill();
    redraw();
}

function startDraw(event) {
    if (!originalFile) return;
    saveMaskState();
    drawing = true;
    const { x, y } = getPos(event);
    drawStroke(x, y);
    updateBrushCursor(event);
    invalidateResult();
    event.preventDefault();
}

function moveDraw(event) {
    updateBrushCursor(event);
    if (!drawing) return;
    const { x, y } = getPos(event);
    drawStroke(x, y);
    event.preventDefault();
}

function endDraw() {
    drawing = false;
}

function resetMask() {
    if (!originalFile) return;
    saveMaskState();
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    redraw();
    invalidateResult();
}

function buildExportMaskCanvas() {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = maskCanvas.width;
    exportCanvas.height = maskCanvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.fillStyle = '#000';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(maskCanvas, 0, 0);
    return exportCanvas;
}

function getCsrfToken() {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : '';
}

function resolveFilename(response) {
    const headerName = response.headers.get('X-Output-Filename');
    if (headerName) return headerName;
    const disposition = response.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="(.+)"/);
    if (match) return match[1];
    return originalFile.name;
}

async function applyProcessing() {
    if (!originalFile) return;

    setStatus(t('statusProcessing'), 'info');
    applyBtn.disabled = true;
    downloadBtn.disabled = true;

    const maskBlob = await new Promise((resolve) => {
        buildExportMaskCanvas().toBlob(resolve, 'image/png');
    });

    const formData = new FormData();
    formData.append('image', originalFile, originalFile.name);
    formData.append('mask', maskBlob, 'mask.png');

    try {
        const response = await fetch('/api/process/', {
            method: 'POST',
            headers: { 'X-CSRFToken': getCsrfToken() },
            body: formData,
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || t('statusFailed'));
        }

        const blob = await response.blob();
        const filename = resolveFilename(response);
        const sizeMb = (blob.size / (1024 * 1024)).toFixed(1);

        clearResult();
        resultBlob = blob;
        resultFilename = filename;
        resultUrl = URL.createObjectURL(blob);
        resultPreview.src = resultUrl;
        resultSection.classList.remove('d-none');
        downloadBtn.disabled = false;
        setStatus(t('statusReady', { size: sizeMb }), 'success');
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        setStatus(error.message, 'danger');
    } finally {
        applyBtn.disabled = false;
    }
}

function downloadResult() {
    if (!resultBlob || !resultFilename) return;
    const url = URL.createObjectURL(resultBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = resultFilename;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(t('statusDownloaded', { name: resultFilename }), 'success');
}

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    originalFile = file;
    clearResult();
    fileNameBadge.textContent = file.name;
    fileNameBadge.classList.remove('d-none');
    image = new Image();
    image.onload = () => {
        setupCanvas(image.width, image.height);
        maskHistory = [];
        updateUndoButton();
        clearBtn.disabled = false;
        applyBtn.disabled = false;
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        setStatus(t('statusLoaded', { name: file.name, size: sizeMb }), 'success');
    };
    image.src = URL.createObjectURL(file);
});

brushSize.addEventListener('input', () => {
    brushValue.textContent = brushSize.value;
});

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', moveDraw);
canvas.addEventListener('mouseup', endDraw);
canvas.addEventListener('mouseleave', () => {
    endDraw();
    hideBrushCursor();
});
canvas.addEventListener('mouseenter', updateBrushCursor);
canvas.addEventListener('touchstart', startDraw, { passive: false });
canvas.addEventListener('touchmove', moveDraw, { passive: false });
canvas.addEventListener('touchend', endDraw);

undoBtn.addEventListener('click', undoMask);
clearBtn.addEventListener('click', resetMask);
applyBtn.addEventListener('click', applyProcessing);
downloadBtn.addEventListener('click', downloadResult);
