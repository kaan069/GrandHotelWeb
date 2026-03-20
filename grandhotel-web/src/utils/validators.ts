/**
 * GrandHotel PMS - Doğrulama (Validation) Yardımcıları
 *
 * Form alanlarının doğrulanması için kullanılır.
 * Her fonksiyon hata mesajı döndürür (geçerliyse null döner).
 *
 * Kullanım:
 *   import { validateRequired, validateEmail, validatePhone } from '../utils/validators';
 *
 *   const errors = {};
 *   errors.name = validateRequired(formData.name, 'Ad');
 *   errors.email = validateEmail(formData.email);
 *   errors.phone = validatePhone(formData.phone);
 */

/** Doğrulama fonksiyonu tipi */
export type ValidationRule = (value: unknown) => string | null;

/** Form doğrulama sonucu */
export interface ValidationResult {
  errors: Record<string, string>;
  isValid: boolean;
}

/**
 * Zorunlu alan kontrolü.
 * @param value - Kontrol edilecek değer
 * @param fieldName - Alan adı (hata mesajında kullanılır)
 * @returns Hata mesajı veya null
 */
export const validateRequired = (value: unknown, fieldName = 'Bu alan'): string | null => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return `${fieldName} zorunludur`;
  }
  return null;
};

/**
 * E-posta formatı kontrolü.
 * @param email
 * @returns
 */
export const validateEmail = (email: string | null | undefined): string | null => {
  if (!email) return null; // Zorunlu değilse boş geçilebilir
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Geçerli bir e-posta adresi giriniz';
  }
  return null;
};

/**
 * Telefon numarası kontrolü.
 * Türk telefon formatı: 05XX XXX XX XX (10-11 haneli)
 * @param phone
 * @returns
 */
export const validatePhone = (phone: string | null | undefined): string | null => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) {
    return 'Geçerli bir telefon numarası giriniz';
  }
  return null;
};

/**
 * TC Kimlik numarası kontrolü.
 * 11 haneli sayısal değer, ilk hane 0 olamaz.
 * @param tc
 * @returns
 */
export const validateTC = (tc: string | null | undefined): string | null => {
  if (!tc) return null;
  const digits = tc.replace(/\D/g, '');
  if (digits.length !== 11 || digits[0] === '0') {
    return 'Geçerli bir TC Kimlik numarası giriniz';
  }
  return null;
};

/**
 * Minimum karakter uzunluğu kontrolü.
 * @param value
 * @param min - Minimum karakter sayısı
 * @param fieldName
 * @returns
 */
export const validateMinLength = (value: string | null | undefined, min: number, fieldName = 'Bu alan'): string | null => {
  if (!value) return null;
  if (String(value).trim().length < min) {
    return `${fieldName} en az ${min} karakter olmalıdır`;
  }
  return null;
};

/**
 * Sayısal değer kontrolü (pozitif).
 * @param value
 * @param fieldName
 * @returns
 */
export const validatePositiveNumber = (value: unknown, fieldName = 'Bu alan'): string | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (isNaN(num) || num <= 0) {
    return `${fieldName} pozitif bir sayı olmalıdır`;
  }
  return null;
};

/**
 * Tarih aralığı kontrolü.
 * Çıkış tarihi giriş tarihinden sonra olmalıdır.
 * @param startDate - Başlangıç tarihi
 * @param endDate - Bitiş tarihi
 * @returns
 */
export const validateDateRange = (startDate: string | Date | null | undefined, endDate: string | Date | null | undefined): string | null => {
  if (!startDate || !endDate) return null;
  if (new Date(endDate) <= new Date(startDate)) {
    return 'Çıkış tarihi giriş tarihinden sonra olmalıdır';
  }
  return null;
};

/**
 * Vergi numarası kontrolü.
 * 10 veya 11 haneli sayısal değer.
 * @param taxNumber
 * @returns
 */
export const validateTaxNumber = (taxNumber: string | null | undefined): string | null => {
  if (!taxNumber) return null;
  const digits = taxNumber.replace(/\D/g, '');
  if (digits.length !== 10 && digits.length !== 11) {
    return 'Geçerli bir vergi numarası giriniz (10 veya 11 hane)';
  }
  return null;
};

/**
 * Şifre kontrolü.
 * En az 6 karakter olmalıdır.
 * @param password
 * @returns
 */
export const validatePassword = (password: string | null | undefined): string | null => {
  if (!password) return null;
  if (password.length < 6) {
    return 'Şifre en az 6 karakter olmalıdır';
  }
  return null;
};

/**
 * Form doğrulama yardımcısı.
 * Tüm alanları kontrol eder ve hata objesi döndürür.
 *
 * @param formData - Form verileri
 * @param rules - Doğrulama kuralları
 * @returns
 *
 * Örnek Kullanım:
 *   const { errors, isValid } = validateForm(formData, {
 *     name: [(v) => validateRequired(v, 'Ad')],
 *     email: [(v) => validateEmail(v)],
 *     phone: [(v) => validateRequired(v, 'Telefon'), (v) => validatePhone(v)],
 *   });
 */
export const validateForm = (
  formData: Record<string, unknown>,
  rules: Record<string, ValidationRule[]>
): ValidationResult => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach((field) => {
    const fieldRules = rules[field];
    for (const rule of fieldRules) {
      const error = rule(formData[field]);
      if (error) {
        errors[field] = error;
        break; // İlk hatada dur, sonraki kuralları kontrol etme
      }
    }
  });

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};
