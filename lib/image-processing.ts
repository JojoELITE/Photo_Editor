import { PhotoEditorParams } from '@/types/photo-editor';

export const applyImageAdjustments = (
  imageData: ImageData,
  params: PhotoEditorParams
): ImageData => {
  const { data } = imageData;
  const result = new ImageData(
    new Uint8ClampedArray(data),
    imageData.width,
    imageData.height
  );
  const resultData = result.data;

  const {
    brightness = 0,
    contrast = 0,
    saturation = 0,
    warmth = 0,
    tint = 0,
    gamma = 1.0,
    highlights = 0,
    shadows = 0,
    grayscale = 0,
    sepia = 0,
  } = params;

  const internalBrightness = 100 + brightness;
  const internalContrast = 100 + contrast;
  let internalSaturation = grayscale === 1 ? 0 : 100 + saturation;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply contrast
    if (internalContrast !== 100) {
      const contrastFactor = internalContrast / 100;
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // Apply brightness
    const brightnessOffset = internalBrightness - 100;
    r += brightnessOffset;
    g += brightnessOffset;
    b += brightnessOffset;

    // Apply saturation
    if (internalSaturation !== 100) {
      const saturationFactor = internalSaturation / 100;
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + saturationFactor * (r - gray);
      g = gray + saturationFactor * (g - gray);
      b = gray + saturationFactor * (b - gray);
    }

    // Apply warmth (temperature)
    if (warmth !== 0) {
      r += warmth * 2;
      b -= warmth * 1.5;
    }

    // Apply tint
    if (tint !== 0) {
      g += tint * 1.5;
      r -= tint * 0.5;
      b -= tint * 0.5;
    }

    // Apply gamma correction
    if (gamma !== 1.0) {
      r = 255 * Math.pow(r / 255, 1 / gamma);
      g = 255 * Math.pow(g / 255, 1 / gamma);
      b = 255 * Math.pow(b / 255, 1 / gamma);
    }

    // Apply highlights/shadows
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    
    if (highlights !== 0 && luminance > 180) {
      const highlightFactor = highlights / 100;
      r += (255 - r) * highlightFactor;
      g += (255 - g) * highlightFactor;
      b += (255 - b) * highlightFactor;
    }

    if (shadows !== 0 && luminance < 75) {
      const shadowFactor = shadows / 100;
      r += r * shadowFactor;
      g += g * shadowFactor;
      b += b * shadowFactor;
    }

    // Apply sepia
    if (sepia > 0) {
      const sr = r * 0.393 + g * 0.769 + b * 0.189;
      const sg = r * 0.349 + g * 0.686 + b * 0.168;
      const sb = r * 0.272 + g * 0.534 + b * 0.131;
      r = (1 - sepia) * r + sepia * sr;
      g = (1 - sepia) * g + sepia * sg;
      b = (1 - sepia) * b + sepia * sb;
    }

    // Clamp values to 0-255
    resultData[i] = Math.max(0, Math.min(255, r));
    resultData[i + 1] = Math.max(0, Math.min(255, g));
    resultData[i + 2] = Math.max(0, Math.min(255, b));
    resultData[i + 3] = data[i + 3]; // Preserve alpha channel
  }

  return result;
};

export const processImage = (
  imageUrl: string,
  params: PhotoEditorParams,
  callback: (dataUrl: string) => void
) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Apply adjustments
    const adjustedImageData = applyImageAdjustments(imageData, params);
    ctx.putImageData(adjustedImageData, 0, 0);
    
    // Convert to data URL and call the callback
    callback(canvas.toDataURL('image/jpeg', 0.9));
  };
  
  img.src = imageUrl;
};
