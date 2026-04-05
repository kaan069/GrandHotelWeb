/**
 * Enerji Tüketimi Paneli
 *
 * Anlık watt, günlük/aylık kWh, tahmini maliyet.
 * İlk aşamada mock verilerle çalışır.
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Bolt as BoltIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

interface EnergyPanelProps {
  roomNumber: string;
}

const EnergyPanel: React.FC<EnergyPanelProps> = ({ roomNumber }) => {
  /* Mock veriler */
  const currentWatts = 450;
  const dailyKwh = 8.3;
  const monthlyKwh = 187.5;
  const costPerKwh = 4.26; // TL/kWh
  const dailyCost = dailyKwh * costPerKwh;
  const monthlyCost = monthlyKwh * costPerKwh;

  /* Tüketim barı (max 2000W kabul edelim) */
  const wattPercent = Math.min((currentWatts / 2000) * 100, 100);

  return (
    <Card>
      <CardHeader
        title="Enerji Tüketimi"
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        sx={{ pb: 0 }}
      />
      <CardContent>
        {/* Anlık tüketim */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Anlık Tüketim
            </Typography>
            <Typography variant="h5" fontWeight={700} color="warning.main">
              {currentWatts} W
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={wattPercent}
            color={wattPercent > 70 ? 'warning' : 'primary'}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Günlük */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Bugün</Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <BoltIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body1" fontWeight={600}>{dailyKwh} kWh</Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">Tahmini Maliyet</Typography>
            <Typography variant="body1" fontWeight={600} color="success.main">
              {dailyCost.toFixed(2)} TL
            </Typography>
          </Box>
        </Box>

        {/* Aylık */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Bu Ay</Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <TrendingUpIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body1" fontWeight={600}>{monthlyKwh} kWh</Typography>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">Tahmini Maliyet</Typography>
            <Typography variant="body1" fontWeight={600} color="success.main">
              {monthlyCost.toFixed(2)} TL
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EnergyPanel;
