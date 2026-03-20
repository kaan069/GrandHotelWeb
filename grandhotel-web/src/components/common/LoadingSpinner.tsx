/**
 * LoadingSpinner Bileşeni
 *
 * Veri yüklenirken gösterilen yükleniyor göstergesi.
 * Tam sayfa veya bileşen içi kullanılabilir.
 *
 * Örnek Kullanım:
 *   <LoadingSpinner />                          → Varsayılan (bileşen içi)
 *   <LoadingSpinner fullPage />                  → Tam sayfa
 *   <LoadingSpinner message="Odalar yükleniyor..." />  → Mesajlı
 *
 * Props:
 *   - fullPage (boolean): Tam sayfa overlay olarak göster
 *   - message (string): Yükleniyor mesajı
 *   - size (number): Spinner boyutu (varsayılan: 40)
 *   - sx (object): Ek stil
 */

import React from 'react';
import { Box, CircularProgress, Typography, SxProps, Theme } from '@mui/material';

interface LoadingSpinnerProps {
  fullPage?: boolean;
  message?: string;
  size?: number;
  sx?: SxProps<Theme>;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullPage = false,
  message,
  size = 40,
  sx = {},
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        /* Tam sayfa modunda ekranın ortasına konumlan */
        ...(fullPage
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              zIndex: 9999,
            }
          : {
              py: 6,
            }),
        ...sx,
      }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;
