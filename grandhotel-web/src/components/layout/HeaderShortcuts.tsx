/**
 * Header Kısayolları
 *
 * Header'da otel adı ile sağ kontroller arasında görünen
 * hızlı navigasyon ikonları. Mobilde gizlenir.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, IconButton, Tooltip } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Hotel as HotelIcon,
  BookOnline as BookOnlineIcon,
} from '@mui/icons-material';

/** Kısayol tanımı */
interface Shortcut {
  label: string;
  icon: React.ReactElement;
  path: string;
}

const SHORTCUTS: Shortcut[] = [
  { label: 'Dashboard', icon: <DashboardIcon fontSize="small" />, path: '/dashboard' },
  { label: 'Odalar', icon: <HotelIcon fontSize="small" />, path: '/rooms' },
  { label: 'Rezervasyonlar', icon: <BookOnlineIcon fontSize="small" />, path: '/reservations' },
];

const HeaderShortcuts: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5, ml: 2 }}>
      {SHORTCUTS.map((shortcut) => {
        const isActive = location.pathname.startsWith(shortcut.path);
        return (
          <Tooltip key={shortcut.path} title={shortcut.label} arrow>
            <IconButton
              size="small"
              onClick={() => navigate(shortcut.path)}
              sx={{
                color: isActive ? 'primary.main' : 'text.secondary',
                bgcolor: isActive ? 'action.selected' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {shortcut.icon}
            </IconButton>
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default HeaderShortcuts;
