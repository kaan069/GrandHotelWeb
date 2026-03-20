/**
 * FormField Bileşeni
 *
 * Formlarda kullanılan standart input alanı.
 * MUI TextField üzerine kurulmuş, label, hata mesajı ve yardım metni desteği ile.
 *
 * Örnek Kullanım:
 *   <FormField
 *     label="Oda Numarası"
 *     name="roomNumber"
 *     value={formData.roomNumber}
 *     onChange={handleChange}
 *     error={errors.roomNumber}
 *     required
 *   />
 *
 * Props:
 *   - label (string, zorunlu): Input etiketi
 *   - name (string, zorunlu): Input adı (form state'i için)
 *   - value (any): Input değeri
 *   - onChange (function): Değişiklik fonksiyonu
 *   - error (string): Hata mesajı (varsa input kırmızıya döner)
 *   - helperText (string): Yardım metni (hata yoksa gösterilir)
 *   - required (boolean): Zorunlu alan mı
 *   - type (string): Input tipi (text, number, email, password vb.)
 *   - multiline (boolean): Çok satırlı input (textarea)
 *   - rows (number): Textarea satır sayısı
 *   - disabled (boolean): Pasif durumda
 *   - placeholder (string): Placeholder metni
 *   - InputProps (object): MUI InputProps (ikon eklemek vb. için)
 *   - select (boolean): Select modunda çalıştır
 *   - children (ReactNode): Select modunda seçenekler (MenuItem)
 *   - sx (object): Ek stil
 */

import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

interface FormFieldProps extends Omit<TextFieldProps, 'error'> {
  label: string;
  name: string;
  value?: unknown;
  error?: string;
  helperText?: string;
  required?: boolean;
  type?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  placeholder?: string;
  select?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  helperText,
  required = false,
  type = 'text',
  multiline = false,
  rows = 3,
  disabled = false,
  placeholder,
  InputProps,
  select = false,
  children,
  sx = {},
  ...rest
}) => {
  return (
    <TextField
      label={label}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      error={Boolean(error)}
      helperText={error || helperText}
      required={required}
      type={type}
      multiline={multiline}
      rows={multiline ? rows : undefined}
      disabled={disabled}
      placeholder={placeholder}
      InputProps={InputProps}
      select={select}
      fullWidth
      size="small"
      sx={sx}
      {...rest}
    >
      {children}
    </TextField>
  );
};

export default FormField;
