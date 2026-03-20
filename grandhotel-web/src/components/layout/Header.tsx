/**
 * Header Bileşeni
 *
 * Uygulamanın üst çubuğunu oluşturur.
 * Özellikler:
 *   - Sayfa başlığı (breadcrumb ile)
 *   - Bildirim ikonu ve sayacı
 *   - Mesai Devret butonu (sadece resepsiyon)
 *   - Kullanıcı profil menüsü (ad, rol, çıkış)
 *   - Mobilde hamburger menü butonu
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Divider,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  Chip,
} from '@mui/material';

import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  SwapHoriz as SwapHorizIcon,
  NightsStay as NightsStayIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, HEADER_HEIGHT, ROLE_LABELS, ROLES } from '../../utils/constants';
import useAuth from '../../hooks/useAuth';
import usePermission from '../../hooks/usePermission';
import { createShift, getActiveShift } from '../../utils/shiftStorage';
import { useHeaderTabs } from '../../contexts/TabContext';
import HeaderShortcuts from './HeaderShortcuts';
import NightAuditDialog from './NightAuditDialog';

/** Mesai devredilebilecek personeller (mock) */
const SHIFT_EMPLOYEES = [
  { id: 2, name: 'Mehmet Demir', role: 'Müdür' },
  { id: 3, name: 'Ayşe Kaya', role: 'Resepsiyon' },
  { id: 4, name: 'Fatma Çelik', role: 'Garson' },
];

interface HeaderProps {
  onSidebarToggle: () => void;
  sidebarOpen: boolean;
}

export const TAB_BAR_HEIGHT = 42;

const Header: React.FC<HeaderProps> = ({ onSidebarToggle, sidebarOpen }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { canRunNightAudit } = usePermission();
  const {
    tabs, activeTabIndex, backLabel,
    onTabChange, onTabClose, onBackToList,
  } = useHeaderTabs();
  const hasTabs = tabs.length > 0;

  /* Profil menüsü */
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const profileMenuOpen = Boolean(anchorEl);

  /* Mesai devir dialog */
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: number; name: string } | null>(null);

  /* Gün sonu dialog */
  const [nightAuditDialogOpen, setNightAuditDialogOpen] = useState(false);

  const isReception = user?.role === ROLES.RECEPTION;
  const activeShift = getActiveShift();

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = (): void => {
    setAnchorEl(null);
  };

  const handleLogout = (): void => {
    handleProfileClose();
    logout();
  };

  /** Mesai devir dialog aç */
  const handleShiftDialogOpen = () => {
    setSelectedEmployee(null);
    setShiftDialogOpen(true);
  };

  /** Mesai devret */
  const handleShiftConfirm = () => {
    if (selectedEmployee && user) {
      const fullName = `${user.firstName} ${user.lastName}`;
      createShift(fullName, selectedEmployee.name);
      setShiftDialogOpen(false);
      setSelectedEmployee(null);
    }
  };

  const sidebarWidth = isMobile ? 0 : (sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH);

  // Kendisi hariç personel listesi
  const availableEmployees = SHIFT_EMPLOYEES.filter((e) => e.id !== user?.id);

  return (
    <>
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
          {/* Mobil hamburger menü butonu */}
          {isMobile && (
            <IconButton
              onClick={onSidebarToggle}
              edge="start"
              sx={{ mr: 1, color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Otel adı */}
          <Typography
            variant="h3"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
            }}
          >
            {user?.hotelName || 'Grand Hotel'}
          </Typography>

          {/* Hızlı navigasyon kısayolları */}
          <HeaderShortcuts />

          <Box sx={{ flex: 1 }} />

          {/* Sağ taraf: gün sonu + mesai devret + bildirim + profil */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Mesai Devret butonu - sadece resepsiyon */}
            {isReception && !activeShift && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<SwapHorizIcon />}
                onClick={handleShiftDialogOpen}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  borderRadius: 2,
                  mr: 0.5,
                }}
              >
                Mesai Devret
              </Button>
            )}

            {/* Aktif mesai göstergesi */}
            {isReception && activeShift && (
              <Button
                variant="contained"
                size="small"
                color="success"
                startIcon={<SwapHorizIcon />}
                onClick={() => navigate('/shift-handover')}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  borderRadius: 2,
                  mr: 0.5,
                }}
              >
                Mesai Aktif
              </Button>
            )}

            {/* Gün Sonu butonu */}
            {canRunNightAudit && (
              <Button
                variant="outlined"
                size="small"
                color="warning"
                startIcon={<NightsStayIcon />}
                onClick={() => setNightAuditDialogOpen(true)}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.8125rem',
                  borderRadius: 2,
                  mr: 0.5,
                }}
              >
                Gün Sonu
              </Button>
            )}

            {/* Bildirim ikonu */}
            <IconButton sx={{ color: 'text.secondary' }}>
              <Badge badgeContent={3} color="error" max={99}>
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* Kullanıcı profil alanı */}
            <Box
              onClick={handleProfileClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                cursor: 'pointer',
                p: '6px 12px',
                borderRadius: 2,
                '&:hover': { bgcolor: 'action.hover' },
                transition: 'background-color 0.2s ease',
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>

              {!isMobile && (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}
                  >
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', lineHeight: 1.2 }}
                  >
                    {ROLE_LABELS[user?.role || ''] || user?.role}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Profil dropdown menüsü */}
            <Menu
              anchorEl={anchorEl}
              open={profileMenuOpen}
              onClose={handleProfileClose}
              onClick={handleProfileClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    borderRadius: 2,
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {ROLE_LABELS[user?.role || '']}
                </Typography>
              </Box>
              <Divider />

              <MenuItem onClick={handleProfileClose}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Profilim</ListItemText>
              </MenuItem>

              <MenuItem onClick={handleProfileClose}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Ayarlar</ListItemText>
              </MenuItem>

              <Divider />

              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText
                  primaryTypographyProps={{ color: 'error.main' }}
                >
                  Çıkış Yap
                </ListItemText>
              </MenuItem>
            </Menu>
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
            {/* Listeye dön */}
            {activeTabIndex !== -1 && onBackToList && (
              <Chip
                icon={<ArrowBackIcon sx={{ fontSize: 14 }} />}
                label={backLabel}
                size="small"
                variant="outlined"
                onClick={onBackToList}
                sx={{
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  mr: 0.5,
                  flexShrink: 0,
                }}
              />
            )}

            {/* Sekme butonları */}
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
                    '&:hover': {
                      bgcolor: isActive ? 'primary.dark' : 'action.hover',
                    },
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onTabClose(e, index);
                      }}
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

      {/* Mesai Devir Dialog */}
      <Dialog
        open={shiftDialogOpen}
        onClose={() => setShiftDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SwapHorizIcon color="primary" />
          Mesai Devret
        </DialogTitle>
        <DialogContent>
          {!selectedEmployee ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Mesaiyi devredeceğiniz personeli seçin:
              </Typography>
              <List disablePadding>
                {availableEmployees.map((emp) => (
                  <ListItemButton
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <ListItemIcon>
                      <PersonIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={emp.name}
                      secondary={emp.role}
                      primaryTypographyProps={{ fontWeight: 500 }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {selectedEmployee.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bu personele mesaiyi devretmek istediğinize emin misiniz?
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!selectedEmployee ? (
            <Button onClick={() => setShiftDialogOpen(false)} color="inherit">
              İptal
            </Button>
          ) : (
            <>
              <Button onClick={() => setSelectedEmployee(null)} color="inherit">
                Geri
              </Button>
              <Button onClick={handleShiftConfirm} variant="contained" color="primary">
                Devret
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Gün Sonu Dialog */}
      <NightAuditDialog
        open={nightAuditDialogOpen}
        onClose={() => setNightAuditDialogOpen(false)}
      />
    </>
  );
};

export default Header;
