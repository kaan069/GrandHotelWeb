/**
 * ChannelRoomTypeCard Bileşeni
 *
 * Online kanal için tanımlanmış bir oda tipini kart olarak gösterir.
 * Tip adı, oda/kontenjan sayısı, fiyat, geçerlilik tarihi, özellikler ve görsel thumbnail içerir.
 * "Rezervasyonları Kapat/Aç" butonu ile oda tipinin kanalda açık/kapalı durumu yönetilir.
 */

import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, IconButton, Tooltip, Button } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Hotel as HotelIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

import { ChannelRoomConfig, CHANNEL_ROOM_TYPE_LABELS, ROOM_FEATURES, CHANNEL_EXTRA_FEATURES } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ConfirmDialog } from '../common';

/** Özellik value → label eşlemesi */
const ALL_FEATURES = [...ROOM_FEATURES, ...CHANNEL_EXTRA_FEATURES];
const getFeatureLabel = (value: string): string => {
  return ALL_FEATURES.find((f) => f.value === value)?.label || value;
};

interface ChannelRoomTypeCardProps {
  config: ChannelRoomConfig;
  onEdit: (config: ChannelRoomConfig) => void;
  onDelete: (id: number) => void;
  onToggleReservations: (id: number, open: boolean) => void;
}

const ChannelRoomTypeCard: React.FC<ChannelRoomTypeCardProps> = ({ config, onEdit, onDelete, onToggleReservations }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const thumbnail = config.images.length > 0 ? config.images[0].data : null;
  const isOpen = config.reservationsOpen !== false;

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          borderRadius: 2,
          opacity: isOpen ? 1 : 0.7,
          borderColor: isOpen ? 'divider' : 'error.light',
        }}
      >
        <CardContent sx={{ display: 'flex', gap: 2, p: 2, '&:last-child': { pb: 2 } }}>
          {/* Görsel */}
          <Box
            sx={{
              width: 120,
              height: 90,
              borderRadius: 1.5,
              overflow: 'hidden',
              bgcolor: 'grey.100',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {thumbnail ? (
              <Box
                component="img"
                src={thumbnail}
                alt={CHANNEL_ROOM_TYPE_LABELS[config.roomType]}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <HotelIcon sx={{ fontSize: 40, color: 'grey.400' }} />
            )}
          </Box>

          {/* Bilgiler */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {CHANNEL_ROOM_TYPE_LABELS[config.roomType]}
                </Typography>
                {!isOpen && (
                  <Chip label="Kapalı" size="small" color="error" variant="filled" />
                )}
              </Box>

              <Box>
                <Tooltip title="Düzenle">
                  <IconButton size="small" onClick={() => onEdit(config)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sil">
                  <IconButton size="small" color="error" onClick={() => setDeleteDialogOpen(true)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Toplam: <strong>{config.totalRooms}</strong> oda
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kontenjan: <strong>{config.openQuota}</strong>
              </Typography>
              <Typography variant="body2" color="primary" fontWeight={600}>
                {formatCurrency(config.pricePerNight)} / gece
              </Typography>
              {config.validUntil && (
                <Typography variant="body2" color="text.secondary">
                  Geçerlilik: <strong>{formatDate(config.validUntil)}</strong>
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {config.features.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {config.features.slice(0, 6).map((f) => (
                    <Chip key={f} label={getFeatureLabel(f)} size="small" variant="outlined" />
                  ))}
                  {config.features.length > 6 && (
                    <Chip label={`+${config.features.length - 6}`} size="small" color="default" />
                  )}
                </Box>
              )}

              <Button
                size="small"
                variant={isOpen ? 'outlined' : 'contained'}
                color={isOpen ? 'error' : 'success'}
                startIcon={isOpen ? <BlockIcon /> : <CheckCircleIcon />}
                onClick={() => onToggleReservations(config.id, !isOpen)}
                sx={{ textTransform: 'none', flexShrink: 0, ml: 1 }}
              >
                {isOpen ? 'Rezervasyonları Kapat' : 'Rezervasyonları Aç'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Oda Tipi Silinecek"
        message={`"${CHANNEL_ROOM_TYPE_LABELS[config.roomType]}" oda tipi kanaldan kaldırılacak. Devam etmek istiyor musunuz?`}
        confirmText="Sil"
        confirmColor="error"
        onConfirm={() => { onDelete(config.id); setDeleteDialogOpen(false); }}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </>
  );
};

export default ChannelRoomTypeCard;
