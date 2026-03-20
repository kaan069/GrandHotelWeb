/**
 * CurrencyInput Bileşeni
 *
 * Para birimi girişi için özelleştirilmiş input.
 * Otomatik formatlama: 1.250,00 ₺
 *
 * Örnek Kullanım:
 *   <CurrencyInput
 *     label="Gecelik Fiyat"
 *     name="price"
 *     value={formData.price}
 *     onChange={handleChange}
 *     error={errors.price}
 *     required
 *   />
 *
 * Props:
 *   - label (string): Input etiketi
 *   - name (string): Input adı
 *   - value (number|string): Para değeri (sayı olarak tutulur)
 *   - onChange (function): Değişiklik fonksiyonu
 *   - error (string): Hata mesajı
 *   - required (boolean): Zorunlu alan mı
 *   - disabled (boolean): Pasif durumda
 *   - helperText (string): Yardım metni
 */

import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { CURRENCY_SYMBOL } from '../../utils/constants';

/**
 * Sayı değerini Türk para formatına çevirir.
 * 1250.5 → "1.250,50"
 */
const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === '' || value === null || value === undefined) return '';

  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';

  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

/**
 * Formatlı para değerini sayıya çevirir.
 * "1.250,50" → 1250.5
 */
const parseCurrency = (value: string): number | string => {
  if (!value) return '';
  /* Türk formatından sayıya: noktaları kaldır, virgülü noktaya çevir */
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? '' : num;
};

interface CurrencyInputProps {
  label?: string;
  name?: string;
  value?: number | string;
  onChange?: (e: { target: { name: string; value: number | string } }) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  name,
  value = '',
  onChange,
  error,
  required = false,
  disabled = false,
  helperText,
}) => {
  /**
   * Input değişikliğini işler.
   * Sadece rakam, nokta ve virgül kabul eder.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    /* Sadece rakam, nokta ve virgüle izin ver */
    const cleaned = inputValue.replace(/[^0-9.,]/g, '');
    const numericValue = parseCurrency(cleaned);

    if (onChange) {
      onChange({
        target: {
          name: name || '',
          value: numericValue,
        },
      });
    }
  };

  return (
    <TextField
      label={label}
      name={name}
      value={formatCurrency(value)}
      onChange={handleChange}
      error={Boolean(error)}
      helperText={error || helperText}
      required={required}
      disabled={disabled}
      fullWidth
      size="small"
      placeholder="0,00"
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            {CURRENCY_SYMBOL}
          </InputAdornment>
        ),
      }}
    />
  );
};

export default CurrencyInput;
