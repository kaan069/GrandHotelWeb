/**
 * GrandHotel PMS - Ana Tema Dosyası
 *
 * MUI teması bu dosyada birleştirilir.
 * Renk paleti, tipografi ve bileşen override'ları tek bir tema objesi olarak dışa aktarılır.
 *
 * Kullanım:
 *   import { theme } from './theme';
 *   <ThemeProvider theme={theme}>...</ThemeProvider>
 *
 * Alt dosyalar:
 *   - palette.ts   → Renk tanımları
 *   - typography.ts → Font ve metin ayarları
 *   - components.ts → MUI bileşen özelleştirmeleri
 */

import { createTheme } from '@mui/material/styles';
import palette from './palette';
import typography from './typography';
import components from './components';

/* Türkçe yerelleştirme için locale desteği */
import { trTR } from '@mui/material/locale';
import { trTR as dataGridTrTR } from '@mui/x-data-grid/locales';
import { trTR as datePickerTrTR } from '@mui/x-date-pickers/locales';

const theme = createTheme(
  {
    palette,
    typography,
    components,

    /* Genel şekil ayarları */
    shape: {
      borderRadius: 8, // Varsayılan köşe yuvarlaklığı (px)
    },

    /* Gölge ayarları - daha hafif gölgeler */
    shadows: [
      'none',
      '0 1px 2px rgba(0, 0, 0, 0.05)',
      '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
      '0 4px 6px rgba(0, 0, 0, 0.07)',
      '0 4px 12px rgba(0, 0, 0, 0.1)',
      '0 10px 15px rgba(0, 0, 0, 0.1)',
      '0 10px 25px rgba(0, 0, 0, 0.12)',
      '0 15px 35px rgba(0, 0, 0, 0.15)',
      '0 20px 40px rgba(0, 0, 0, 0.15)',
      ...Array(16).fill('0 20px 60px rgba(0, 0, 0, 0.15)'),
    ] as unknown as Theme['shadows'],

    /* Geçiş ayarları */
    transitions: {
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
      },
    },
  },
  trTR,           // MUI Türkçe
  dataGridTrTR,   // DataGrid Türkçe
  datePickerTrTR, // DatePicker Türkçe
);

/* Theme tipini import (shadows cast için gerekli) */
type Theme = typeof theme;

export default theme;
