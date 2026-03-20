import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
} from '@mui/icons-material';

import { getReservationColor } from './helpers';

interface ChartNavBarProps {
  monthLabel: string;
  onGoBack: () => void;
  onGoForward: () => void;
  onGoToday: () => void;
}

const LEGENDS = [
  { status: 'confirmed', label: 'Onaylı' },
  { status: 'checked_in', label: 'Giriş Yapıldı' },
  { status: 'pending', label: 'Beklemede' },
  { status: 'checked_out', label: 'Çıkış Yapıldı' },
] as const;

const ChartNavBar: React.FC<ChartNavBarProps> = ({ monthLabel, onGoBack, onGoForward, onGoToday }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
      <Button variant="outlined" size="small" startIcon={<TodayIcon />} onClick={onGoToday}>
        Bugün
      </Button>
      <IconButton size="small" onClick={onGoBack}><ChevronLeftIcon /></IconButton>
      <IconButton size="small" onClick={onGoForward}><ChevronRightIcon /></IconButton>
      <Typography variant="body2" fontWeight={600} sx={{ ml: 1 }}>
        {monthLabel}
      </Typography>

      <Box sx={{ ml: 'auto', display: 'flex', gap: 1.5, alignItems: 'center' }}>
        {LEGENDS.map(({ status, label }) => {
          const color = getReservationColor(status);
          return (
            <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: color.bg, border: `2px solid ${color.border}` }} />
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ChartNavBar;
