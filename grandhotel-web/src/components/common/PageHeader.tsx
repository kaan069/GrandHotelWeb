/**
 * PageHeader Bileşeni
 *
 * Her sayfanın üst kısmında bulunan başlık alanı.
 * Sayfa başlığı, açıklama metni ve aksiyon butonları içerir.
 * Tab sistemi Header (AppBar) bileşenine taşınmıştır.
 */

import React from 'react';
import {
  Box,
  Typography,
  SxProps,
  Theme,
} from '@mui/material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  sx?: SxProps<Theme>;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  sx = {},
}) => {
  return (
    <Box sx={{ mb: 3, ...sx }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        {/* Sol taraf: Başlık ve açıklama */}
        <Box>
          <Typography variant="h1" color="text.primary">
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* Sağ taraf: Aksiyon butonları */}
        {actions && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexShrink: 0,
            }}
          >
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;
