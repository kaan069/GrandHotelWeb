/**
 * BMS Dashboard — Bina Yönetim Sistemi Ana Sayfası
 *
 * Dashboard'daki oda grid'inin aynısını kullanır ama oda detayında
 * folio/misafir yerine klima, ışık, enerji panelleri gösterir.
 *
 * Erişim: Sadece isBmsAdmin (staffNumber=0000) kullanıcıları
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  ThermostatAuto as ThermostatIcon,
  Bolt as BoltIcon,
  Warning as WarningIcon,
  Wifi as WifiIcon,
} from '@mui/icons-material';

import usePageTabs from '../../hooks/usePageTabs';
import useRoomWebSocket from '../../hooks/useRoomWebSocket';
import { ROOM_STATUS, ROOM_STATUS_LABELS, ROOM_STATUS_COLORS, RoomTab, RoomGuest } from '../../utils/constants';
import { roomsApi } from '../../api/services';
import type { ApiRoom, ApiRoomMinibarItem } from '../../api/services';
import BmsRoomDetail from '../../components/bms/BmsRoomDetail';

/** Oda tipi — Dashboard ile aynı yapı */
interface Room {
  id: number;
  roomNumber: string;
  bedType: string;
  floor: number;
  capacity: number;
  view: string;
  price: number;
  status: string;
  guestName?: string;
  guests?: RoomGuest[];
  notes?: string;
  reservationId?: number | null;
  reservationCheckIn?: string | null;
  reservationCheckOut?: string | null;
  reservationStatus?: string | null;
  beds?: { type: string }[];
  minibar?: ApiRoomMinibarItem[];
}

const mapApiRoom = (r: ApiRoom): Room => ({
  id: r.id,
  roomNumber: r.roomNumber,
  bedType: r.bedType,
  floor: r.floor,
  capacity: r.capacity,
  view: r.view,
  price: parseFloat(r.price) || 0,
  status: r.status,
  guestName: r.guestName || undefined,
  guests: r.guests?.map((g) => ({
    guestId: g.guestId, guestName: g.guestName, phone: g.phone,
    checkIn: g.checkIn, checkOut: g.checkOut ?? undefined, isActive: g.isActive,
  })),
  notes: r.notes || undefined,
  reservationId: r.reservationId,
  reservationCheckIn: r.reservationCheckIn,
  reservationCheckOut: r.reservationCheckOut,
  reservationStatus: r.reservationStatus,
  beds: r.beds,
  minibar: r.minibar,
});

/** Oda kartı renk haritası — BMS odası için */
const statusBgColor: Record<string, string> = {
  available: '#E8F5E9',
  occupied: '#FFEBEE',
  dirty: '#FFF3E0',
  maintenance: '#E3F2FD',
  blocked: '#F5F5F5',
};

const BmsDashboard: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<string>('');

  /* Tab sistemi */
  const [openTabs, setOpenTabs] = useState<RoomTab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1);

  /* Odaları yükle */
  useEffect(() => {
    roomsApi.getAll()
      .then((data) => setRooms(data.map(mapApiRoom)))
      .catch(() => {});
  }, []);

  /* WebSocket */
  useRoomWebSocket({
    onRoomUpdate: (updatedApiRoom) => {
      const updated = mapApiRoom(updatedApiRoom);
      setRooms((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    },
  });

  /* Kat filtresi */
  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);
  const filteredRooms = rooms.filter((r) => {
    if (selectedFloor && r.floor !== Number(selectedFloor)) return false;
    return true;
  });

  /* Tab işlemleri */
  const handleRoomClick = (room: Room) => {
    const existingIndex = openTabs.findIndex((t) => t.roomId === room.id);
    if (existingIndex !== -1) {
      setActiveTabIndex(existingIndex);
    } else {
      const newTab: RoomTab = { roomId: room.id, roomNumber: room.roomNumber };
      setOpenTabs((prev) => [...prev, newTab]);
      setActiveTabIndex(openTabs.length);
    }
  };

  const handleTabClose = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setOpenTabs((prev) => prev.filter((_, i) => i !== index));
    if (activeTabIndex === index) {
      setActiveTabIndex(-1);
    } else if (activeTabIndex > index) {
      setActiveTabIndex((prev) => prev - 1);
    }
  };

  const handleBackToList = useCallback(() => setActiveTabIndex(-1), []);

  const activeRoom = activeTabIndex >= 0 && activeTabIndex < openTabs.length
    ? rooms.find((r) => r.id === openTabs[activeTabIndex].roomId)
    : null;

  /* Header tab'ları */
  const headerTabs = openTabs.map((tab) => ({
    key: `bms-room-${tab.roomId}`,
    label: `Oda ${tab.roomNumber}`,
  }));

  usePageTabs({
    tabs: headerTabs,
    activeTabIndex,
    onTabChange: setActiveTabIndex,
    onTabClose: handleTabClose,
    onBackToList: handleBackToList,
    backLabel: 'Bina Yönetimi',
  });

  /* İstatistikler */
  const occupiedRooms = rooms.filter((r) => r.status === ROOM_STATUS.OCCUPIED).length;
  const totalRooms = rooms.length;

  /* Aktif sekme varsa → BMS Oda Detay */
  if (activeTabIndex >= 0 && activeRoom) {
    return (
      <BmsRoomDetail
        room={activeRoom}
        onClose={handleBackToList}
      />
    );
  }

  /* Dashboard Grid */
  return (
    <Box>
      {/* Özet kartları */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ bgcolor: '#E3F2FD' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ThermostatIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">Dolu Oda</Typography>
                  <Typography variant="h6" fontWeight={700}>{occupiedRooms} / {totalRooms}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ bgcolor: '#E8F5E9' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WifiIcon color="success" />
                <Box>
                  <Typography variant="caption" color="text.secondary">Online Cihaz</Typography>
                  <Typography variant="h6" fontWeight={700}>-</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ bgcolor: '#FFF3E0' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" />
                <Box>
                  <Typography variant="caption" color="text.secondary">Aktif Alarm</Typography>
                  <Typography variant="h6" fontWeight={700}>-</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Card sx={{ bgcolor: '#F3E5F5' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BoltIcon sx={{ color: '#7B1FA2' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">Toplam Enerji</Typography>
                  <Typography variant="h6" fontWeight={700}>- kWh</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Kat filtresi */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>Oda Cihaz Durumları</Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Kat</InputLabel>
          <Select
            value={selectedFloor}
            label="Kat"
            onChange={(e: SelectChangeEvent) => setSelectedFloor(e.target.value)}
          >
            <MenuItem value="">Tüm Katlar</MenuItem>
            {floors.map((f) => (
              <MenuItem key={f} value={String(f)}>Kat {f}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Oda Grid */}
      <Grid container spacing={1.5}>
        {filteredRooms.map((room) => (
          <Grid key={room.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
            <Card
              onClick={() => handleRoomClick(room)}
              sx={{
                cursor: 'pointer',
                bgcolor: statusBgColor[room.status] || '#FAFAFA',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
              }}
            >
              <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {room.roomNumber}
                  </Typography>
                  <Chip
                    label={ROOM_STATUS_LABELS[room.status] || room.status}
                    color={ROOM_STATUS_COLORS[room.status] || 'default'}
                    size="small"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                </Box>

                {/* BMS bilgileri — mock */}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  <Chip
                    icon={<ThermostatIcon sx={{ fontSize: 14 }} />}
                    label="22°C"
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                  <Chip
                    icon={<BoltIcon sx={{ fontSize: 14 }} />}
                    label="0.3 kW"
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                </Box>

                {room.guestName && (
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ mt: 0.5, display: 'block' }}>
                    {room.guestName}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default BmsDashboard;
