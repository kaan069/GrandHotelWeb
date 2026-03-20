/**
 * HotelCard - Portre otel kartı
 *
 * Dikey format: kapak görseli (üst) + otel bilgileri (alt).
 * Uzun boy, dar en.
 */

import React from 'react';
import { Card, CardContent, Box, Typography, Chip, Button } from '@mui/material';
import { Star as StarIcon, LocationOn as LocationIcon } from '@mui/icons-material';

import { BookingHotel } from '../../utils/bookingData';
import { formatCurrency } from '../../utils/formatters';

const ALL_FEATURES_MAP: Record<string, string> = {
  wifi: 'Wi-Fi', minibar: 'Minibar', balcony: 'Balkon', bathtub: 'Küvet',
  safe: 'Kasa', tv: 'TV', aircon: 'Klima', hairdryer: 'Saç Kurutma',
  iron: 'Ütü', coffee: 'Çay/Kahve', jacuzzi: 'Jakuzi', terrace: 'Teras',
  smoking: 'Sigara', breakfast: 'Kahvaltı', room_service: 'Oda Servisi',
  parking: 'Otopark',
};

interface HotelCardProps {
  hotel: BookingHotel;
  onClick: (id: string) => void;
}

const HotelCard: React.FC<HotelCardProps> = ({ hotel, onClick }) => {
  const isBase64 = hotel.coverImage.startsWith('data:');

  return (
    <Card
      onClick={() => onClick(hotel.id)}
      sx={{
        cursor: 'pointer',
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        },
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 420,
      }}
    >
      {/* Kapak Görseli */}
      <Box
        sx={{
          height: 220,
          position: 'relative',
          ...(isBase64
            ? { backgroundImage: `url(${hotel.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: hotel.coverImage }),
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        {/* Yıldız badge */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            bgcolor: 'rgba(0,0,0,0.6)',
            color: 'white',
            px: 1,
            py: 0.3,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.3,
          }}
        >
          <Typography variant="body2" fontWeight={600}>{hotel.starRating}</Typography>
          <StarIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
        </Box>

        {/* İsim yok ise gradient üzerinde otel adı göster */}
        {!isBase64 && (
          <Box sx={{ p: 2, width: '100%', background: 'linear-gradient(transparent, rgba(0,0,0,0.4))' }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              {hotel.name}
            </Typography>
          </Box>
        )}
      </Box>

      {/* İçerik */}
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {isBase64 && (
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
            {hotel.name}
          </Typography>
        )}

        {/* Konum */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
          <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {hotel.district ? `${hotel.district}, ${hotel.city}` : hotel.city}
          </Typography>
        </Box>

        {/* Özellikler */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {hotel.amenities.slice(0, 3).map((a) => (
            <Chip
              key={a}
              label={ALL_FEATURES_MAP[a] || a}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 24 }}
            />
          ))}
          {hotel.amenities.length > 3 && (
            <Chip
              label={`+${hotel.amenities.length - 3}`}
              size="small"
              sx={{ fontSize: '0.7rem', height: 24 }}
            />
          )}
        </Box>

        {/* Fiyat + CTA */}
        <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Gecelik
            </Typography>
            <Typography variant="h6" color="primary" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {formatCurrency(hotel.startingPrice)}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            sx={{ textTransform: 'none', borderRadius: 2, px: 3 }}
          >
            İncele
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default HotelCard;
