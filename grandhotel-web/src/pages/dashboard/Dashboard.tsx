/**
 * Dashboard Sayfası
 *
 * Otelin genel durumunu gösteren ana sayfa.
 * Üstte özet istatistik kartları, altında oda kutucukları (RoomCard) gösterilir.
 *
 * Oda Tab Sistemi:
 *   - RoomCard'a tıklanınca üstte yeni sekme açılır
 *   - Birden fazla oda sekmesi aynı anda açık olabilir
 *   - Aktif sekme odanın detay içeriğini gösterir
 *
 * Rol bazlı kartlar:
 *   - Patron/Müdür: Tüm veriler (ciro dahil)
 *   - Resepsiyon: Oda ve rezervasyon verileri (ciro hariç)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '../../components/common';
import RoomDetailContent from '../../components/rooms/RoomDetailContent';
import RoomMoveDialog from '../../components/rooms/RoomMoveDialog';
import usePermission from '../../hooks/usePermission';
import usePageTabs from '../../hooks/usePageTabs';
import useRoomWebSocket from '../../hooks/useRoomWebSocket';
import { ROOM_STATUS, RoomTab, RoomGuest } from '../../utils/constants';
import { roomsApi, kazancApi } from '../../api/services';
import type { ApiRoom, ApiRoomMinibarItem, DashboardStats } from '../../api/services';

/* Dashboard alt bileşenleri */
import { DashboardContent, DashboardDialogs } from '../../components/dashboard';

/** ApiRoom'u Dashboard'ın beklediği Room formatına dönüştür */
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
  reservationOwnerName?: string | null;
  reservationCompanyId?: number | null;
  reservationAgencyId?: number | null;
  reservationAgencyCode?: string | null;
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
  guests: r.guests?.map((g) => ({ guestId: g.guestId, guestName: g.guestName, phone: g.phone, checkIn: g.checkIn ?? undefined, checkOut: g.checkOut ?? undefined, isActive: g.isActive })),
  notes: r.notes || undefined,
  reservationId: r.reservationId,
  reservationCheckIn: r.reservationCheckIn,
  reservationCheckOut: r.reservationCheckOut,
  reservationStatus: r.reservationStatus,
  reservationOwnerName: r.reservationOwnerName,
  reservationCompanyId: r.reservationCompanyId,
  reservationAgencyId: r.reservationAgencyId,
  reservationAgencyCode: r.reservationAgencyCode,
  beds: r.beds,
  minibar: r.minibar,
});

interface CheckInOutItem {
  id: number;
  guest: string;
  room: string;
  time: string;
}

/* Mock veri kaldırıldı — tüm veriler API'den çekilir */

const Dashboard: React.FC = () => {
  const { canViewFinancials } = usePermission();
  const navigate = useNavigate();

  /* Oda verileri - API'den çekilir, WebSocket ile canlı güncellenir */
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  /* Kazanç verileri - API'den çekilir */
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [checkIns, setCheckIns] = useState<CheckInOutItem[]>([]);
  const [checkOuts, setCheckOuts] = useState<CheckInOutItem[]>([]);

  /* İlk yükle: API'den odaları ve istatistikleri çek (StrictMode korumalı) */
  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    roomsApi.getAll()
      .then((data) => { setRooms(data.map(mapApiRoom)); setRoomsLoading(false); })
      .catch(() => setRoomsLoading(false));

    kazancApi.dashboardStats()
      .then((data) => {
        setStats(data);
        setCheckIns(data.todayCheckins.map((c: { guest: string; room: string; time: string }, i: number) => ({
          id: i + 1, guest: c.guest, room: c.room, time: c.time,
        })));
        setCheckOuts(data.todayCheckouts.map((c: { guest: string; room: string; time: string }, i: number) => ({
          id: i + 1, guest: c.guest, room: c.room, time: c.time,
        })));
      })
      .catch(() => {});
  }, []);

  /* WebSocket: Oda güncellenince state'te güncelle */
  useRoomWebSocket({
    onRoomUpdate: (updatedApiRoom) => {
      const updated = mapApiRoom(updatedApiRoom);
      setRooms((prev) =>
        prev.map((r) => r.id === updated.id ? updated : r)
      );
    },
  });

  /* Tab sistemi */
  const [openTabs, setOpenTabs] = useState<RoomTab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1);

  /* Oda taşıma */
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveSourceRoom, setMoveSourceRoom] = useState<{ id: number; roomNumber: string } | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [housekeepingReportOpen, setHousekeepingReportOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [cleaningFilter, setCleaningFilter] = useState<string>('all');
  const [occupancyFilter, setOccupancyFilter] = useState<string>('all');

  /* Kat filtresi */
  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);
  const filteredDashboardRooms = rooms.filter((r) => {
    if (selectedFloor && r.floor !== Number(selectedFloor)) return false;
    if (cleaningFilter === 'clean' && r.status === ROOM_STATUS.DIRTY) return false;
    if (cleaningFilter === 'dirty' && r.status !== ROOM_STATUS.DIRTY) return false;
    if (occupancyFilter === 'occupied' && r.status !== ROOM_STATUS.OCCUPIED) return false;
    if (occupancyFilter === 'empty' && r.status === ROOM_STATUS.OCCUPIED) return false;
    return true;
  });

  /** Oda durumu değiştir — sadece API çağırır, WebSocket herkesi günceller */
  const handleStatusChange = async (roomId: string | number, newStatus: string) => {
    try {
      await roomsApi.updateStatus(Number(roomId), newStatus);
    } catch (err) {
      console.error('Durum güncelleme hatası:', err);
    }
  };

  const handleRoomAction = (roomId: string | number, actionType: string) => {
    if (actionType === 'move') {
      const room = rooms.find((r) => r.id === Number(roomId));
      if (room) {
        setMoveSourceRoom({ id: room.id, roomNumber: room.roomNumber });
        setMoveDialogOpen(true);
      }
    }
  };

  const handleRoomMove = async (fromRoomId: number, toRoomId: number) => {
    await roomsApi.moveGuests(fromRoomId, toRoomId);
    // Oda listesini yenile
    const updated = await roomsApi.getAll();
    setRooms(updated.map(mapApiRoom));
  };

  const handleRoomClick = (room: { id: string | number; roomNumber: string | number }) => {
    const existingIndex = openTabs.findIndex((t) => t.roomId === Number(room.id));
    if (existingIndex !== -1) {
      setActiveTabIndex(existingIndex);
    } else {
      const newTab: RoomTab = { roomId: Number(room.id), roomNumber: String(room.roomNumber) };
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

  /**
   * RoomDetailContent'ten çağrılır.
   * Müsait odaya misafir ekleme gibi henüz API'ye gitmemiş local değişiklikler için.
   * Check-in/out gibi API işlemleri sonrası WebSocket zaten günceller.
   */
  const handleRoomUpdate = (roomId: number, updates: Partial<Room>) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId ? { ...room, ...updates } : room
      )
    );
  };

  const handleRoomSwitch = (roomNumber: string) => {
    const targetRoom = rooms.find((r) => r.roomNumber === roomNumber);
    if (!targetRoom) return;
    const existingIndex = openTabs.findIndex((t) => t.roomId === targetRoom.id);
    if (existingIndex !== -1) {
      setActiveTabIndex(existingIndex);
    } else {
      const newTab: RoomTab = { roomId: targetRoom.id, roomNumber: targetRoom.roomNumber };
      setOpenTabs((prev) => [...prev, newTab]);
      setActiveTabIndex(openTabs.length);
    }
  };

  const activeRoom = activeTabIndex >= 0 && activeTabIndex < openTabs.length
    ? rooms.find((r) => r.id === openTabs[activeTabIndex].roomId)
    : null;

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === ROOM_STATUS.OCCUPIED).length;
  const availableRooms = rooms.filter((r) => r.status === ROOM_STATUS.AVAILABLE).length;
  // Tek/Çift kişilik = bugün **konaklama sayısı** (yatak tipi değil) — backend'den gelir
  const singleRooms = stats?.occupancy.singleOccupancyRooms ?? 0;
  const doubleRooms = stats?.occupancy.doubleOccupancyRooms ?? 0;
  const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;

  /** Header tab'ları (AppBar'a iletilir) */
  const headerTabs = openTabs.map((tab) => {
    const tabRoom = rooms.find((r) => r.id === tab.roomId);
    return {
      key: `room-${tab.roomId}`,
      label: `Oda ${tab.roomNumber}`,
      badge: tabRoom?.guestName,
    };
  });

  const handleBackToList = useCallback(() => setActiveTabIndex(-1), []);

  usePageTabs({
    tabs: headerTabs,
    activeTabIndex,
    onTabChange: setActiveTabIndex,
    onTabClose: handleTabClose,
    onBackToList: handleBackToList,
    backLabel: "Dashboard'a Dön",
  });

  return (
    <div>
      {/* Aktif Sekme İçeriği veya Dashboard */}
      {activeTabIndex >= 0 && activeRoom ? (
        <RoomDetailContent
          room={activeRoom}
          onRoomUpdate={handleRoomUpdate}
          onRoomSwitch={handleRoomSwitch}
          onClose={handleBackToList}
          allRoomNumbers={rooms.map((r) => r.roomNumber)}
        />
      ) : (
        <DashboardContent
          rooms={rooms}
          filteredRooms={filteredDashboardRooms}
          floors={floors}
          selectedFloor={selectedFloor}
          onFloorChange={setSelectedFloor}
          cleaningFilter={cleaningFilter}
          onCleaningFilterChange={setCleaningFilter}
          occupancyFilter={occupancyFilter}
          onOccupancyFilterChange={setOccupancyFilter}
          onStatusChange={handleStatusChange}
          onRoomAction={handleRoomAction}
          onRoomClick={handleRoomClick}
          onReportOpen={() => setReportDialogOpen(true)}
          onHousekeepingOpen={() => setHousekeepingReportOpen(true)}
          onNavigate={navigate}
          checkIns={checkIns}
          checkOuts={checkOuts}
          occupiedRooms={occupiedRooms}
          availableRooms={availableRooms}
          totalRooms={totalRooms}
          singleRooms={singleRooms}
          doubleRooms={doubleRooms}
          occupancyRate={stats?.occupancy.occupancyRate ?? occupancyRate}
          canViewFinancials={canViewFinancials}
          dailyRevenue={stats?.revenue.dailyRevenue}
          monthlyRevenue={stats?.revenue.monthlyRevenue}
          monthlyGrowthPercent={stats?.revenue.monthlyGrowthPercent}
        />
      )}

      <DashboardDialogs
        reportDialogOpen={reportDialogOpen}
        onReportClose={() => setReportDialogOpen(false)}
        housekeepingReportOpen={housekeepingReportOpen}
        onHousekeepingClose={() => setHousekeepingReportOpen(false)}
        rooms={rooms}
        canViewFinancials={canViewFinancials}
      />

      <RoomMoveDialog
        open={moveDialogOpen}
        onClose={() => { setMoveDialogOpen(false); setMoveSourceRoom(null); }}
        sourceRoom={moveSourceRoom}
        rooms={rooms.map((r) => ({ id: r.id, roomNumber: r.roomNumber, status: r.status, floor: r.floor, bedType: r.bedType }))}
        onMove={handleRoomMove}
      />
    </div>
  );
};

export default Dashboard;
