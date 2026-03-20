/**
 * SearchInput Bileşeni
 *
 * Arama kutusu. Debounce desteği ile yazma bitince arama yapar.
 * Liste sayfalarının üstünde kullanılır.
 *
 * Örnek Kullanım:
 *   <SearchInput
 *     value={search}
 *     onChange={setSearch}
 *     placeholder="Müşteri adı veya telefon ara..."
 *   />
 *
 * Props:
 *   - value (string): Arama metni
 *   - onChange (function): Değişiklik fonksiyonu
 *   - placeholder (string): Placeholder metni
 *   - debounceMs (number): Debounce süresi (ms, varsayılan: 300)
 *   - fullWidth (boolean): Tam genişlik (varsayılan: false)
 *   - sx (object): Ek stil
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TextField, InputAdornment, IconButton, SxProps, Theme } from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value = '',
  onChange,
  placeholder = 'Ara...',
  debounceMs = 300,
  fullWidth = false,
  sx = {},
}) => {
  /* Dahili input değeri (kullanıcının yazdığı anlık metin) */
  const [inputValue, setInputValue] = useState(value);

  /* Dışarıdan gelen value değişince dahili değeri güncelle */
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  /**
   * Debounce mekanizması.
   * Kullanıcı yazmayı bıraktıktan {debounceMs} ms sonra onChange çağrılır.
   * Bu sayede her tuş vuruşunda API çağrısı yapılmaz.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onChange && inputValue !== value) {
        onChange(inputValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [inputValue, debounceMs]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Arama metnini temizle */
  const handleClear = useCallback(() => {
    setInputValue('');
    if (onChange) onChange('');
  }, [onChange]);

  return (
    <TextField
      value={inputValue}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
      placeholder={placeholder}
      size="small"
      fullWidth={fullWidth}
      sx={{
        minWidth: 280,
        maxWidth: fullWidth ? 'none' : 400,
        ...sx,
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" color="action" />
          </InputAdornment>
        ),
        endAdornment: inputValue ? (
          <InputAdornment position="end">
            <IconButton onClick={handleClear} size="small" edge="end">
              <CloseIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
    />
  );
};

export default SearchInput;
