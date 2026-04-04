/**
 * RoomMoveDialog — Oda Taşıma Dialog'u
 *
 * Dolu bir odadaki misafirleri başka bir odaya taşır.
 * Müsait odalar listesi gösterilir, kirli/dolu odaya taşıma uyarısı verilir.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  SwapHoriz as SwapIcon,
  Hotel as HotelIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { ROOM_STATUS, ROOM_STATUS_LABELS } from '../../utils/constants';

interface RoomInfo {
  id: number;
  roomNumber: string;
  status: string;
  floor: number;
  bedType: string;
}

interface RoomMoveDialogProps {
  open: boolean;
  onClose: () => void;
  sourceRoom: { id: number; roomNumber: string } | null;
  rooms: RoomInfo[];
  onMove: (fromRoomId: number, toRoomId: number) => Promise<void>;
}

const STATUS_COLORS: Record<string, 'success' | 'error' | 'warning' | 'default' | 'info'> = {
  available: 'success',
  occupied: 'error',
  dirty: 'warning',
  maintenance: 'info',
  blocked: 'default',
};

const RoomMoveDialog: React.FC<RoomMoveDialogProps> = ({
  open,
  onClose,
  sourceRoom,
  rooms,
  onMove,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  const handleOpen = () => {
    setSearchValue('');
    setSelectedRoomId(null);
    setLoading(false);
    setWarning('');
  };

  const otherRooms = rooms.filter((r) => sourceRoom && r.id !== sourceRoom.id);

  const filteredRooms = searchValue
    ? otherRooms.filter((r) => r.roomNumber.includes(searchValue))
    : otherRooms;

  // Müsait odalar üstte
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    if (a.status === ROOM_STATUS.AVAILABLE && b.status !== ROOM_STATUS.AVAILABLE) return -1;
    if (a.status !== ROOM_STATUS.AVAILABLE && b.status === ROOM_STATUS.AVAILABLE) return 1;
    return a.roomNumber.localeCompare(b.roomNumber);
  });

  const handleSelect = (room: RoomInfo) => {
    setSelectedRoomId(room.id);
    if (room.status === ROOM_STATUS.OCCUPIED) {
      setWarning(`Oda ${room.roomNumber} şu an dolu! Bu odaya taşıma yapılamaz.`);
    } else if (room.status === ROOM_STATUS.DIRTY) {
      setWarning(`Oda ${room.roomNumber} kirli durumda. Yine de taşımak istiyor musunuz?`);
    } else if (room.status === ROOM_STATUS.MAINTENANCE) {
      setWarning(`Oda ${room.roomNumber} bakımda. Taşıma önerilmez.`);
    } else if (room.status === ROOM_STATUS.BLOCKED) {
      setWarning(`Oda ${room.roomNumber} bloke edilmiş. Bu odaya taşıma yapılamaz.`);
    } else {
      setWarning('');
    }
  };

  const selectedRoom = otherRooms.find((r) => r.id === selectedRoomId);
  const isBlocked = selectedRoom?.status === ROOM_STATUS.OCCUPIED || selectedRoom?.status === ROOM_STATUS.BLOCKED;

  const handleMove = async () => {
    if (!sourceRoom || !selectedRoomId) return;
    setLoading(true);
    try {
      await onMove(sourceRoom.id, selectedRoomId);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      setSnackbar({ open: true, message: axiosErr?.response?.data?.error || axiosErr?.message || 'Taşıma yapılamadı', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      TransitionProps={{ onEnter: handleOpen }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SwapIcon color="primary" />
        Oda Taşı {sourceRoom ? `— Oda ${sourceRoom.roomNumber}` : ''}
      </DialogTitle>
      <DialogContent>
        <TextField
          label="Oda Numarası Ara"
          fullWidth
          size="small"
          value={searchValue}
          onChange={(e) => { setSearchValue(e.target.value); setSelectedRoomId(null); setWarning(''); }}
          autoFocus
          sx={{ mt: 1, mb: 2 }}
        />

        {warning && (
          <Alert severity={isBlocked ? 'error' : 'warning'} sx={{ mb: 1.5 }}>
            {warning}
          </Alert>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Taşınacak odayı seçin:
        </Typography>

        <List dense sx={{ maxHeight: 280, overflow: 'auto', border: '1px solid #E0E0E0', borderRadius: 1 }}>
          {sortedRooms.length > 0 ? sortedRooms.map((room) => (
            <ListItemButton
              key={room.id}
              selected={selectedRoomId === room.id}
              onClick={() => handleSelect(room)}
              disabled={room.status === ROOM_STATUS.OCCUPIED || room.status === ROOM_STATUS.BLOCKED}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {room.status === ROOM_STATUS.AVAILABLE ? (
                  <CheckCircleIcon fontSize="small" color="success" />
                ) : (
                  <HotelIcon fontSize="small" color="disabled" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography fontWeight={600}>Oda {room.roomNumber}</Typography>
                    <Chip
                      label={ROOM_STATUS_LABELS[room.status] || room.status}
                      size="small"
                      color={STATUS_COLORS[room.status] || 'default'}
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                }
                secondary={`Kat ${room.floor}`}
              />
            </ListItemButton>
          )) : (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              Oda bulunamadı.
            </Typography>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={loading}>Vazgeç</Button>
        <Button
          variant="contained"
          onClick={handleMove}
          disabled={loading || !selectedRoomId || isBlocked}
          startIcon={loading ? <CircularProgress size={16} /> : <SwapIcon />}
        >
          Taşı
        </Button>
      </DialogActions>
    </Dialog>

    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled">
        {snackbar.message}
      </Alert>
    </Snackbar>
    </>
  );
};

export default RoomMoveDialog;
