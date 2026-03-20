/**
 * StatCard Bileşeni
 *
 * Dashboard'da kullanılan istatistik kartı.
 * Bir sayısal değeri ikon, başlık ve opsiyonel değişim yüzdesi ile gösterir.
 *
 * Örnek Kullanım:
 *   <StatCard
 *     title="Dolu Odalar"
 *     value={32}
 *     icon={<HotelIcon />}
 *     color="error"
 *     change={+5.2}
 *     subtitle="Son 24 saat"
 *   />
 *
 * Props:
 *   - title (string, zorunlu): Kart başlığı
 *   - value (string|number, zorunlu): Ana değer (sayı veya formatlı metin)
 *   - icon (ReactNode): Sol taraftaki ikon
 *   - color (string): İkon arka plan rengi (primary, success, error, warning, info)
 *   - change (number): Değişim yüzdesi (+5.2 veya -3.1 gibi)
 *   - subtitle (string): Alt açıklama metni
 *   - onClick (function): Kart tıklama fonksiyonu
 *   - loading (boolean): Yükleniyor durumu
 *   - sx (object): Ek stil özellikleri
 */

import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Skeleton,
  SxProps,
  Theme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  change?: number;
  subtitle?: string;
  onClick?: () => void;
  loading?: boolean;
  sx?: SxProps<Theme>;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = 'primary',
  change,
  subtitle,
  onClick,
  loading = false,
  sx = {},
}) => {
  /* Değişim yüzdesinin pozitif mi negatif mi olduğunu belirle */
  const isPositiveChange = change !== undefined && change > 0;
  const changeColor = isPositiveChange ? 'success.main' : 'error.main';

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': onClick
          ? { transform: 'translateY(-2px)', boxShadow: 4 }
          : {},
        ...sx,
      }}
    >
      <CardContent sx={{ p: '20px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          {/* Sol taraf: Başlık ve değer */}
          <Box sx={{ flex: 1 }}>
            {/* Kart başlığı */}
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500, mb: 1 }}
            >
              {title}
            </Typography>

            {/* Ana değer */}
            {loading ? (
              <Skeleton variant="text" width={80} height={40} />
            ) : (
              <Typography
                variant="h1"
                color="text.primary"
                sx={{ fontWeight: 700, lineHeight: 1.2 }}
              >
                {value}
              </Typography>
            )}

            {/* Değişim yüzdesi ve alt açıklama */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              {change !== undefined && change !== null && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.3,
                    color: changeColor,
                  }}
                >
                  {isPositiveChange ? (
                    <TrendingUpIcon sx={{ fontSize: 16 }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: 16 }} />
                  )}
                  <Typography variant="caption" sx={{ fontWeight: 600, color: changeColor }}>
                    %{Math.abs(change).toFixed(1)}
                  </Typography>
                </Box>
              )}

              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Sağ taraf: İkon */}
          {icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${color}.main`,
                color: '#FFFFFF',
                opacity: 0.9,
                '& .MuiSvgIcon-root': {
                  fontSize: 24,
                },
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
