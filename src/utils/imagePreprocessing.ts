/**
 * Image preprocessing utilities for improving OCR accuracy
 */

export const preprocessImage = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Apply preprocessing
      enhanceContrast(data);
      convertToGrayscale(data);
      applyThreshold(data, 128);

      // Put processed data back
      ctx.putImageData(imageData, 0, 0);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const processedFile = new File([blob], file.name, { type: 'image/png' });
          resolve(processedFile);
        } else {
          reject(new Error('Could not create blob from canvas'));
        }
      }, 'image/png');
    };

    img.onerror = () => reject(new Error('Could not load image'));
    img.src = URL.createObjectURL(file);
  });
};

const enhanceContrast = (data: Uint8ClampedArray) => {
  const factor = 1.5; // Contrast enhancement factor
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(((data[i] - 128) * factor) + 128);     // Red
    data[i + 1] = clamp(((data[i + 1] - 128) * factor) + 128); // Green
    data[i + 2] = clamp(((data[i + 2] - 128) * factor) + 128); // Blue
  }
};

const convertToGrayscale = (data: Uint8ClampedArray) => {
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
};

const applyThreshold = (data: Uint8ClampedArray, threshold: number) => {
  for (let i = 0; i < data.length; i += 4) {
    const value = data[i] > threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = value;
  }
};

const clamp = (value: number): number => {
  return Math.max(0, Math.min(255, value));
};

export const extractImagesFromPdf = async (file: File): Promise<File[]> => {
  // For now, return empty array as PDF.js is not installed
  // This would require pdf.js library to extract images from PDF
  console.warn('PDF image extraction not yet implemented');
  return [];
};
