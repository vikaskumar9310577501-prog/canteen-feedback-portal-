/**
 * Media utilities for Kiosk and Admin Action attachments.
 * Performs client-side image compression and video handling with zero server dependencies.
 */

export const compressImage = (
  file: File,
  maxWidth: number = 1000,
  quality: number = 0.75
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image element'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Failed to create canvas context'));
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to webp if supported, or fallback to jpeg
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch {
          resolve(canvas.toDataURL('image/png'));
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
};

export const readFileAsDataUrl = (file: File, maxSizeBytes: number = 8 * 1024 * 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > maxSizeBytes) {
      const mb = Math.round(maxSizeBytes / (1024 * 1024));
      return reject(new Error(`File size exceeds limit (${mb}MB). Please choose a smaller file.`));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
};
