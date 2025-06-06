// DOM elements (same as before)
// ...

// Add loading indicators
const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'loading';
loadingIndicator.textContent = 'Processing...';
document.body.appendChild(loadingIndicator);

// Enhanced error handling
async function processImage() {
    if (!originalImage) return;
    
    processBtn.disabled = true;
    processBtn.textContent = 'Processing...';
    loadingIndicator.style.display = 'block';
    
    try {
        // Step 1: Remove background with fallback
        let bgRemoved;
        try {
            bgRemoved = await removeBackground(originalImage);
        } catch (bgError) {
            console.warn('Background removal failed, using original image', bgError);
            bgRemoved = originalImage;
        }
        
        // Step 2: Detect and center face with fallback
        let faceCentered;
        try {
            faceCentered = await centerFace(bgRemoved);
        } catch (faceError) {
            console.warn('Face detection failed, using original composition', faceError);
            faceCentered = bgRemoved;
        }
        
        // Step 3: Resize to passport size
        processedImage = resizeToPassportSize(faceCentered);
        
        // Display result
        resultCanvas.width = processedImage.width;
        resultCanvas.height = processedImage.height;
        resultCtx.drawImage(processedImage, 0, 0);
        
        downloadBtn.disabled = false;
    } catch (error) {
        console.error('Error processing image:', error);
        showError('Error processing image. Please try another photo or check the console for details.');
    } finally {
        processBtn.textContent = 'Process Photo';
        processBtn.disabled = false;
        loadingIndicator.style.display = 'none';
    }
}

// Improved background removal with multiple fallbacks
async function removeBackground(image) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        
        // Try removal.js first
        if (typeof removal !== 'undefined') {
            removal(canvas, {
                returnCanvas: true,
                bgColor: [255, 255, 255, 255],
                success: function(resultCanvas) {
                    const resultImage = new Image();
                    resultImage.onload = () => resolve(resultImage);
                    resultImage.onerror = () => reject(new Error('removal.js failed'));
                    resultImage.src = resultCanvas.toDataURL();
                },
                error: () => {
                    // Fallback to manual background removal
                    manualBackgroundRemoval(canvas)
                        .then(resolve)
                        .catch(reject);
                }
            });
        } else {
            // Fallback if removal.js not loaded
            manualBackgroundRemoval(canvas)
                .then(resolve)
                .catch(reject);
        }
    });
}

// Simple manual background removal fallback
function manualBackgroundRemoval(canvas) {
    return new Promise((resolve) => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // This is a very basic background removal - works best with solid color backgrounds
        tempCtx.drawImage(canvas, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        
        // Sample: remove white-ish backgrounds
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            
            // If pixel is white/light, make it transparent
            if (r > 200 && g > 200 && b > 200) {
                data[i+3] = 0; // Set alpha to 0
            }
        }
        
        tempCtx.putImageData(imageData, 0, 0);
        
        const resultImage = new Image();
        resultImage.onload = () => resolve(resultImage);
        resultImage.src = tempCanvas.toDataURL();
    });
}

// Error display function
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Add to style.css
.error-message {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #ff4444;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.loading {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #4CAF50;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 1000;
    display: none;
}
