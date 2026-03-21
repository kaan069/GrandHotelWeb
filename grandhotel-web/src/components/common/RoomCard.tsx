/**
 * RoomCard Bileşeni
 *
 * Dashboard'da odaları görsel kutucuklar olarak gösterir.
 * Her kutucuk oda durumuna göre renklendirilir ve sağ üstte
 * 3 nokta menüsü ile hızlı aksiyonlar sunar.
 *
 * Renk Şeması:
 *   available  → Yeşil ton
 *   occupied   → Kırmızı ton
 *   dirty      → Kahverengi ton
 *   maintenance → Mavi ton
 *   blocked    → Gri ton
 *
 * Props:
 *   - room (object, zorunlu): Oda verisi { roomNumber, bedType, floor, status, guestName? }
 *   - onStatusChange (function): Durum değişikliği callback'i (roomId, newStatus)
 *   - onAction (function): Ek aksiyon callback'i (roomId, actionType)
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  CleaningServices as CleanIcon,
  SwapHoriz as SwapIcon,
  Build as BuildIcon,
  Block as BlockIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

import { ROOM_STATUS, ROOM_STATUS_LABELS, BED_TYPE_LABELS } from '../../utils/constants';

interface RoomGuestInfo {
  guestId: number;
  guestName: string;
  phone?: string;
}

interface Room {
  id: string | number;
  roomNumber: string | number;
  bedType: string;
  floor: string | number;
  status: string;
  guestName?: string;
  guests?: RoomGuestInfo[];
}

interface StatusColorConfig {
  bg: string;
  border: string;
  text: string;
  label: string;
}

interface RoomCardMenuItem {
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

interface RoomCardProps {
  room: Room;
  onStatusChange?: (roomId: string | number, newStatus: string) => void;
  onAction?: (roomId: string | number, actionType: string) => void;
  onClick?: (room: Room) => void;
}

/**
 * Oda durumuna göre kutucuk renk şeması
 * Her durum için arka plan, kenarlık ve metin rengi tanımlanır.
 */
const STATUS_COLORS: Record<string, StatusColorConfig> = {
  [ROOM_STATUS.AVAILABLE]: {
    bg: '#E8F5E9',
    border: '#2E7D32',
    text: '#1B5E20',
    label: '#2E7D32',
  },
  [ROOM_STATUS.OCCUPIED]: {
    bg: '#FFEBEE',
    border: '#C62828',
    text: '#B71C1C',
    label: '#C62828',
  },
  [ROOM_STATUS.DIRTY]: {
    bg: '#EFEBE9',
    border: '#795548',
    text: '#4E342E',
    label: '#795548',
  },
  [ROOM_STATUS.MAINTENANCE]: {
    bg: '#E3F2FD',
    border: '#1565C0',
    text: '#0D47A1',
    label: '#1565C0',
  },
  [ROOM_STATUS.BLOCKED]: {
    bg: '#ECEFF1',
    border: '#546E7A',
    text: '#37474F',
    label: '#546E7A',
  },
};

const RoomCard: React.FC<RoomCardProps> = ({ room, onStatusChange, onAction, onClick }) => {
  /* 3 nokta menüsü açık/kapalı durumu */
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const colors = STATUS_COLORS[room.status] || STATUS_COLORS[ROOM_STATUS.AVAILABLE];

  /** Menüyü aç */
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>): void => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  /** Menüyü kapat */
  const handleMenuClose = (): void => {
    setAnchorEl(null);
  };

  /** Durum değiştirme aksiyonu */
  const handleStatusChange = (newStatus: string): void => {
    handleMenuClose();
    if (onStatusChange) {
      onStatusChange(room.id, newStatus);
    }
  };

  /** Genel aksiyon (taşı vb.) */
  const handleAction = (actionType: string): void => {
    handleMenuClose();
    if (onAction) {
      onAction(room.id, actionType);
    }
  };

  /**
   * Menü seçeneklerini oda durumuna göre oluştur.
   * Mevcut duruma göre uygun aksiyonlar gösterilir.
   */
  const getMenuItems = (): RoomCardMenuItem[] => {
    const items: RoomCardMenuItem[] = [];

    /* Temizlik durumu değiştir */
    if (room.status === ROOM_STATUS.DIRTY) {
      items.push({
        label: 'Temiz Olarak İşaretle',
        icon: <CheckIcon fontSize="small" />,
        action: () => handleStatusChange(ROOM_STATUS.AVAILABLE),
      });
    } else if (room.status === ROOM_STATUS.AVAILABLE) {
      items.push({
        label: 'Kirli Olarak İşaretle',
        icon: <CleanIcon fontSize="small" />,
        action: () => handleStatusChange(ROOM_STATUS.DIRTY),
      });
    }

    /* Oda taşı */
    if (room.status === ROOM_STATUS.OCCUPIED) {
      items.push({
        label: 'Oda Taşı',
        icon: <SwapIcon fontSize="small" />,
        action: () => handleAction('move'),
      });
    }

    /* Bakıma al / bakımdan çıkar */
    if (room.status === ROOM_STATUS.MAINTENANCE) {
      items.push({
        label: 'Bakımdan Çıkar',
        icon: <CheckIcon fontSize="small" />,
        action: () => handleStatusChange(ROOM_STATUS.AVAILABLE),
      });
    } else if (room.status !== ROOM_STATUS.OCCUPIED) {
      items.push({
        label: 'Bakıma Al',
        icon: <BuildIcon fontSize="small" />,
        action: () => handleStatusChange(ROOM_STATUS.MAINTENANCE),
      });
    }

    /* Bloke et / blokeyi kaldır */
    if (room.status === ROOM_STATUS.BLOCKED) {
      items.push({
        label: 'Blokeyi Kaldır',
        icon: <CheckIcon fontSize="small" />,
        action: () => handleStatusChange(ROOM_STATUS.AVAILABLE),
      });
    } else if (room.status !== ROOM_STATUS.OCCUPIED) {
      items.push({
        label: 'Bloke Et',
        icon: <BlockIcon fontSize="small" />,
        action: () => handleStatusChange(ROOM_STATUS.BLOCKED),
      });
    }

    return items;
  };

  const menuItems = getMenuItems();

  return (
    <Box
      onClick={() => onClick?.(room)}
      sx={{
        width: 175,
        minHeight: 110,
        borderRadius: 2,
        border: `2px solid ${colors.border}`,
        bgcolor: colors.bg,
        position: 'relative',
        p: 1.5,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 4px 12px ${colors.border}40`,
        },
      }}
    >
      {/* 3 nokta menü butonu - sağ üst */}
      <IconButton
        size="small"
        onClick={handleMenuOpen}
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          p: 0.3,
          color: colors.text,
          '&:hover': { bgcolor: `${colors.border}20` },
        }}
      >
        <MoreVertIcon sx={{ fontSize: 18 }} />
      </IconButton>

      {/* Oda numarası */}
      <Typography
        sx={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: colors.text,
          lineHeight: 1.2,
          textAlign: 'center',
        }}
      >
        {room.roomNumber}
      </Typography>
      {room.guests && room.guests.length > 0 && (
        <Typography
          sx={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color: colors.text,
            opacity: 0.85,
            textAlign: 'center',
          }}
        >
          {room.guests.length} Kişi
        </Typography>
      )}

      {/* Yatak tipi */}
      <Typography
        sx={{
          fontSize: '0.7rem',
          color: colors.text,
          opacity: 0.8,
          mt: 0.5,
        }}
      >
        {(BED_TYPE_LABELS as Record<string, string>)[room.bedType] || room.bedType}
      </Typography>

      {/* Kat bilgisi */}
      <Typography
        sx={{
          fontSize: '0.7rem',
          color: colors.text,
          opacity: 0.7,
        }}
      >
        Kat: {room.floor}
      </Typography>

      {/* Misafir adı (dolu ise) */}
      {room.status === ROOM_STATUS.OCCUPIED && (room.guests?.length || room.guestName) && (
        <Typography
          sx={{
            fontSize: '0.65rem',
            color: colors.text,
            fontWeight: 600,
            mt: 0.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {room.guests && room.guests.length > 1
            ? `${room.guests[0].guestName} +${room.guests.length - 1}`
            : room.guests?.[0]?.guestName || room.guestName}
        </Typography>
      )}

      {/* Durum etiketi - alt kısım */}
      <Box
        sx={{
          mt: 'auto',
          pt: 0.5,
        }}
      >
        <Typography
          sx={{
            fontSize: '0.65rem',
            fontWeight: 600,
            color: colors.label,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {ROOM_STATUS_LABELS[room.status]}
        </Typography>
      </Box>

      {/* Aksiyonlar menüsü */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={(e: React.SyntheticEvent | {}) => {
          if (e && 'stopPropagation' in e) (e as React.SyntheticEvent).stopPropagation();
          handleMenuClose();
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 200, mt: 0.5 } } }}
      >
        {menuItems.map((item, index) => (
          <MenuItem key={index} onClick={(e) => { e.stopPropagation(); item.action(); }} sx={{ fontSize: '0.875rem' }}>
            <ListItemIcon sx={{ color: 'text.secondary' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.875rem' }}>
              {item.label}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default RoomCard;
