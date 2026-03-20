/**
 * HotelFilters - Şehir, fiyat aralığı, yıldız filtreleri
 */

import React from 'react';
import {
  Box,
  Container,
  Select,
  MenuItem,
  Slider,
  Typography,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import { FilterAltOff as ClearIcon, Star as StarIcon } from '@mui/icons-material';

import { BookingFilters, DEFAULT_FILTERS } from '../../utils/bookingData';

interface HotelFiltersProps {
  filters: BookingFilters;
  onFiltersChange: (filters: BookingFilters) => void;
  cities: string[];
}

const HotelFiltersComponent: React.FC<HotelFiltersProps> = ({ filters, onFiltersChange, cities }) => {
  const handleCityChange = (e: SelectChangeEvent) => {
    onFiltersChange({ ...filters, city: e.target.value });
  };

  const handlePriceChange = (_: Event, value: number | number[]) => {
    const [min, max] = value as number[];
    onFiltersChange({ ...filters, minPrice: min, maxPrice: max });
  };

  const handleStarChange = (_: React.MouseEvent<HTMLElement>, value: number | null) => {
    onFiltersChange({ ...filters, starRating: value });
  };

  const handleClear = () => {
    onFiltersChange({ ...DEFAULT_FILTERS });
  };

  const isFiltered = filters.city !== '' ||
    filters.minPrice !== 0 ||
    filters.maxPrice !== 10000 ||
    filters.starRating !== null;

  return (
    <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 3,
          }}
        >
          {/* Şehir */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Şehir</InputLabel>
            <Select
              value={filters.city}
              onChange={handleCityChange}
              label="Şehir"
            >
              <MenuItem value="">Tümü</MenuItem>
              {cities.map((city) => (
                <MenuItem key={city} value={city}>{city}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Fiyat Aralığı */}
          <Box sx={{ minWidth: 200, flex: '0 0 auto' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Fiyat Aralığı: {filters.minPrice.toLocaleString('tr-TR')} ₺ - {filters.maxPrice.toLocaleString('tr-TR')} ₺
            </Typography>
            <Slider
              value={[filters.minPrice, filters.maxPrice]}
              onChange={handlePriceChange}
              min={0}
              max={10000}
              step={500}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v.toLocaleString('tr-TR')} ₺`}
              size="small"
            />
          </Box>

          {/* Yıldız */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Yıldız
            </Typography>
            <ToggleButtonGroup
              value={filters.starRating}
              exclusive
              onChange={handleStarChange}
              size="small"
            >
              {[3, 4, 5].map((star) => (
                <ToggleButton key={star} value={star} sx={{ px: 1.5, py: 0.5 }}>
                  <Typography variant="body2" sx={{ mr: 0.3 }}>{star}</Typography>
                  <StarIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Temizle */}
          {isFiltered && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClear}
              sx={{ textTransform: 'none', ml: 'auto' }}
            >
              Filtreleri Temizle
            </Button>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default HotelFiltersComponent;
