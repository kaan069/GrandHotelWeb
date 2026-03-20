/**
 * PhoneInput Bileşeni
 *
 * Telefon numarası girişi için özelleştirilmiş input.
 * Otomatik formatlama: 0(5XX) XXX XX XX
 *
 * Örnek Kullanım:
 *   <PhoneInput
 *     label="Telefon"
 *     name="phone"
 *     value={formData.phone}
 *     onChange={handleChange}
 *     error={errors.phone}
 *     required
 *   />
 *
 * Props:
 *   - label (string): Input etiketi (varsayılan: "Telefon")
 *   - name (string): Input adı
 *   - value (string): Telefon numarası değeri
 *   - onChange (function): Değişiklik fonksiyonu
 *   - error (string): Hata mesajı
 *   - required (boolean): Zorunlu alan mı
 *   - disabled (boolean): Pasif durumda
 */

import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { Phone as PhoneIcon } from '@mui/icons-material';

/**
 * Telefon numarasını formatlar.
 * Girdi: "5321234567" → Çıktı: "0(532) 123 45 67"
 * Sadece rakamları kabul eder, maksimum 11 karakter.
 */
const formatPhone = (value: string): string => {
  /* Sadece rakamları al */
  const digits = value.replace(/\D/g, '');

  /* Maksimum 11 rakam (0 ile başlayan Türk telefon numarası) */
  const limited = digits.slice(0, 11);

  /* Formatlama: 0(5XX) XXX XX XX */
  if (limited.length === 0) return '';
  if (limited.length <= 1) return limited;
  if (limited.length <= 4) return `${limited[0]}(${limited.slice(1)}`;
  if (limited.length <= 7) return `${limited[0]}(${limited.slice(1, 4)}) ${limited.slice(4)}`;
  if (limited.length <= 9) return `${limited[0]}(${limited.slice(1, 4)}) ${limited.slice(4, 7)} ${limited.slice(7)}`;
  return `${limited[0]}(${limited.slice(1, 4)}) ${limited.slice(4, 7)} ${limited.slice(7, 9)} ${limited.slice(9, 11)}`;
};

/**
 * Formatlı telefon numarasından sadece rakamları çıkarır.
 * "0(532) 123 45 67" → "05321234567"
 */
const unformatPhone = (value: string): string => {
  return value.replace(/\D/g, '');
};

interface PhoneInputProps {
  label?: string;
  name?: string;
  value?: string;
  onChange?: (e: { target: { name: string; value: string } }) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  label = 'Telefon',
  name = 'phone',
  value = '',
  onChange,
  error,
  required = false,
  disabled = false,
}) => {
  /**
   * Input değişikliğini işler.
   * Formatlı değeri görsel olarak gösterir, saf rakamları state'e yazar.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = unformatPhone(e.target.value);
    if (onChange) {
      /* Orijinal event yapısını koruyarak sadece value'yu değiştir */
      onChange({
        target: {
          name: name,
          value: rawValue,
        },
      });
    }
  };

  return (
    <TextField
      label={label}
      name={name}
      value={formatPhone(value)}
      onChange={handleChange}
      error={Boolean(error)}
      helperText={error}
      required={required}
      disabled={disabled}
      placeholder="0(5XX) XXX XX XX"
      fullWidth
      size="small"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <PhoneIcon fontSize="small" color="action" />
          </InputAdornment>
        ),
      }}
      inputProps={{
        maxLength: 18, // Formatlı halinin maksimum uzunluğu
      }}
    />
  );
};

export default PhoneInput;
