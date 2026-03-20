/**
 * RoomTypeCard - Detay sayfası oda tipi kartı
 *
 * Yatay layout: sol görsel, sağ bilgiler + rezervasyon butonu.
 */

import React from 'react';
import { Card, CardContent, Box, Typography, Chip, Button } from '@mui/material';
import { Hotel as HotelIcon, EventAvailable as BookIcon } from '@mui/icons-material';

import { BookingRoomConfig } from '../../utils/bookingData';
import { formatCurrency } from '../../utils/formatters';

interface RoomTypeCardProps {
  room: BookingRoomConfig;
  onBook: (roomId: number) => void;
}

const RoomTypeCard: React.FC<RoomTypeCardProps> = ({ room, onBook }) => {
  const hasImage = room.images.length > 0;
  const isAvailable = room.openQuota > 0 && room.reservationsOpen;

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, opacity: isAvailable ? 1 : 0.6 }}>
      <CardContent sx={{ display: 'flex', gap: 2.5, p: 2.5, '&:last-child': { pb: 2.5 }, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
        {/* Görsel */}
        <Box
          sx={{
            width: { xs: '100%', sm: 180 },
            height: { xs: 150, sm: 130 },
            borderRadius: 2,
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...(hasImage
              ? { backgroundImage: `url(${room.images[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { bgcolor: 'grey.100' }),
          }}
        >
          {!hasImage && <HotelIcon sx={{ fontSize: 48, color: 'grey.400' }} />}
        </Box>

        {/* Bilgiler */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="h6" fontWeight={600}>
              {room.roomTypeLabel}
            </Typography>
            <Typography variant="h6" color="primary" fontWeight={700}>
              {formatCurrency(room.pricePerNight)}
              <Typography component="span" variant="body2" color="text.secondary"> / gece</Typography>
            </Typography>
          </Box>

          {room.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {room.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
            {room.featureLabels.slice(0, 6).map((f) => (
              <Chip key={f} label={f} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
            <Typography variant="caption" color={isAvailable ? 'success.main' : 'error.main'} fontWeight={500}>
              {isAvailable ? `${room.openQuota} oda müsait` : 'Müsait oda yok'}
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<BookIcon />}
              disabled={!isAvailable}
              onClick={() => onBook(room.id)}
              sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
            >
              Rezervasyon Yap
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RoomTypeCard;
