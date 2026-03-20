/**
 * BookingHeader - Public booking sitesi header'ı
 *
 * Logo + navigasyon linkleri. Mobilde hamburger menü.
 */

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Menu as MenuIcon, Hotel as HotelIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Ana Sayfa', path: '/booking' },
  { label: 'Oteller', path: '/booking' },
];

const BookingHeader: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      <AppBar
        position="sticky"
        elevation={1}
        sx={{
          bgcolor: 'white',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ minHeight: 64 }}>
            {/* Logo */}
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mr: 4 }}
              onClick={() => navigate('/booking')}
            >
              <HotelIcon sx={{ color: 'primary.main', fontSize: 32 }} />
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '-0.5px' }}
              >
                GrandHotel
              </Typography>
            </Box>

            {/* Desktop nav */}
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
                {NAV_LINKS.map((link) => (
                  <Button
                    key={link.label}
                    onClick={() => navigate(link.path)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: location.pathname === link.path ? 600 : 400,
                      color: location.pathname === link.path ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    {link.label}
                  </Button>
                ))}
              </Box>
            )}

            <Box sx={{ flex: 1 }} />

            {/* PMS girişi linki */}
            {!isMobile && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/login')}
                sx={{ textTransform: 'none' }}
              >
                Otel Girişi
              </Button>
            )}

            {/* Mobile hamburger */}
            {isMobile && (
              <IconButton onClick={() => setDrawerOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 250, pt: 2 }}>
          <List>
            {NAV_LINKS.map((link) => (
              <ListItemButton
                key={link.label}
                onClick={() => { navigate(link.path); setDrawerOpen(false); }}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
            <ListItemButton onClick={() => { navigate('/login'); setDrawerOpen(false); }}>
              <ListItemText primary="Otel Girişi" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default BookingHeader;
