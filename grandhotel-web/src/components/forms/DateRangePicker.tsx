/**
 * DateRangePicker Bileşeni
 *
 * Giriş ve çıkış tarihi seçimi için yan yana iki tarih seçici.
 * Rezervasyon ve rapor sayfalarında kullanılır.
 *
 * Örnek Kullanım:
 *   <DateRangePicker
 *     startDate={formData.checkIn}
 *     endDate={formData.checkOut}
 *     onStartChange={(date) => handleDateChange('checkIn', date)}
 *     onEndChange={(date) => handleDateChange('checkOut', date)}
 *     startLabel="Giriş Tarihi"
 *     endLabel="Çıkış Tarihi"
 *     error={errors.dates}
 *   />
 *
 * Props:
 *   - startDate (dayjs): Başlangıç tarihi
 *   - endDate (dayjs): Bitiş tarihi
 *   - onStartChange (function): Başlangıç tarihi değişikliği
 *   - onEndChange (function): Bitiş tarihi değişikliği
 *   - startLabel (string): Başlangıç label (varsayılan: "Başlangıç Tarihi")
 *   - endLabel (string): Bitiş label (varsayılan: "Bitiş Tarihi")
 *   - error (string): Hata mesajı
 *   - disabled (boolean): Pasif durumda
 *   - minDate (dayjs): Seçilebilecek minimum tarih
 *   - required (boolean): Zorunlu alan mı
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/tr';

interface DateRangePickerProps {
  startDate?: Dayjs | string | null;
  endDate?: Dayjs | string | null;
  onStartChange?: (date: Dayjs | null) => void;
  onEndChange?: (date: Dayjs | null) => void;
  startLabel?: string;
  endLabel?: string;
  error?: string;
  disabled?: boolean;
  minDate?: Dayjs | string;
  required?: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate = null,
  endDate = null,
  onStartChange,
  onEndChange,
  startLabel = 'Başlangıç Tarihi',
  endLabel = 'Bitiş Tarihi',
  error,
  disabled = false,
  minDate,
  required = false,
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="tr">
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        {/* Başlangıç tarihi */}
        <DatePicker
          label={startLabel}
          value={startDate ? dayjs(startDate) : null}
          onChange={onStartChange}
          disabled={disabled}
          minDate={minDate ? dayjs(minDate) : undefined}
          format="DD.MM.YYYY"
          slotProps={{
            textField: {
              size: 'small',
              fullWidth: true,
              required: required,
              error: Boolean(error),
            },
          }}
        />

        {/* Bitiş tarihi (başlangıç tarihinden sonra olmalı) */}
        <DatePicker
          label={endLabel}
          value={endDate ? dayjs(endDate) : null}
          onChange={onEndChange}
          disabled={disabled}
          minDate={startDate ? dayjs(startDate).add(1, 'day') : minDate ? dayjs(minDate) : undefined}
          format="DD.MM.YYYY"
          slotProps={{
            textField: {
              size: 'small',
              fullWidth: true,
              required: required,
              error: Boolean(error),
              helperText: error,
            },
          }}
        />
      </Box>

      {/* Seçilen gece sayısı göstergesi */}
      {startDate && endDate && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 0.5, display: 'block' }}
        >
          {dayjs(endDate).diff(dayjs(startDate), 'day')} gece
        </Typography>
      )}
    </LocalizationProvider>
  );
};

export default DateRangePicker;
