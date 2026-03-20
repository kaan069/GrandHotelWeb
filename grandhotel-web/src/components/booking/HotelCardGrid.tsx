/**
 * HotelCardGrid - Otel kartları grid container
 *
 * 4'lü grid (desktop), 2'li (tablet), 1'li (mobil).
 */

import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { SearchOff as SearchOffIcon } from '@mui/icons-material';

import { BookingHotel } from '../../utils/bookingData';
import HotelCard from './HotelCard';

interface HotelCardGridProps {
  hotels: BookingHotel[];
  onHotelClick: (id: string) => void;
}

const HotelCardGrid: React.FC<HotelCardGridProps> = ({ hotels, onHotelClick }) => {
  if (hotels.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <SearchOffIcon sx={{ fontSize: 64, color: '#CBD5E1', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" fontWeight={500}>
          Aramanıza uygun otel bulunamadı
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Farklı filtreler deneyerek tekrar arayabilirsiniz.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {hotels.map((hotel) => (
        <Grid key={hotel.id} size={{ xs: 12, sm: 6, md: 3 }}>
          <HotelCard hotel={hotel} onClick={onHotelClick} />
        </Grid>
      ))}
    </Grid>
  );
};

export default HotelCardGrid;
