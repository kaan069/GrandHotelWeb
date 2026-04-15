/**
 * Rezervasyon Çizelgesi Sayfası
 *
 * Takvim görünümünde tüm odalar ve günler gösterilir.
 * Üstte günler, yanda odalar listelenir.
 * Hücreye tıklayınca o oda+tarih kombinasyonuyla sekme açılır.
 * Mevcut rezervasyonlar renkli bloklar olarak gösterilir.
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Paper, Box, CircularProgress, Typography } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

import { PageHeader } from '../../components/common';
import RoomDetailContent from '../../components/rooms/RoomDetailContent';
import { RoomTabBar, ChartNavBar, ChartGrid, VISIBLE_DAYS } from '../../components/reservations/reservationchart';
import { roomsApi, reservationsApi } from '../../api/services';
import type { ApiRoom, ApiReservation } from '../../api/services';
import useRoomWebSocket from '../../hooks/useRoomWebSocket';

dayjs.locale('tr');

/* ==================== TİPLER ==================== */

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
  guests?: { guestId: number; guestName: string; phone: string }[];
  notes?: string;
  reservationId?: number | null;
  reservationCheckIn?: string | null;
  reservationCheckOut?: string | null;
  reservationCompanyId?: number | null;
  reservationAgencyId?: number | null;
  reservationAgencyCode?: string | null;
  beds?: { type: string }[];
}

interface RoomTab {
  roomId: number;
  roomNumber: string;
  checkIn?: string;
  checkOut?: string;
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
  guests: r.guests?.map((g) => ({ guestId: g.guestId, guestName: g.guestName, phone: g.phone })),
  notes: r.notes || undefined,
  reservationId: r.reservationId,
  reservationCheckIn: r.reservationCheckIn,
  reservationCheckOut: r.reservationCheckOut,
  reservationCompanyId: r.reservationCompanyId,
  reservationAgencyId: r.reservationAgencyId,
  reservationAgencyCode: r.reservationAgencyCode,
  beds: r.beds,
});

/* ==================== ANA BİLEŞEN ==================== */

const ReservationChart: React.FC = () => {
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [reservations, setReservations] = useState<ApiReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(dayjs().startOf('day'));
  const [openTabs, setOpenTabs] = useState<RoomTab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [roomsData, reservationsData] = await Promise.all([
        roomsApi.getAll(),
        reservationsApi.getAll({ status: 'reserved,checked_in' }),
      ]);
      setRooms(roomsData);
      setReservations(reservationsData);
    } catch (err) {
      console.error('Veri yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* WebSocket: Oda güncellemelerini canlı al */
  useRoomWebSocket({
    onRoomUpdate: (updatedApiRoom) => {
      setRooms((prev) =>
        prev.map((r) => r.id === updatedApiRoom.id ? updatedApiRoom : r)
      );
      reservationsApi.getAll({ status: 'reserved,checked_in' })
        .then(setReservations)
        .catch(() => {});
    },
  });

  /* Tab'dan çizelgeye dönünce veriyi tazele */
  const prevTabIndex = useRef(activeTabIndex);
  useEffect(() => {
    if (prevTabIndex.current >= 0 && activeTabIndex === -1) {
      fetchData();
    }
    prevTabIndex.current = activeTabIndex;
  }, [activeTabIndex, fetchData]);

  const days = useMemo(() => {
    return Array.from({ length: VISIBLE_DAYS }, (_, i) => startDate.add(i, 'day'));
  }, [startDate]);

  const goBack = () => setStartDate((d) => d.subtract(7, 'day'));
  const goForward = () => setStartDate((d) => d.add(7, 'day'));
  const goToday = () => setStartDate(dayjs().startOf('day'));

  const handleCellClick = (room: ApiRoom, date: dayjs.Dayjs) => {
    const existingIndex = openTabs.findIndex((t) => t.roomId === room.id);
    if (existingIndex !== -1) {
      setActiveTabIndex(existingIndex);
    } else {
      const newTab: RoomTab = {
        roomId: room.id,
        roomNumber: room.roomNumber,
        checkIn: date.format('YYYY-MM-DD'),
        checkOut: date.add(1, 'day').format('YYYY-MM-DD'),
      };
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

  /* RoomDetailContent check-in/out sonrası çağırır. Tüm veriyi tazele. */
  const handleRoomUpdate = (_roomId: number, _updates: Record<string, unknown>) => {
    fetchData();
  };

  const activeTab = activeTabIndex >= 0 && activeTabIndex < openTabs.length ? openTabs[activeTabIndex] : null;
  const activeApiRoom = activeTab ? rooms.find((r) => r.id === activeTab.roomId) : null;
  const activeRoom = activeApiRoom ? {
    ...mapApiRoom(activeApiRoom),
    /* Çizelgeden tıklanan tarih → oda detayına aktar */
    reservationCheckIn: activeApiRoom.reservationCheckIn || activeTab?.checkIn || null,
    reservationCheckOut: activeApiRoom.reservationCheckOut || activeTab?.checkOut || null,
  } : null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Veriler yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <div>
      <RoomTabBar
        tabs={openTabs}
        activeIndex={activeTabIndex}
        onTabChange={setActiveTabIndex}
        onTabClose={handleTabClose}
        onBackToChart={() => setActiveTabIndex(-1)}
      />

      <PageHeader
        title="Rezervasyon Çizelgesi"
        subtitle={`${startDate.format('DD MMM')} - ${startDate.add(VISIBLE_DAYS - 1, 'day').format('DD MMM YYYY')}`}
      />

      {activeTabIndex >= 0 && activeRoom ? (
        <RoomDetailContent key={activeRoom.id} room={activeRoom} onRoomUpdate={handleRoomUpdate} />
      ) : (
        <Paper sx={{ overflow: 'hidden', borderRadius: 2 }}>
          <ChartNavBar
            monthLabel={startDate.format('MMMM YYYY')}
            onGoBack={goBack}
            onGoForward={goForward}
            onGoToday={goToday}
          />
          <ChartGrid
            rooms={rooms}
            days={days}
            startDate={startDate}
            reservations={reservations}
            onCellClick={handleCellClick}
          />
        </Paper>
      )}
    </div>
  );
};

export default ReservationChart;
