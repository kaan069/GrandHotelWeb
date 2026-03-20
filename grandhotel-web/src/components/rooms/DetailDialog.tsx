/**
 * DetailDialog - Oda Detayları Dialog'u
 *
 * Odanın fiziksel bilgilerini gösterir: numara, kat, yatak tipi, kapasite, manzara, fiyat.
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

import {
  ROOM_STATUS_LABELS,
  BED_TYPE_LABELS,
  VIEW_TYPE_LABELS,
  ROOM_STATUS_COLORS,
} from '../../utils/constants';
import { StatusBadge } from '../common';

interface RoomInfo {
  id: string | number;
  roomNumber: string | number;
  bedType: string;
  floor: string | number;
  capacity?: number;
  view?: string;
  price?: number;
  status: string;
  guestName?: string;
  features?: string[];
}

interface DetailDialogProps {
  open: boolean;
  room: RoomInfo | null;
  onClose: () => void;
}

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value}</Typography>
  </Box>
);

const DetailDialog: React.FC<DetailDialogProps> = ({ open, room, onClose }) => {
  if (!room) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <InfoIcon color="primary" />
        Oda {room.roomNumber} - Detaylar
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <InfoRow label="Oda Numarası" value={room.roomNumber} />
          <Divider />
          <InfoRow label="Kat" value={room.floor} />
          <Divider />
          <InfoRow
            label="Yatak Tipi"
            value={BED_TYPE_LABELS[room.bedType] || room.bedType}
          />
          <Divider />
          {room.capacity !== undefined && (
            <>
              <InfoRow label="Kapasite" value={`${room.capacity} kişi`} />
              <Divider />
            </>
          )}
          {room.view && (
            <>
              <InfoRow
                label="Manzara"
                value={VIEW_TYPE_LABELS[room.view] || room.view}
              />
              <Divider />
            </>
          )}
          {room.price !== undefined && (
            <>
              <InfoRow
                label="Gecelik Fiyat"
                value={`${room.price.toLocaleString('tr-TR')} ₺`}
              />
              <Divider />
            </>
          )}
          <InfoRow
            label="Durum"
            value={
              <StatusBadge
                status={room.status}
                type="room"
                size="small"
              />
            }
          />
          {room.guestName && (
            <>
              <Divider />
              <InfoRow label="Misafir" value={room.guestName} />
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">Kapat</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetailDialog;
