const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let isCloning = false;
let isErasing = false;
let isBrushing = false;
let cloneData;
let historyStack = [];
let redoStack = [];
let lastX, lastY;

canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);

function startPosition(e) {
    if (!isCloning && !isErasing && !isBrushing) return;
    if (isCloning) {
        cloneData = ctx.getImageData(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop, 50, 50);
        drawCloneStamp(e);
    } else if (isErasing) {
        ctx.clearRect(e.clientX - canvas.offsetLeft - 25, e.clientY - canvas.offsetTop - 25, 50, 50);
    } else if (isBrushing) {
        isDrawing = true;
        [lastX, lastY] = [e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop];
    }
}

function endPosition() {
    if (!isBrushing) return;
    isDrawing = false;
    saveCanvasState();
}

function drawCloneStamp(e) {
    const offsetX = e.clientX - canvas.offsetLeft - 25;
    const offsetY = e.clientY - canvas.offsetTop - 25;
    ctx.putImageData(cloneData, offsetX, offsetY);
}

function toggleCloneStamp() {
    isCloning = !isCloning;
    isErasing = false;
    isBrushing = false;
    canvas.style.cursor = isCloning ? 'crosshair' : 'auto';
}

function toggleEraser() {
    isErasing = !isErasing;
    isCloning = false;
    isBrushing = false;
    canvas.style.cursor = isErasing ? 'crosshair' : 'auto';
}

function undo() {
    if (historyStack.length > 1) {
        const lastState = historyStack.pop();
        redoStack.push(lastState);
        const prevState = historyStack[historyStack.length - 1];
        ctx.putImageData(prevState, 0, 0);
    }
}

function redo() {
    if (redoStack.length > 0) {
        const nextState = redoStack.pop();
        ctx.putImageData(nextState, 0, 0);
        historyStack.push(nextState);
    }
}

function saveCanvasState() {
    historyStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

const imageInput = document.getElementById('imageInput');
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            saveCanvasState();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

document.addEventListener('paste', function(event) {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    let blob = null;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
            blob = items[i].getAsFile();
            break;
        }
    }
    if (blob !== null) {
        const image = new Image();
        image.onload = function() {
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            saveCanvasState();
        };
        const reader = new FileReader();
        reader.onload = function(event) {
            image.src = event.target.result;
        };
        reader.readAsDataURL(blob);
    } else {
        alert('No image found in clipboard!');
    }
});

function downloadImage() {
    const dataUrl = canvas.toDataURL();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'image.png';
    a.click();
}

function pasteImageUrl() {
    const imageUrl = document.getElementById('pasteUrlInput').value;
    const image = new Image();
    image.onload = function() {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        saveCanvasState();
    };
    image.src = imageUrl;
}

const brushButton = document.getElementById('brushButton');
const brushShape = document.getElementById('brushShape');
const brushColor = document.getElementById('brushColor');
const brushSize = document.getElementById('brushSize');
const brushOpacity = document.getElementById('brushOpacity');

brushButton.addEventListener('click', function() {
    isCloning = false;
    isErasing = false;
    isBrushing = true;
    canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('mousemove', drawBrushStroke);

function drawBrushStroke(e) {
    if (!isBrushing || !isDrawing) return;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize.value;
    ctx.strokeStyle = brushColor.value;
    ctx.globalAlpha = brushOpacity.value;
    ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
    ctx.stroke();
    [lastX, lastY] = [e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop];
}
