/**
 * HotelSearchBar - Hero bölümü + arama çubuğu
 *
 * Gradient arka planlı hero section, otel adı arama input'u.
 */

import React from 'react';
import { Box, Container, Typography, TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface HotelSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const HotelSearchBar: React.FC<HotelSearchBarProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1E88E5 100%)',
        py: { xs: 6, md: 8 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Dekoratif daireler */}
      <Box
        sx={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 200,
          height: 200,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.05)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -40,
          left: -40,
          width: 150,
          height: 150,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.04)',
        }}
      />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Typography
          variant="h3"
          sx={{
            color: 'white',
            fontWeight: 700,
            textAlign: 'center',
            mb: 1,
            fontSize: { xs: '1.8rem', md: '2.5rem' },
          }}
        >
          Hayalinizdeki Oteli Bulun
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            mb: 4,
            fontSize: { xs: '0.9rem', md: '1.1rem' },
          }}
        >
          Türkiye&apos;nin dört bir yanındaki en iyi otelleri keşfedin
        </Typography>

        <TextField
          fullWidth
          placeholder="Otel adı veya şehir ara..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94A3B8' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            bgcolor: 'white',
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '1.1rem',
              '& fieldset': { border: 'none' },
            },
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        />
      </Container>
    </Box>
  );
};

export default HotelSearchBar;
