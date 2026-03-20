/**
 * EmptyState Bileşeni
 *
 * Veri olmayan durumlarda gösterilen bilgi ekranı.
 * Liste sayfalarında, arama sonuçlarında ve filtreleme sonrası boş durumlarda kullanılır.
 *
 * Örnek Kullanım:
 *   <EmptyState
 *     icon={<HotelIcon />}
 *     title="Henüz oda eklenmemiş"
 *     description="İlk odanızı ekleyerek başlayın."
 *     actionLabel="Yeni Oda Ekle"
 *     onAction={() => navigate('/rooms/new')}
 *   />
 *
 * Props:
 *   - icon (ReactNode): Üstte gösterilecek ikon
 *   - title (string, zorunlu): Başlık metni
 *   - description (string): Açıklama metni
 *   - actionLabel (string): Aksiyon butonu metni
 *   - onAction (function): Aksiyon butonu tıklama fonksiyonu
 *   - sx (object): Ek stil
 */

import React from 'react';
import { Box, Typography, Button, SxProps, Theme } from '@mui/material';
import { Inbox as InboxIcon } from '@mui/icons-material';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  sx?: SxProps<Theme>;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  sx = {},
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
        ...sx,
      }}
    >
      {/* İkon */}
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          color: 'text.disabled',
          '& .MuiSvgIcon-root': {
            fontSize: 40,
          },
        }}
      >
        {icon || <InboxIcon />}
      </Box>

      {/* Başlık */}
      <Typography
        variant="h3"
        color="text.primary"
        sx={{ mb: 1 }}
      >
        {title}
      </Typography>

      {/* Açıklama */}
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 400 }}
        >
          {description}
        </Typography>
      )}

      {/* Aksiyon butonu */}
      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          size="large"
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
