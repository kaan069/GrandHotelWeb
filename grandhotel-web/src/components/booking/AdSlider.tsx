/**
 * AdSlider - Kayan reklam banner'ları
 *
 * CSS scroll-snap + setInterval ile otomatik kayma.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Container, Typography } from '@mui/material';

interface SliderBanner {
  gradient: string;
  title: string;
  subtitle: string;
}

const BANNERS: SliderBanner[] = [
  {
    gradient: 'linear-gradient(135deg, #1565C0 0%, #42A5F5 100%)',
    title: 'Erken Rezervasyon Fırsatı!',
    subtitle: 'Yaz tatili için şimdiden %30\'a varan indirimlerle rezervasyon yapın.',
  },
  {
    gradient: 'linear-gradient(135deg, #E65100 0%, #FF9800 100%)',
    title: 'Hafta Sonu Kaçamağı',
    subtitle: 'Doğa otelleri ve termal tesislerde 2 gece konaklama fırsatları sizi bekliyor.',
  },
  {
    gradient: 'linear-gradient(135deg, #2E7D32 0%, #66BB6A 100%)',
    title: 'Aile Paketi Avantajı',
    subtitle: '0-6 yaş çocuklara ücretsiz konaklama imkanı sunan otelleri keşfedin.',
  },
  {
    gradient: 'linear-gradient(135deg, #6A1B9A 0%, #AB47BC 100%)',
    title: 'Balayı Otelleri',
    subtitle: 'Romantik bir kaçamak için özel balayı paketleri ve suite odalar.',
  },
];

const AdSlider: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToIndex = useCallback((index: number) => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: width * index, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % BANNERS.length;
        scrollToIndex(next);
        return next;
      });
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [scrollToIndex]);

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
    scrollToIndex(index);
    // Reset interval
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % BANNERS.length;
        scrollToIndex(next);
        return next;
      });
    }, 5000);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 2 }}>
      {/* Slider */}
      <Box
        ref={scrollRef}
        sx={{
          display: 'flex',
          overflow: 'hidden',
          scrollSnapType: 'x mandatory',
          borderRadius: 3,
        }}
      >
        {BANNERS.map((banner, idx) => (
          <Box
            key={idx}
            sx={{
              minWidth: '100%',
              scrollSnapAlign: 'start',
              background: banner.gradient,
              py: { xs: 4, md: 5 },
              px: { xs: 3, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: 'white',
                fontWeight: 700,
                mb: 1,
                fontSize: { xs: '1.2rem', md: '1.5rem' },
              }}
            >
              {banner.title}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255,255,255,0.85)',
                maxWidth: 500,
                fontSize: { xs: '0.85rem', md: '1rem' },
              }}
            >
              {banner.subtitle}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Dots */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
        {BANNERS.map((_, idx) => (
          <Box
            key={idx}
            onClick={() => handleDotClick(idx)}
            sx={{
              width: activeIndex === idx ? 24 : 8,
              height: 8,
              borderRadius: 4,
              bgcolor: activeIndex === idx ? 'primary.main' : '#CBD5E1',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </Box>
    </Container>
  );
};

export default AdSlider;
