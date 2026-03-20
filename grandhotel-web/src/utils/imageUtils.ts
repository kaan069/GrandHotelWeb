/**
 * GrandHotel PMS - Görsel Yardımcıları
 *
 * Base64 dönüşüm, sıkıştırma ve dosya doğrulama fonksiyonları.
 * ImageUpload ve DocumentUpload bileşenleri tarafından kullanılır.
 */

/** Kabul edilen görsel MIME tipleri */
const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Kabul edilen belge MIME tipleri (görsel + PDF) */
const VALID_DOCUMENT_TYPES = [...VALID_IMAGE_TYPES, 'application/pdf'];

/**
 * File nesnesini base64 data URL'e çevirir.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.readAsDataURL(file);
  });
};

/**
 * Görseli canvas ile sıkıştırır.
 * @param dataUrl - Base64 data URL
 * @param maxWidth - Maksimum genişlik (varsayılan: 800px)
 * @param quality - JPEG kalitesi 0-1 arası (varsayılan: 0.7)
 */
export const compressImage = (
  dataUrl: string,
  maxWidth = 800,
  quality = 0.7,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context oluşturulamadı'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Görsel yüklenemedi'));
    img.src = dataUrl;
  });
};

/**
 * Dosyanın geçerli bir görsel tipi olup olmadığını kontrol eder.
 */
export const isValidImageType = (file: File): boolean => {
  return VALID_IMAGE_TYPES.includes(file.type);
};

/**
 * Dosyanın geçerli bir belge tipi olup olmadığını kontrol eder.
 */
export const isValidDocumentType = (file: File): boolean => {
  return VALID_DOCUMENT_TYPES.includes(file.type);
};

/**
 * Dosya boyutunun limiti aşıp aşmadığını kontrol eder.
 * @param file - Dosya
 * @param maxSizeMB - Maksimum boyut (MB)
 */
export const isValidFileSize = (file: File, maxSizeMB: number): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};
