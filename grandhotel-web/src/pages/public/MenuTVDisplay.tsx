/**
 * Menü TV Ekranı — /menu/:branchCode/tv
 *
 * Cafe/Restoran duvarına asılı dikey TV için tasarlanmış menü ekranı.
 * Tek ekranda tüm kategoriler ve ürünler. Scroll yok.
 * Auto-refresh: menü değiştiğinde TV otomatik güncellenir (60sn).
 */

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { RestaurantMenu as MenuIcon } from '@mui/icons-material';

import { menuApi } from '../../api/services';
import type { ApiCatalogResponse } from '../../api/services';
import { formatCurrency } from '../../utils/formatters';

const REFRESH_INTERVAL_MS = 60_000;

const MenuTVDisplay: React.FC = () => {
  const { branchCode } = useParams<{ branchCode: string }>();
  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get('t') || undefined;
  const [data, setData] = useState<ApiCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!branchCode) return;
    let cancelled = false;

    const fetchMenu = () => {
      menuApi
        .getCatalog(branchCode, accessToken)
        .then((res) => {
          if (cancelled) return;
          setData(res);
          setError(null);
        })
        .catch(() => {
          if (cancelled) return;
          setError('Menü yüklenemedi.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    fetchMenu();
    const id = window.setInterval(fetchMenu, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [branchCode, accessToken]);

  if (loading) {
    return (
      <Box sx={tvFrame}>
        <CircularProgress sx={{ color: '#D4AF7A' }} />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={tvFrame}>
        <MenuIcon sx={{ fontSize: 96, color: '#D4AF7A', mb: 2 }} />
        <Typography variant="h4" sx={{ color: '#FFF', fontWeight: 600 }}>
          Menü Yüklenemedi
        </Typography>
      </Box>
    );
  }

  const { hotel, categories } = data;
  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);

  // Yoğunluğa göre dinamik tipografi (ürün çoksa font küçülür)
  const fontScale = totalItems <= 20 ? 1 : totalItems <= 35 ? 0.85 : 0.7;

  return (
    <Box sx={tvFrame}>
      {/* Header */}
      <Box
        sx={{
          width: '100%',
          textAlign: 'center',
          py: 4,
          borderBottom: '2px solid #8B6F47',
          flexShrink: 0,
        }}
      >
        {hotel.logoUrl ? (
          <Box
            component="img"
            src={hotel.logoUrl}
            alt={hotel.name}
            sx={{
              height: 100,
              maxWidth: '50%',
              objectFit: 'contain',
              mb: 2,
              filter: 'brightness(0) invert(1)',
              opacity: 0.95,
            }}
          />
        ) : (
          <MenuIcon sx={{ fontSize: 80, color: '#D4AF7A', mb: 1 }} />
        )}
        <Typography
          sx={{
            color: '#FFF',
            fontWeight: 800,
            fontSize: '4rem',
            letterSpacing: 8,
            lineHeight: 1,
            fontFamily: 'Georgia, serif',
          }}
        >
          MENÜ
        </Typography>
        <Typography
          sx={{
            color: '#D4AF7A',
            fontSize: '1.5rem',
            fontWeight: 500,
            letterSpacing: 4,
            mt: 1,
            textTransform: 'uppercase',
          }}
        >
          {hotel.name}
        </Typography>
      </Box>

      {/* Kategoriler — Multi-column layout */}
      <Box
        sx={{
          flex: 1,
          width: '100%',
          px: 6,
          py: 4,
          overflow: 'hidden',
          columnCount: { xs: 1, sm: 2 },
          columnGap: 6,
        }}
      >
        {categories.length === 0 ? (
          <Typography
            sx={{
              color: '#D4AF7A',
              textAlign: 'center',
              fontSize: '2rem',
              mt: 8,
            }}
          >
            Menü hazırlanıyor…
          </Typography>
        ) : (
          categories.map((cat) => (
            <Box
              key={cat.id}
              sx={{
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
                mb: 4,
              }}
            >
              {/* Kategori başlığı */}
              <Typography
                sx={{
                  color: '#D4AF7A',
                  fontWeight: 700,
                  fontSize: `${2.2 * fontScale}rem`,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  pb: 1,
                  mb: 2,
                  borderBottom: '1px solid #8B6F47',
                  fontFamily: 'Georgia, serif',
                }}
              >
                {cat.name}
              </Typography>

              {/* Ürünler */}
              <Box>
                {cat.items.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      mb: 1.5,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: 2,
                      }}
                    >
                      <Typography
                        sx={{
                          color: '#FFF',
                          fontWeight: 600,
                          fontSize: `${1.4 * fontScale}rem`,
                          flex: 1,
                          // Dotted leader (cafe menü tarzı)
                          backgroundImage:
                            'linear-gradient(to right, transparent 50%, #5A4A38 50%)',
                          backgroundPosition: 'bottom',
                          backgroundSize: '8px 1px',
                          backgroundRepeat: 'repeat-x',
                          pb: 0.5,
                        }}
                      >
                        {item.name}
                      </Typography>
                      <Typography
                        sx={{
                          color: '#D4AF7A',
                          fontWeight: 700,
                          fontSize: `${1.5 * fontScale}rem`,
                          whiteSpace: 'nowrap',
                          fontFamily: 'Georgia, serif',
                        }}
                      >
                        {formatCurrency(Number(item.price))}
                      </Typography>
                    </Box>
                    {item.description && (
                      <Typography
                        sx={{
                          color: '#A89580',
                          fontSize: `${0.95 * fontScale}rem`,
                          fontStyle: 'italic',
                          mt: 0.3,
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          ))
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          width: '100%',
          textAlign: 'center',
          py: 2,
          borderTop: '2px solid #8B6F47',
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            color: '#8B6F47',
            fontSize: '0.95rem',
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          Afiyet Olsun
        </Typography>
      </Box>
    </Box>
  );
};

const tvFrame = {
  minHeight: '100vh',
  width: '100vw',
  // Koyu, sıcak cafe atmosferi
  background: 'linear-gradient(180deg, #1A1410 0%, #2A1F15 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  overflow: 'hidden',
};

export default MenuTVDisplay;
