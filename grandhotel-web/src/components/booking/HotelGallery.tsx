/**
 * HotelGallery - Otel fotoğraf galerisi
 *
 * Büyük ana görsel + alt thumbnail satırı.
 * Gradient placeholder destekli.
 */

import React, { useState } from 'react';
import { Box } from '@mui/material';
import { Hotel as HotelIcon } from '@mui/icons-material';

interface HotelGalleryProps {
  images: string[];
}

const isBase64OrUrl = (src: string): boolean => src.startsWith('data:') || src.startsWith('http');

const HotelGallery: React.FC<HotelGalleryProps> = ({ images }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <Box
        sx={{
          height: 400,
          borderRadius: 3,
          bgcolor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <HotelIcon sx={{ fontSize: 80, color: 'grey.300' }} />
      </Box>
    );
  }

  const mainImage = images[selectedIndex] || images[0];
  const isImg = isBase64OrUrl(mainImage);

  return (
    <Box>
      {/* Ana Görsel */}
      <Box
        sx={{
          height: { xs: 250, md: 400 },
          borderRadius: 3,
          overflow: 'hidden',
          mb: 1.5,
          ...(isImg
            ? { backgroundImage: `url(${mainImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: mainImage }),
        }}
      />

      {/* Thumbnail satırı */}
      {images.length > 1 && (
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
          {images.map((img, idx) => {
            const isThumbImg = isBase64OrUrl(img);
            return (
              <Box
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                sx={{
                  width: 80,
                  height: 60,
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  flexShrink: 0,
                  border: idx === selectedIndex ? '2px solid' : '2px solid transparent',
                  borderColor: idx === selectedIndex ? 'primary.main' : 'transparent',
                  opacity: idx === selectedIndex ? 1 : 0.7,
                  transition: 'all 0.2s',
                  '&:hover': { opacity: 1 },
                  ...(isThumbImg
                    ? { backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: img }),
                }}
              />
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default HotelGallery;
