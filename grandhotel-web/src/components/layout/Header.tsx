/**
 * Header Bileşeni
 *
 * Uygulamanın üst çubuğunu oluşturur.
 * Alt bileşenler:
 *   - ShiftHandoverButton — Mesai devret/aktif butonu + dialog
 *   - NightAuditButton — Gün sonu butonu + dialog
 *   - ProfileMenu — Kullanıcı profil menüsü
 *   - HeaderShortcuts — Hızlı navigasyon kısayolları
 */

import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Badge,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, HEADER_HEIGHT } from '../../utils/constants';
import useAuth from '../../hooks/useAuth';
import { useHeaderTabs } from '../../contexts/TabContext';
import HeaderShortcuts from './HeaderShortcuts';
import ShiftHandoverButton from './ShiftHandoverButton';
import NightAuditButton from './NightAuditButton';
import ProfileMenu from './ProfileMenu';

interface HeaderProps {
  onSidebarToggle: () => void;
  sidebarOpen: boolean;
}

export const TAB_BAR_HEIGHT = 42;

const Header: React.FC<HeaderProps> = ({ onSidebarToggle, sidebarOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const {
    tabs, activeTabIndex, backLabel,
    onTabChange, onTabClose, onBackToList,
  } = useHeaderTabs();
  const hasTabs = tabs.length > 0;

  const sidebarWidth = isMobile ? 0 : (sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: `calc(100% - ${sidebarWidth}px)`,
        ml: `${sidebarWidth}px`,
        height: hasTabs ? HEADER_HEIGHT + TAB_BAR_HEIGHT : HEADER_HEIGHT,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: 'width 0.2s ease, margin-left 0.2s ease, height 0.2s ease',
      }}
    >
      <Toolbar
        sx={{
          height: HEADER_HEIGHT,
          minHeight: `${HEADER_HEIGHT}px !important`,
          px: { xs: 2, md: 3 },
        }}
      >
        {/* Mobil hamburger menü */}
        {isMobile && (
          <IconButton onClick={onSidebarToggle} edge="start" sx={{ mr: 1, color: 'text.primary' }}>
            <MenuIcon />
          </IconButton>
        )}

        {/* Otel adı */}
        <Typography variant="h3" sx={{ color: 'text.primary', fontWeight: 600 }}>
          {user?.hotelName || 'Grand Hotel'}
        </Typography>

        <HeaderShortcuts />

        <Box sx={{ flex: 1 }} />

        {/* Sağ taraf: mesai + gün sonu + bildirim + profil */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShiftHandoverButton />
          <NightAuditButton />

          <IconButton sx={{ color: 'text.secondary' }}>
            <Badge badgeContent={3} color="error" max={99}>
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <ProfileMenu />
        </Box>
      </Toolbar>

      {/* Tab Bar */}
      {hasTabs && (
        <Box
          sx={{
            height: TAB_BAR_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            px: { xs: 1, md: 2 },
            gap: 0.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {activeTabIndex !== -1 && onBackToList && (
            <Chip
              icon={<ArrowBackIcon sx={{ fontSize: 14 }} />}
              label={backLabel}
              size="small"
              variant="outlined"
              onClick={onBackToList}
              sx={{ cursor: 'pointer', fontSize: '0.75rem', mr: 0.5, flexShrink: 0 }}
            />
          )}

          {tabs.map((tab, index) => {
            const isActive = activeTabIndex === index;
            return (
              <Box
                key={tab.key}
                onClick={() => onTabChange?.(index)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  cursor: 'pointer',
                  flexShrink: 0,
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 600 : 400,
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? '#fff' : 'text.primary',
                  border: '1px solid',
                  borderColor: isActive ? 'primary.main' : 'divider',
                  transition: 'all 0.15s ease',
                  '&:hover': { bgcolor: isActive ? 'primary.dark' : 'action.hover' },
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <Chip
                    label={tab.badge}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      bgcolor: isActive ? 'rgba(255,255,255,0.2)' : 'grey.200',
                      color: isActive ? '#fff' : 'text.secondary',
                    }}
                  />
                )}
                {onTabClose && (
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); onTabClose(e, index); }}
                    sx={{
                      p: 0.2,
                      ml: 0.3,
                      color: isActive ? 'rgba(255,255,255,0.7)' : 'text.disabled',
                      '&:hover': { color: isActive ? '#fff' : 'error.main' },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </AppBar>
  );
};

export default Header;
