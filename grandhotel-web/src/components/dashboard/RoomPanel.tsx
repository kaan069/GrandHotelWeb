import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Hotel as HotelIcon,
  ListAlt as ListAltIcon,
  CalendarMonth as CalendarIcon,
  Assessment as AssessmentIcon,
  CleaningServices as CleaningIcon,
} from '@mui/icons-material';

import { RoomCard } from '../common';

interface RoomPanelRoom {
  id: number;
  roomNumber: string;
  bedType: string;
  floor: number;
  status: string;
  guestName?: string;
  guests?: { guestId: number | null; guestName: string; phone?: string }[];
  reservationStatus?: string | null;
  reservationOwnerName?: string | null;
  reservationCheckIn?: string | null;
  reservationCheckOut?: string | null;
}

interface RoomPanelProps {
  rooms: RoomPanelRoom[];
  filteredRooms: RoomPanelRoom[];
  floors: number[];
  selectedFloor: string;
  onFloorChange: (value: string) => void;
  cleaningFilter: string;
  onCleaningFilterChange: (value: string) => void;
  occupancyFilter: string;
  onOccupancyFilterChange: (value: string) => void;
  onStatusChange: (roomId: string | number, newStatus: string) => void;
  onRoomAction: (roomId: string | number, actionType: string) => void;
  onRoomClick: (room: { id: string | number; roomNumber: string | number }) => void;
  onReportOpen: () => void;
  onHousekeepingOpen: () => void;
  onNavigate: (path: string) => void;
}

const RoomPanel: React.FC<RoomPanelProps> = ({
  rooms,
  filteredRooms,
  floors,
  selectedFloor,
  onFloorChange,
  cleaningFilter,
  onCleaningFilterChange,
  occupancyFilter,
  onOccupancyFilterChange,
  onStatusChange,
  onRoomAction,
  onRoomClick,
  onReportOpen,
  onHousekeepingOpen,
  onNavigate,
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HotelIcon color="primary" fontSize="small" />
            Oda Durumları
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ListAltIcon />}
              onClick={() => onNavigate('/reservations')}
            >
              Rezervasyon Listesi
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CalendarIcon />}
              onClick={() => onNavigate('/reservations/chart')}
            >
              Rezervasyon Çizelgesi
            </Button>
            <Button
              variant="contained"
              size="small"
              color="info"
              startIcon={<AssessmentIcon />}
              onClick={onReportOpen}
            >
              Rapor Çıkar
            </Button>
            <Button
              variant="contained"
              size="small"
              color="secondary"
              startIcon={<CleaningIcon />}
              onClick={onHousekeepingOpen}
            >
              Housekeeping
            </Button>
          </Box>
        </Box>

        {/* Kat filtresi */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Kat Seçimi</InputLabel>
            <Select
              value={selectedFloor}
              label="Kat Seçimi"
              onChange={(e) => onFloorChange(e.target.value as string)}
            >
              <MenuItem value="">Tüm Katlar ({rooms.length})</MenuItem>
              {floors.map((f) => {
                const count = rooms.filter((r) => r.floor === f).length;
                return (
                  <MenuItem key={f} value={String(f)}>
                    {f}. Kat ({count})
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>

        {/* Temizlik & Doluluk filtreleri */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mr: 0.5 }}>
              Temizlik:
            </Typography>
            {([
              { value: 'all', label: 'Hepsi' },
              { value: 'clean', label: 'Temiz' },
              { value: 'dirty', label: 'Kirli' },
            ] as const).map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                size="small"
                variant={cleaningFilter === opt.value ? 'filled' : 'outlined'}
                color={cleaningFilter === opt.value ? (opt.value === 'dirty' ? 'warning' : opt.value === 'clean' ? 'success' : 'primary') : 'default'}
                onClick={() => onCleaningFilterChange(opt.value)}
                sx={{ fontWeight: cleaningFilter === opt.value ? 600 : 400, cursor: 'pointer' }}
              />
            ))}
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mr: 0.5 }}>
              Oda Durumu:
            </Typography>
            {([
              { value: 'all', label: 'Hepsi' },
              { value: 'empty', label: 'Boş' },
              { value: 'occupied', label: 'Dolu' },
            ] as const).map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                size="small"
                variant={occupancyFilter === opt.value ? 'filled' : 'outlined'}
                color={occupancyFilter === opt.value ? (opt.value === 'occupied' ? 'error' : opt.value === 'empty' ? 'success' : 'primary') : 'default'}
                onClick={() => onOccupancyFilterChange(opt.value)}
                sx={{ fontWeight: occupancyFilter === opt.value ? 600 : 400, cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>

        {/* Renk açıklaması (legend) */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          {[
            { color: '#2E7D32', bg: '#E8F5E9', label: 'Müsait' },
            { color: '#C62828', bg: '#FFEBEE', label: 'Dolu' },
            { color: '#795548', bg: '#EFEBE9', label: 'Kirli' },
            { color: '#1565C0', bg: '#E3F2FD', label: 'Bakımda' },
            { color: '#546E7A', bg: '#ECEFF1', label: 'Bloke' },
          ].map((item) => (
            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: item.bg,
                  border: `2px solid ${item.color}`,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Oda kutucukları */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onStatusChange={onStatusChange}
              onAction={onRoomAction}
              onClick={onRoomClick}
            />
          ))}
        </Box>

        {filteredRooms.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {rooms.length === 0
              ? 'Henüz oda eklenmemiş. Oda Tipi Ayarları sayfasından oda ekleyebilirsiniz.'
              : 'Seçili katta oda bulunamadı.'}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default RoomPanel;
