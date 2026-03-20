/**
 * BookingHotelDetail - Otel detay sayfası
 *
 * Galeri, otel bilgileri, oda tipleri, rezervasyon formu.
 */

import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Chip,
  Breadcrumbs,
  Link,
  Button,
  Divider,
} from '@mui/material';
import {
  Star as StarIcon,
  LocationOn as LocationIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';

import { getAllBookingHotels, BookingRoomConfig } from '../../utils/bookingData';
import HotelGallery from '../../components/booking/HotelGallery';
import RoomTypeCard from '../../components/booking/RoomTypeCard';
import BookingForm from '../../components/booking/BookingForm';

const ALL_FEATURES_MAP: Record<string, string> = {
  wifi: 'Wi-Fi', minibar: 'Minibar', balcony: 'Balkon', bathtub: 'Küvet',
  safe: 'Kasa', tv: 'TV', aircon: 'Klima', hairdryer: 'Saç Kurutma',
  iron: 'Ütü', coffee: 'Çay/Kahve', jacuzzi: 'Jakuzi', terrace: 'Teras',
  smoking: 'Sigara İçilir', breakfast: 'Kahvaltı Dahil', room_service: 'Oda Servisi',
  parking: 'Ücretsiz Otopark',
};

const BookingHotelDetail: React.FC = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<BookingRoomConfig | null>(null);

  const hotel = useMemo(() => {
    return getAllBookingHotels().find((h) => h.id === hotelId) || null;
  }, [hotelId]);

  if (!hotel) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
          Otel bulunamadı
        </Typography>
        <Button onClick={() => navigate('/booking')} startIcon={<BackIcon />}>
          Otellere Dön
        </Button>
      </Container>
    );
  }

  const handleBook = (roomId: number) => {
    const room = hotel.roomConfigs.find((r) => r.id === roomId);
    if (room) {
      setSelectedRoom(room);
      setBookingOpen(true);
    }
  };

  const availableRooms = hotel.roomConfigs.filter((r) => r.reservationsOpen);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          underline="hover"
          color="inherit"
          onClick={() => navigate('/booking')}
          sx={{ cursor: 'pointer' }}
        >
          Oteller
        </Link>
        <Typography color="text.primary">{hotel.name}</Typography>
      </Breadcrumbs>

      {/* Galeri */}
      <HotelGallery images={hotel.images} />

      {/* Otel Bilgileri */}
      <Box sx={{ mt: 4, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
          <Typography variant="h4" fontWeight={700}>
            {hotel.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {Array.from({ length: hotel.starRating }).map((_, i) => (
              <StarIcon key={i} sx={{ fontSize: 20, color: '#F59E0B' }} />
            ))}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
          <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <Typography variant="body1" color="text.secondary">
            {hotel.address}
          </Typography>
        </Box>

        <Typography variant="body1" sx={{ lineHeight: 1.8, maxWidth: 800, mb: 3 }}>
          {hotel.description}
        </Typography>

        {/* Özellikler */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {hotel.amenities.map((a) => (
            <Chip
              key={a}
              label={ALL_FEATURES_MAP[a] || a}
              variant="outlined"
              size="small"
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Oda Tipleri */}
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
        Oda Tipleri
      </Typography>

      {availableRooms.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          Şu anda müsait oda tipi bulunmamaktadır.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {availableRooms.map((room) => (
            <RoomTypeCard key={room.id} room={room} onBook={handleBook} />
          ))}
        </Box>
      )}

      {/* Rezervasyon Formu */}
      {selectedRoom && (
        <BookingForm
          open={bookingOpen}
          hotelName={hotel.name}
          roomTypeLabel={selectedRoom.roomTypeLabel}
          pricePerNight={selectedRoom.pricePerNight}
          onClose={() => { setBookingOpen(false); setSelectedRoom(null); }}
        />
      )}
    </Container>
  );
};

export default BookingHotelDetail;
