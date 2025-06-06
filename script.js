async function processImage() {
    if (!originalImage) return;
    
    processBtn.disabled = true;
    processBtn.textContent = 'Processing...';
    
    try {
        // Create result canvas
        resultCanvas.width = 600; // Default 2x2 inches at 300 DPI
        resultCanvas.height = 600;
        resultCtx.fillStyle = 'white';
        resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);
        
        // Calculate aspect-appropriate dimensions
        const aspect = originalImage.width / originalImage.height;
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (aspect > 1) {
            // Landscape
            drawHeight = resultCanvas.height;
            drawWidth = drawHeight * aspect;
            offsetX = (resultCanvas.width - drawWidth) / 2;
            offsetY = 0;
        } else {
            // Portrait
            drawWidth = resultCanvas.width;
            drawHeight = drawWidth / aspect;
            offsetX = 0;
            offsetY = (resultCanvas.height - drawHeight) / 3; // Standard passport positioning
        }
        
        // Draw image with white background
        resultCtx.drawImage(originalImage, offsetX, offsetY, drawWidth, drawHeight);
        
        // Create processed image reference
        processedImage = new Image();
        processedImage.src = resultCanvas.toDataURL();
        
        downloadBtn.disabled = false;
    } catch (error) {
        console.error('Simple processing error:', error);
        showError('Error creating passport photo. Please try another image.');
    } finally {
        processBtn.textContent = 'Process Photo';
        processBtn.disabled = false;
    }
}
