/**
 * ProfileMenu — Kullanıcı profil avatarı + dropdown menü
 */

import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

import { ROLE_LABELS } from '../../utils/constants';
import useAuth from '../../hooks/useAuth';

const ProfileMenu: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => { handleClose(); logout(); };

  return (
    <>
      <Box
        onClick={handleClick}
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
          sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.875rem', fontWeight: 600 }}
        >
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </Avatar>

        {!isMobile && (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
              {ROLE_LABELS[user?.role || ''] || user?.role}
            </Typography>
          </Box>
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: { mt: 1, minWidth: 200, borderRadius: 2, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)' },
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
        <MenuItem onClick={handleClose}>
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Profilim</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Ayarlar</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ color: 'error.main' }}>Çıkış Yap</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ProfileMenu;
