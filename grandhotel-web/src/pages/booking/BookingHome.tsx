/**
 * BookingHome - Ana booking sayfası
 *
 * Arama, filtreler, reklam slider'ı ve otel kartları grid'i.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box } from '@mui/material';

import {
  getAllBookingHotels,
  getDistinctCities,
  BookingFilters,
  DEFAULT_FILTERS,
} from '../../utils/bookingData';
import HotelSearchBar from '../../components/booking/HotelSearchBar';
import HotelFilters from '../../components/booking/HotelFilters';
import AdSlider from '../../components/booking/AdSlider';
import HotelCardGrid from '../../components/booking/HotelCardGrid';

const BookingHome: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<BookingFilters>({ ...DEFAULT_FILTERS });
  const allHotels = useMemo(() => getAllBookingHotels(), []);
  const cities = useMemo(() => getDistinctCities(allHotels), [allHotels]);

  const filteredHotels = useMemo(() => {
    return allHotels.filter((hotel) => {
      // Arama
      if (searchQuery) {
        const q = searchQuery.toLocaleLowerCase('tr');
        const match =
          hotel.name.toLocaleLowerCase('tr').includes(q) ||
          hotel.city.toLocaleLowerCase('tr').includes(q) ||
          hotel.district.toLocaleLowerCase('tr').includes(q);
        if (!match) return false;
      }

      // Şehir filtresi
      if (filters.city && hotel.city !== filters.city) return false;

      // Fiyat aralığı
      if (hotel.startingPrice < filters.minPrice || hotel.startingPrice > filters.maxPrice) return false;

      // Yıldız filtresi
      if (filters.starRating !== null && hotel.starRating !== filters.starRating) return false;

      return true;
    });
  }, [allHotels, searchQuery, filters]);

  const handleHotelClick = (id: string) => {
    navigate(`/booking/hotel/${id}`);
  };

  return (
    <>
      <HotelSearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <HotelFilters filters={filters} onFiltersChange={setFilters} cities={cities} />

      <AdSlider />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>
            Oteller
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredHotels.length} otel bulundu
          </Typography>
        </Box>

        <HotelCardGrid hotels={filteredHotels} onHotelClick={handleHotelClick} />
      </Container>
    </>
  );
};

export default BookingHome;
