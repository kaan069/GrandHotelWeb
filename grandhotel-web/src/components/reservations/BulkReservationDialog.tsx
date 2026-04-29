import React, { useState } from 'react';
import {
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip,
} from '@mui/material';
import { GroupWork as GroupIcon } from '@mui/icons-material';

import { formatCurrency, getLocalDateStr } from '../../utils/formatters';

interface Room {
  id: number;
  roomNumber: string;
  bedType: string;
  floor: number;
  price: number;
  status: string;
}

interface BulkReservationForm {
  groupName: string;
  contactPerson: string;
  phone: string;
  source: string;
  checkIn: string;
  checkOut: string;
}

interface BulkRoomFilter {
  floor: string;
  bedType: string;
}

export interface BulkReservationResult {
  groupName: string;
  contactPerson: string;
  phone: string;
  source: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  selectedRooms: { roomId: number; guestName: string }[];
}

interface BulkReservationDialogProps {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  onSave: (result: BulkReservationResult) => void;
}

const buildEmptyBulkForm = (): BulkReservationForm => ({
  groupName: '',
  contactPerson: '',
  phone: '',
  source: 'Acente',
  checkIn: getLocalDateStr(),
  checkOut: getLocalDateStr(1),
});

const BulkReservationDialog: React.FC<BulkReservationDialogProps> = ({ open, onClose, rooms, onSave }) => {
  const [form, setForm] = useState<BulkReservationForm>(buildEmptyBulkForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedRooms, setSelectedRooms] = useState<Set<number>>(new Set());
  const [roomGuests, setRoomGuests] = useState<Record<number, string>>({});
  const [roomFilter, setRoomFilter] = useState<BulkRoomFilter>({ floor: '', bedType: '' });

  const handleOpen = () => {
    setForm(buildEmptyBulkForm());
    setSelectedRooms(new Set());
    setRoomGuests({});
    setRoomFilter({ floor: '', bedType: '' });
    setErrors({});
  };

  const availableRooms = rooms.filter((r) => {
    if (r.status !== 'available') return false;
    if (roomFilter.floor && r.floor !== Number(roomFilter.floor)) return false;
    if (roomFilter.bedType && r.bedType !== roomFilter.bedType) return false;
    return true;
  });

  const toggleRoom = (roomId: number) => {
    setSelectedRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId); else next.add(roomId);
      return next;
    });
  };

  const toggleAllRooms = () => {
    const allIds = availableRooms.map((r) => r.id);
    const allSelected = allIds.every((id) => selectedRooms.has(id));
    if (allSelected) {
      setSelectedRooms(new Set());
    } else {
      setSelectedRooms(new Set(allIds));
    }
  };

  const nights = form.checkIn && form.checkOut
    ? Math.max(1, Math.round((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const totalPrice = rooms
    .filter((r) => selectedRooms.has(r.id))
    .reduce((sum, r) => sum + r.price * nights, 0);

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!form.groupName.trim()) errs.groupName = 'Grup adı zorunlu';
    if (!form.contactPerson.trim()) errs.contactPerson = 'İletişim kişisi zorunlu';
    if (!form.phone.trim()) errs.phone = 'Telefon zorunlu';
    if (!form.checkOut) errs.checkOut = 'Çıkış tarihi zorunlu';
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      errs.checkOut = 'Çıkış tarihi girişten sonra olmalı';
    }
    if (selectedRooms.size === 0) errs.rooms = 'En az 1 oda seçin';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    onSave({
      groupName: form.groupName.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: form.phone.trim(),
      source: form.source,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      nights,
      selectedRooms: Array.from(selectedRooms).map((roomId) => ({
        roomId,
        guestName: roomGuests[roomId]?.trim() || form.contactPerson.trim(),
      })),
    });

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { maxHeight: '90vh' } }}
      TransitionProps={{ onEnter: handleOpen }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon color="secondary" />
          <Typography variant="h6" component="span">Toplu Rezervasyon</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {/* Grup Bilgileri */}
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
          Grup Bilgileri
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Grup Adı"
              fullWidth
              size="small"
              required
              placeholder="Ör: Akdeniz Tur, ABC Firması"
              value={form.groupName}
              onChange={(e) => { setForm((p) => ({ ...p, groupName: e.target.value })); setErrors((p) => ({ ...p, groupName: '' })); }}
              error={!!errors.groupName}
              helperText={errors.groupName}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="İletişim Kişisi"
              fullWidth
              size="small"
              required
              value={form.contactPerson}
              onChange={(e) => { setForm((p) => ({ ...p, contactPerson: e.target.value })); setErrors((p) => ({ ...p, contactPerson: '' })); }}
              error={!!errors.contactPerson}
              helperText={errors.contactPerson}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Telefon"
              fullWidth
              size="small"
              required
              value={form.phone}
              onChange={(e) => { setForm((p) => ({ ...p, phone: e.target.value })); setErrors((p) => ({ ...p, phone: '' })); }}
              error={!!errors.phone}
              helperText={errors.phone}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Giriş Tarihi"
              fullWidth
              size="small"
              type="date"
              required
              value={form.checkIn}
              onChange={(e) => setForm((p) => ({ ...p, checkIn: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Çıkış Tarihi"
              fullWidth
              size="small"
              type="date"
              required
              value={form.checkOut}
              onChange={(e) => { setForm((p) => ({ ...p, checkOut: e.target.value })); setErrors((p) => ({ ...p, checkOut: '' })); }}
              error={!!errors.checkOut}
              helperText={errors.checkOut}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Kaynak"
              fullWidth
              size="small"
              select
              value={form.source}
              onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}
            >
              {['Acente', 'Telefon', 'Web', 'OTA', 'Walk-in'].map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {/* Oda Seçimi */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Oda Seçimi
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Kat"
              size="small"
              select
              value={roomFilter.floor}
              onChange={(e) => setRoomFilter((p) => ({ ...p, floor: e.target.value }))}
              sx={{ minWidth: 80 }}
            >
              <MenuItem value="">Tümü</MenuItem>
              {Array.from(new Set(rooms.map((r) => r.floor))).sort().map((f) => (
                <MenuItem key={f} value={String(f)}>{f}. Kat</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Yatak"
              size="small"
              select
              value={roomFilter.bedType}
              onChange={(e) => setRoomFilter((p) => ({ ...p, bedType: e.target.value }))}
              sx={{ minWidth: 100 }}
            >
              <MenuItem value="">Tümü</MenuItem>
              <MenuItem value="single">Tek Kişilik</MenuItem>
              <MenuItem value="double">Çift Kişilik</MenuItem>
              <MenuItem value="twin">İki Tek Yataklı</MenuItem>
              <MenuItem value="king">King Size</MenuItem>
            </TextField>
          </Box>
        </Box>

        {errors.rooms && (
          <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>
            {errors.rooms}
          </Typography>
        )}

        <FormControlLabel
          control={
            <Checkbox
              checked={availableRooms.length > 0 && availableRooms.every((r) => selectedRooms.has(r.id))}
              indeterminate={availableRooms.some((r) => selectedRooms.has(r.id)) && !availableRooms.every((r) => selectedRooms.has(r.id))}
              onChange={toggleAllRooms}
              size="small"
            />
          }
          label={<Typography variant="body2" fontWeight={600}>Tümünü Seç ({availableRooms.length} müsait oda)</Typography>}
          sx={{ mb: 1 }}
        />

        <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
          {availableRooms.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Filtreye uygun müsait oda bulunamadı.
            </Typography>
          ) : (
            availableRooms.map((room) => {
              const isSelected = selectedRooms.has(room.id);
              return (
                <Box
                  key={room.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 0.75,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: isSelected ? 'action.selected' : 'inherit',
                    '&:last-child': { borderBottom: 0 },
                    '&:hover': { bgcolor: isSelected ? 'action.selected' : 'action.hover' },
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleRoom(room.id)}
                    size="small"
                  />
                  <Chip label={room.roomNumber} size="small" variant="outlined" sx={{ fontWeight: 600, minWidth: 50 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 50 }}>
                    {room.floor}. Kat
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90 }}>
                    {room.bedType === 'single' ? 'Tek' : room.bedType === 'double' ? 'Çift' : room.bedType === 'twin' ? 'İki Tek' : room.bedType === 'king' ? 'King' : room.bedType}
                  </Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ minWidth: 70 }}>
                    {formatCurrency(room.price)}
                  </Typography>
                  {isSelected && (
                    <TextField
                      placeholder="Misafir adı (opsiyonel)"
                      size="small"
                      value={roomGuests[room.id] || ''}
                      onChange={(e) => setRoomGuests((p) => ({ ...p, [room.id]: e.target.value }))}
                      sx={{ ml: 'auto', minWidth: 180 }}
                      variant="standard"
                    />
                  )}
                </Box>
              );
            })
          )}
        </Box>

        {/* Özet */}
        {selectedRooms.size > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {selectedRooms.size} oda seçildi {nights > 0 && `• ${nights} gece`}
            </Typography>
            {nights > 0 && (
              <Typography variant="body1" fontWeight={700} color="primary">
                Toplam: {formatCurrency(totalPrice)}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">İptal</Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleSave}
          disabled={selectedRooms.size === 0}
        >
          {selectedRooms.size > 0 ? `${selectedRooms.size} Rezervasyon Oluştur` : 'Oda Seçin'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkReservationDialog;
