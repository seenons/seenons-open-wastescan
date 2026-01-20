/**
 * Image processing utilities
 */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

/**
 * Compress and resize an image file
 * @param {File} file - The image file to process
 * @returns {Promise<{dataUrl: string, mime: string}>} Compressed image data
 */
export function processImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          const result = resizeAndCompress(img);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Resize and compress an image
 * @param {HTMLImageElement} img - The image element
 * @returns {{dataUrl: string, mime: string}} Compressed image data
 */
function resizeAndCompress(img) {
  let { width, height } = img;
  
  // Calculate new dimensions maintaining aspect ratio
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_DIMENSION) / width);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width * MAX_DIMENSION) / height);
      height = MAX_DIMENSION;
    }
  }
  
  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  
  // Convert to JPEG data URL
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  
  return {
    dataUrl,
    mime: 'image/jpeg'
  };
}

/**
 * Create a thumbnail from an image data URL
 * @param {string} dataUrl - The image data URL
 * @param {number} size - Thumbnail size (default: 100)
 * @returns {Promise<string>} Thumbnail data URL
 */
export function createThumbnail(dataUrl, size = 100) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext('2d');
      
      // Calculate crop dimensions for square thumbnail
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
      
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to create thumbnail'));
    };
    
    img.src = dataUrl;
  });
}
