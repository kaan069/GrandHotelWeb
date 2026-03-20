/**
 * BookingFooter - Public booking sitesi footer'ı
 *
 * Hakkımızda, bağlantılar, iletişim + ödeme yöntemleri logoları.
 */

import React from 'react';
import { Box, Container, Typography, Grid, IconButton, Divider } from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

/** SVG ödeme logoları (basit inline) */
const VisaLogo: React.FC = () => (
  <Box
    sx={{
      bgcolor: '#1A1F71',
      color: 'white',
      px: 1.5,
      py: 0.5,
      borderRadius: 1,
      fontSize: '0.85rem',
      fontWeight: 800,
      fontStyle: 'italic',
      letterSpacing: 1,
      display: 'inline-block',
    }}
  >
    VISA
  </Box>
);

const MastercardLogo: React.FC = () => (
  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        bgcolor: '#EB001B',
        mr: '-8px',
        zIndex: 1,
      }}
    />
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        bgcolor: '#F79E1B',
        opacity: 0.9,
      }}
    />
  </Box>
);

const IyzicoLogo: React.FC = () => (
  <Box
    sx={{
      bgcolor: '#1E64FF',
      color: 'white',
      px: 1.5,
      py: 0.5,
      borderRadius: 1,
      fontSize: '0.75rem',
      fontWeight: 700,
      display: 'inline-block',
      letterSpacing: 0.5,
    }}
  >
    iyzico
  </Box>
);

const TroyLogo: React.FC = () => (
  <Box
    sx={{
      bgcolor: '#00A651',
      color: 'white',
      px: 1.5,
      py: 0.5,
      borderRadius: 1,
      fontSize: '0.75rem',
      fontWeight: 700,
      display: 'inline-block',
    }}
  >
    TROY
  </Box>
);

const BookingFooter: React.FC = () => {
  return (
    <Box sx={{ bgcolor: '#0F172A', color: '#CBD5E1', pt: 6, pb: 3, mt: 8 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Hakkımızda */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
              GrandHotel
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.8, color: '#94A3B8' }}>
              Türkiye&apos;nin en güvenilir otel rezervasyon platformu. En uygun fiyatlarla
              hayalinizdeki tatili planlayın. 7/24 müşteri desteği ile yanınızdayız.
            </Typography>
          </Grid>

          {/* Hızlı Bağlantılar */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Hızlı Bağlantılar
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {['Oteller', 'Kampanyalar', 'Hakkımızda', 'Sıkça Sorulan Sorular', 'Gizlilik Politikası'].map((text) => (
                <Typography
                  key={text}
                  variant="body2"
                  sx={{
                    color: '#94A3B8',
                    cursor: 'pointer',
                    '&:hover': { color: 'white' },
                    transition: 'color 0.2s',
                  }}
                >
                  {text}
                </Typography>
              ))}
            </Box>
          </Grid>

          {/* İletişim */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              İletişim
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small" sx={{ color: '#64748B' }}>
                  <PhoneIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                  0850 123 45 67
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small" sx={{ color: '#64748B' }}>
                  <EmailIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                  info@grandhotel.com.tr
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small" sx={{ color: '#64748B' }}>
                  <LocationIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                  İstanbul, Türkiye
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: '#1E293B', my: 4 }} />

        {/* Ödeme Yöntemleri */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" sx={{ color: '#64748B', mr: 1 }}>
              Ödeme Yöntemleri:
            </Typography>
            <VisaLogo />
            <MastercardLogo />
            <IyzicoLogo />
            <TroyLogo />
          </Box>

          <Typography variant="caption" sx={{ color: '#475569' }}>
            &copy; {new Date().getFullYear()} GrandHotel. Tüm hakları saklıdır.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default BookingFooter;
