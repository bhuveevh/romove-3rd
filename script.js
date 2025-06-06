// DOM elements
const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('dropArea');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const originalCanvas = document.getElementById('originalCanvas');
const resultCanvas = document.getElementById('resultCanvas');
const sizeSelect = document.getElementById('sizeSelect');

// Canvas contexts
const originalCtx = originalCanvas.getContext('2d');
const resultCtx = resultCanvas.getContext('2d');

let originalImage = null;
let processedImage = null;

// Event listeners
dropArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.style.background = '#f0f0f0';
});
dropArea.addEventListener('dragleave', () => {
    dropArea.style.background = '';
});
dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.style.background = '';
    if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect({ target: fileInput });
    }
});
processBtn.addEventListener('click', processImage);
downloadBtn.addEventListener('click', downloadImage);

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        originalImage = new Image();
        originalImage.onload = function() {
            // Display original image
            originalCanvas.width = originalImage.width;
            originalCanvas.height = originalImage.height;
            originalCtx.drawImage(originalImage, 0, 0);
            
            // Enable process button
            processBtn.disabled = false;
            downloadBtn.disabled = true;
        };
        originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Process image (background removal + passport size)
async function processImage() {
    if (!originalImage) return;
    
    processBtn.disabled = true;
    processBtn.textContent = 'Processing...';
    
    try {
        // Step 1: Remove background using client-side removal library
        const bgRemoved = await removeBackground(originalImage);
        
        // Step 2: Detect and center face
        const faceCentered = await centerFace(bgRemoved);
        
        // Step 3: Resize to passport size
        processedImage = resizeToPassportSize(faceCentered);
        
        // Display result
        resultCanvas.width = processedImage.width;
        resultCanvas.height = processedImage.height;
        resultCtx.drawImage(processedImage, 0, 0);
        
        downloadBtn.disabled = false;
    } catch (error) {
        console.error('Error processing image:', error);
        alert('Error processing image. Please try another photo.');
    }
    
    processBtn.textContent = 'Process Photo';
    processBtn.disabled = false;
}

// Background removal using client-side library
async function removeBackground(image) {
    return new Promise((resolve) => {
        // Using removal.js library (client-side alternative to remove.bg)
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        
        // Simple background removal (for better results you might need a more sophisticated approach)
        removal(canvas, {
            returnCanvas: true,
            bgColor: [255, 255, 255, 255], // white background
            success: function(resultCanvas) {
                const resultImage = new Image();
                resultImage.onload = function() {
                    resolve(resultImage);
                };
                resultImage.src = resultCanvas.toDataURL();
            }
        });
    });
}

// Face detection and centering
async function centerFace(image) {
    // Load blazeface model
    const model = await blazeface.load();
    
    // Convert image to tensor
    const imgTensor = tf.browser.fromPixels(image);
    const predictions = await model.estimateFaces(imgTensor, false);
    
    if (predictions.length > 0) {
        // Get the first face prediction
        const face = predictions[0];
        
        // Create canvas for centered face
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        
        // Calculate face center and desired position
        const faceWidth = face.topRight[0] - face.topLeft[0];
        const faceHeight = face.bottomLeft[1] - face.topLeft[1];
        const faceCenterX = face.topLeft[0] + faceWidth / 2;
        const faceCenterY = face.topLeft[1] + faceHeight / 2;
        
        // Calculate offset to center face in image
        const offsetX = canvas.width / 2 - faceCenterX;
        const offsetY = canvas.height / 3 - faceCenterY; // 1/3 from top is standard for passport
        
        // Draw image with offset
        ctx.drawImage(image, offsetX, offsetY);
        
        const result = new Image();
        result.src = canvas.toDataURL();
        return result;
    }
    
    // If no face detected, return original
    return image;
}

// Resize to passport size based on selection
function resizeToPassportSize(image) {
    const size = sizeSelect.value;
    let width, height;
    
    switch(size) {
        case '2x2':
            // 2x2 inches at 300 DPI
            width = 600;
            height = 600;
            break;
        case '35x45':
            // 35x45 mm at 300 DPI (~413x531 pixels)
            width = 413;
            height = 531;
            break;
        case '35x35':
            // 35x35 mm at 300 DPI (~413x413 pixels)
            width = 413;
            height = 413;
            break;
        default:
            width = 600;
            height = 600;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate aspect ratio and draw image centered
    const imgAspect = image.width / image.height;
    const targetAspect = width / height;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imgAspect > targetAspect) {
        // Image is wider than target
        drawHeight = height;
        drawWidth = height * imgAspect;
        offsetX = (width - drawWidth) / 2;
        offsetY = 0;
    } else {
        // Image is taller than target
        drawWidth = width;
        drawHeight = width / imgAspect;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
    }
    
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    
    const result = new Image();
    result.src = canvas.toDataURL();
    return result;
}

// Download processed image
function downloadImage() {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.download = 'passport-photo.png';
    link.href = resultCanvas.toDataURL('image/png');
    link.click();
}
