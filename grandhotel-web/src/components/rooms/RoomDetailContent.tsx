/**
 * RoomDetailContent - Oda Detay Sekme İçeriği
 *
 * Dashboard'da bir oda sekmesi açıldığında gösterilen ana içerik bileşeni.
 * Alt bileşenler roomdetail/ klasöründe tanımlıdır.
 */

import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

import {
  Guest,
  Company,
  FolioItem,
  RoomGuest,
  StayHistory,
  ROOM_STATUS,
  FOLIO_CATEGORY_LABELS,
} from '../../utils/constants';
import { companiesApi, guestsApi, foliosApi, roomsApi, reservationsApi, auditApi } from '../../api/services';
import usePermission from '../../hooks/usePermission';
import type { ApiRoomMinibarItem } from '../../api/services';
import { ConfirmDialog } from '../common';
import GuestSearchDialog from './GuestSearchDialog';
import FolioAddDialog from './FolioAddDialog';
import DetailDialog from './DetailDialog';
import { InvoiceCreateDialog } from '../invoices';

/* Alt bileşenler */
import RoomDetailSections, {
  RoomHeaderToolbar,
  NewGuestDialog,
  FolioDetailDialog,
  StayHistoryDialog,
  GuestCardDialog,
} from './roomdetail';

interface RoomDetailContentRoom {
  id: number;
  roomNumber: string;
  bedType: string;
  floor: number;
  capacity?: number;
  view?: string;
  price?: number;
  status: string;
  guestName?: string;
  guests?: RoomGuest[];
  notes?: string;
  reservationId?: number | null;
  reservationCheckIn?: string | null;
  reservationCheckOut?: string | null;
  beds?: { type: string }[];
  minibar?: ApiRoomMinibarItem[];
}

interface RoomDetailContentProps {
  room: RoomDetailContentRoom;
  onRoomUpdate: (roomId: number, updates: Partial<RoomDetailContentRoom>) => void;
  onRoomSwitch?: (roomNumber: string) => void;
  onClose?: () => void;
  allRoomNumbers?: string[];
}

const RoomDetailContent: React.FC<RoomDetailContentProps> = ({ room, onRoomUpdate, onRoomSwitch, onClose, allRoomNumbers = [] }) => {
  const { isAdmin } = usePermission();
  /* === State === */
  /* Tarihler backend'den gelir — reservationCheckIn/Out alanları */
  const formatDateForInput = (isoStr?: string | null) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0]; // YYYY-MM-DD — HTML date input formatı
  };
  const [checkInDate, setCheckInDate] = useState(formatDateForInput(room.reservationCheckIn));
  const [checkOutDate, setCheckOutDate] = useState(formatDateForInput(room.reservationCheckOut));
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [customerMode, setCustomerMode] = useState<'new' | 'registered'>('new');
  const [quickRes, setQuickRes] = useState({ firstName: '', lastName: '', phone: '' });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [folios, setFolios] = useState<FolioItem[]>([]);
  const [nightlyRate, setNightlyRate] = useState<string>(room.price ? String(room.price) : '');
  const [roomNote, setRoomNote] = useState(room.notes || '');

  /* Dialog durumları */
  const [guestSearchOpen, setGuestSearchOpen] = useState(false);
  const [folioAddOpen, setFolioAddOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [newGuestDialogOpen, setNewGuestDialogOpen] = useState(false);
  const [folioDetailOpen, setFolioDetailOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  const [stayHistoryDialogOpen, setStayHistoryDialogOpen] = useState(false);
  const [stayHistoryData, setStayHistoryData] = useState<StayHistory[]>([]);
  const [stayHistoryGuestName, setStayHistoryGuestName] = useState('');

  const [guestCardDialogOpen, setGuestCardDialogOpen] = useState(false);
  const [guestCardData, setGuestCardData] = useState<Guest | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [checkoutConfirmOpen, setCheckoutConfirmOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  /* === Effects === */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesData, foliosData] = await Promise.all([
          companiesApi.getAll(),
          room.reservationId
            ? foliosApi.getForReservation(room.reservationId)
            : foliosApi.getForRoom(Number(room.id)),
        ]);
        setCompanies(companiesData as unknown as Company[]);
        setFolios(foliosData.map((f) => ({
          id: f.id,
          reservationId: f.reservationId,
          category: f.category,
          description: f.description,
          amount: Number(f.amount),
          date: f.date,
          guestId: f.guestId ?? undefined,
          createdBy: f.createdBy ?? undefined,
        })));

        // Eğer reserved bir rezervasyon varsa ve tarihi bugünse, sahibinin bilgisini hızlı rezervasyon alanına getir
        if (room.reservationId) {
          const resDetail = await reservationsApi.getById(room.reservationId);
          const today = new Date().toISOString().split('T')[0];
          const resCheckIn = (resDetail.checkIn || '').split('T')[0];
          if (resDetail.status === 'reserved' && resCheckIn === today && resDetail.stays && resDetail.stays.length > 0) {
            const owner = resDetail.stays[0];
            const nameParts = (owner.guestName || '').split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            setQuickRes({
              firstName,
              lastName,
              phone: owner.phone || '',
            });
          }
        }
      } catch (err) {
        console.error('Veri yüklenirken hata:', err);
      }
    };
    fetchData();
  }, [room.id, room.reservationId]);

  /* === Yardımcı: Misafiri odaya ekle === */
  const addGuestToRoom = async (guest: Guest) => {
    const currentGuests = room.guests || [];
    if (currentGuests.some((g) => g.guestId === guest.id)) return;

    if (room.status === ROOM_STATUS.OCCUPIED) {
      /* Dolu oda → API'ye add_guest, WebSocket günceller */
      try {
        await roomsApi.addGuest(room.id, guest.id);
      } catch (err: any) {
        console.error('Misafir eklenirken hata:', err);
        alert(err?.response?.data?.error || err.message || 'Misafir eklenemedi');
        return;
      }
    } else {
      /* Müsait oda → local listeye ekle, check-in'de toplu API'ye gidecek */
      const newRoomGuest: RoomGuest = {
        guestId: guest.id,
        guestName: `${guest.firstName} ${guest.lastName}`,
        phone: guest.phone,
      };
      const updatedGuests = [...currentGuests, newRoomGuest];
      onRoomUpdate(room.id, {
        guests: updatedGuests,
        guestName: updatedGuests.map((g) => g.guestName).join(', '),
      });
    }
  };

  /* === Handlers === */

  const handleNewGuestSave = async (data: { tcNo: string; firstName: string; lastName: string; phone: string; email: string }) => {
    try {
      const apiGuest = await guestsApi.create({
        tcNo: data.tcNo,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone.trim(),
        email: data.email.trim() || undefined,
        companyId: selectedCompanyId ? Number(selectedCompanyId) : null,
      });
      const guest: Guest = {
        id: apiGuest.id,
        tcNo: apiGuest.tcNo,
        firstName: apiGuest.firstName,
        lastName: apiGuest.lastName,
        phone: apiGuest.phone,
        email: apiGuest.email ?? undefined,
        companyId: apiGuest.companyId ?? undefined,
        isBlocked: apiGuest.isBlocked,
        createdAt: apiGuest.createdAt ?? new Date().toISOString(),
      };
      addGuestToRoom(guest);
      setNewGuestDialogOpen(false);
    } catch (err) {
      console.error('Misafir kaydedilirken hata:', err);
    }
  };

  const handleRegisteredGuestSelect = (guest: Guest) => {
    addGuestToRoom(guest);
  };

  const handleQuickReservation = async () => {
    if (!quickRes.firstName.trim() || !quickRes.lastName.trim() || !quickRes.phone.trim()) return;
    try {
      // 1. Misafir oluştur
      const apiGuest = await guestsApi.create({
        tcNo: '',
        firstName: quickRes.firstName.trim(),
        lastName: quickRes.lastName.trim(),
        phone: quickRes.phone.trim(),
      });

      // 2. Rezervasyon oluştur (check-in yapmadan, oda değişmez)
      await reservationsApi.create({
        roomId: room.id,
        guestId: apiGuest.id,
        checkIn: checkInDate || new Date().toISOString().split('T')[0],
        checkOut: checkOutDate || undefined,
        notes: roomNote,
      });

      // 3. Formu temizle, odaya ekleme (ön rezervasyon — henüz gelmedi)
      setQuickRes({ firstName: '', lastName: '', phone: '' });
      alert('Rezervasyon kaydedildi. Misafir geldiğinde check-in yapılacak.');
    } catch (err) {
      console.error('Hızlı rezervasyon hatası:', err);
      alert('Rezervasyon oluşturulamadı');
    }
  };

  const handleFolioAdd = async (data: { category: string; description: string; amount: number }) => {
    try {
      if (!room.reservationId) {
        console.error('Folio eklemek için aktif rezervasyon gerekli');
        return;
      }
      const apiFolio = await foliosApi.create({
        reservationId: room.reservationId,
        category: data.category,
        description: data.description,
        amount: data.amount,
        date: new Date().toISOString().split('T')[0],
      });
      const folio: FolioItem = {
        id: apiFolio.id,
        reservationId: apiFolio.reservationId,
        category: apiFolio.category,
        description: apiFolio.description,
        amount: Number(apiFolio.amount),
        date: apiFolio.date,
        guestId: apiFolio.guestId ?? undefined,
        createdBy: apiFolio.createdBy ?? undefined,
      };
      setFolios((prev) => [...prev, folio]);
    } catch (err) {
      console.error('Folio eklenirken hata:', err);
    }
  };

  const handleFolioDelete = async (folioId: number) => {
    try {
      const deletedFolio = folios.find((f) => f.id === folioId);
      await foliosApi.delete(folioId);
      setFolios((prev) => prev.filter((f) => f.id !== folioId));
      if (deletedFolio) {
        await auditApi.create({
          roomId: room.id,
          action: 'folio_deleted',
          description: `${deletedFolio.description || deletedFolio.category} (${Number(deletedFolio.amount).toLocaleString('tr-TR')} ₺) folio kalemi silindi`,
          performedBy: '',
        });
      }
    } catch (err) {
      console.error('Folio silinirken hata:', err);
    }
  };

  const handleFolioPrint = () => { window.print(); };

  const handleFolioEmail = () => {
    const subject = encodeURIComponent(`Folio - Oda ${room.roomNumber}`);
    const body = encodeURIComponent(
      `Oda ${room.roomNumber} Folio Detayları\n\n` +
      folios.map((f) => `${FOLIO_CATEGORY_LABELS[f.category] || f.category}: ${f.amount.toLocaleString('tr-TR')} ₺`).join('\n') +
      `\n\nToplam: ${folioTotal.toLocaleString('tr-TR')} ₺`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
  };

  /** Rezervasyon kaydet — yeni oluştur veya mevcut rezervasyonu güncelle */
  const handleSaveReservation = async () => {
    if (room.reservationId) {
      // Mevcut rezervasyonu güncelle
      try {
        await reservationsApi.update(room.reservationId, {
          roomId: room.id,
          checkIn: checkInDate || undefined,
          checkOut: checkOutDate || undefined,
          notes: roomNote || undefined,
          companyId: selectedCompanyId ? Number(selectedCompanyId) : null,
          totalAmount: nightlyRate ? Number(nightlyRate) : undefined,
        });
        alert('Rezervasyon güncellendi.');
      } catch (err: any) {
        console.error('Rezervasyon güncelleme hatası:', err);
        alert(err?.response?.data?.error || err.message || 'Rezervasyon güncellenemedi');
      }
    } else {
      // Yeni rezervasyon oluştur
      const guests = room.guests || [];
      if (guests.length === 0) {
        alert('Kaydetmek için en az 1 misafir eklemelisiniz.');
        return;
      }
      try {
        await reservationsApi.create({
          roomId: room.id,
          guestId: guests[0].guestId,
          checkIn: checkInDate || new Date().toISOString().split('T')[0],
          checkOut: checkOutDate || undefined,
          notes: roomNote,
        });
        alert('Rezervasyon kaydedildi. Oda durumu değişmedi.');
      } catch (err: any) {
        console.error('Rezervasyon kayıt hatası:', err);
        alert(err?.response?.data?.error || err.message || 'Rezervasyon kaydedilemedi');
      }
    }
  };

  const handleCheckIn = async () => {
    const guests = room.guests || [];
    if (guests.length === 0) return;

    const confirmed = window.confirm('Kaydetmeyi ve check-in yapmayı onaylıyor musunuz?');
    if (!confirmed) return;

    try {
      if (room.reservationId) {
        // Mevcut rezervasyon var → check-in'e çevir
        await reservationsApi.checkIn(room.reservationId);
        // Varsa ek misafirleri ekle
        for (let i = 1; i < guests.length; i++) {
          await roomsApi.addGuest(room.id, guests[i].guestId);
        }
      } else {
        // Rezervasyon yok → direkt check-in
        await roomsApi.checkIn(room.id, {
          guestId: guests[0].guestId,
          notes: roomNote,
          checkOut: checkOutDate || undefined,
        });
        for (let i = 1; i < guests.length; i++) {
          await roomsApi.addGuest(room.id, guests[i].guestId);
        }
      }
    } catch (err: any) {
      console.error('Check-in hatası:', err);
      alert(err?.response?.data?.error || err.message || 'Check-in yapılamadı');
    }
  };

  const handleCheckOutClick = () => {
    if (folioTotal > 0) {
      alert(`Odanın ${folioTotal.toLocaleString('tr-TR')} ₺ borcu bulunmaktadır. Lütfen ödeme yapınız.`);
      return;
    }
    setCheckoutConfirmOpen(true);
  };

  const handleCheckOutConfirm = async () => {
    setCheckoutLoading(true);
    try {
      await roomsApi.checkOut(room.id);
      setCheckoutConfirmOpen(false);
    } catch (err: any) {
      console.error('Check-out hatası:', err);
      alert(err?.response?.data?.error || err.message || 'Check-out yapılamadı');
    } finally {
      setCheckoutLoading(false);
    }
  };

  /** Check-in iptal — rezervasyon varsa reserved'a dön, yoksa available yap */
  const handleRevertCheckin = async () => {
    if (!window.confirm('Check-in iptal edilecek. Emin misiniz?')) return;
    try {
      if (room.reservationId) {
        // Ön rezerve — backend oda + rezervasyon durumunu birlikte geri alır
        await reservationsApi.revertCheckin(room.reservationId);
        await auditApi.create({
          roomId: room.id,
          action: 'checkin_reversed',
          description: `Oda ${room.roomNumber} check-in iptal edildi — rezervasyon tekrar aktif`,
          performedBy: '',
        });
      } else {
        // Kapı müşterisi — checkout + available yap
        await roomsApi.checkOut(room.id);
        await roomsApi.updateStatus(room.id, ROOM_STATUS.AVAILABLE);
        await auditApi.create({
          roomId: room.id,
          action: 'checkin_reversed',
          description: `Oda ${room.roomNumber} check-in iptal edildi`,
          performedBy: '',
        });
      }
    } catch (err: any) {
      console.error('Check-in iptal hatası:', err);
      alert(err?.response?.data?.error || err.message || 'Check-in iptal yapılamadı');
    }
  };

  /** Check-out iptal — odayı tekrar occupied yap */
  const handleRevertCheckout = async () => {
    try {
      await roomsApi.revertCheckout(room.id);
      await auditApi.create({
        roomId: room.id,
        action: 'checkout_reversed',
        description: `Oda ${room.roomNumber} check-out iptal edildi`,
        performedBy: '',
      });
    } catch (err: any) {
      console.error('Check-out iptal hatası:', err);
      alert(err?.response?.data?.error || err.message || 'Check-out iptal yapılamadı');
    }
  };

  const handleCancelClick = () => {
    setCancelConfirmOpen(true);
  };

  const handleCancelConfirm = async () => {
    setCancelLoading(true);
    try {
      if (room.reservationId) {
        await reservationsApi.cancel(room.reservationId);
      }
      if (room.status === ROOM_STATUS.OCCUPIED) {
        await roomsApi.checkOut(room.id);
      }
      await roomsApi.updateStatus(room.id, ROOM_STATUS.AVAILABLE);
      setCancelConfirmOpen(false);
      /* Ana ekrana dön */
      if (onClose) onClose();
    } catch (err: any) {
      console.error('İptal hatası:', err);
      alert(err?.response?.data?.error || err.message || 'İptal yapılamadı');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleNightlyRateChange = (value: string) => {
    setNightlyRate(value);
    const numVal = Number(value);
    if (!isNaN(numVal) && numVal >= 0) {
      onRoomUpdate(room.id, { price: numVal });
    }
  };

  const handleNoteSave = () => { onRoomUpdate(room.id, { notes: roomNote.trim() || undefined }); };

  const handleGuestMenuAction = async (action: 'history' | 'card' | 'block' | 'remove', guestId: number) => {
    try {
      if (action === 'history') {
        const roomGuest = (room.guests || []).find((g) => g.guestId === guestId);
        const history = await guestsApi.stayHistory(guestId);
        const mapped: StayHistory[] = history.map((r) => ({
          id: r.id,
          guestName: r.guestNames || '',
          roomNumber: r.roomNumber,
          checkIn: r.checkIn,
          checkOut: r.checkOut || '',
          totalAmount: Number(r.totalAmount),
          paidAmount: Number(r.paidAmount),
          companyName: r.companyName || undefined,
        }));
        setStayHistoryData(mapped);
        setStayHistoryGuestName(roomGuest?.guestName || '');
        setStayHistoryDialogOpen(true);
      } else if (action === 'card') {
        const allGuests = await guestsApi.getAll();
        const guest = allGuests.find((g) => g.id === guestId);
        if (guest) {
          setGuestCardData({
            id: guest.id,
            tcNo: guest.tcNo,
            firstName: guest.firstName,
            lastName: guest.lastName,
            phone: guest.phone,
            email: guest.email ?? undefined,
            companyId: guest.companyId ?? undefined,
            isBlocked: guest.isBlocked,
            createdAt: guest.createdAt ?? '',
          });
          setGuestCardDialogOpen(true);
        }
      } else if (action === 'remove') {
        const guestName = (room.guests || []).find((g) => g.guestId === guestId)?.guestName || '';
        if (!window.confirm(`${guestName} misafirini odadan çıkarmak istediğinize emin misiniz?`)) return;
        await roomsApi.removeGuest(room.id, guestId);
        await auditApi.create({
          roomId: room.id,
          action: 'guest_removed',
          description: `${guestName} misafiri odadan çıkarıldı`,
          performedBy: '',
        });
        const updatedGuests = (room.guests || []).filter((g) => g.guestId !== guestId);
        onRoomUpdate(room.id, {
          guests: updatedGuests,
          guestName: updatedGuests.map((g) => g.guestName).join(', ') || '',
          ...(updatedGuests.length === 0 ? { status: ROOM_STATUS.AVAILABLE } : {}),
        });
      } else if (action === 'block') {
        const updatedGuest = await guestsApi.toggleBlock(guestId);
        if (updatedGuest && updatedGuest.isBlocked) {
          const updatedGuests = (room.guests || []).filter((g) => g.guestId !== guestId);
          onRoomUpdate(room.id, {
            guests: updatedGuests,
            guestName: updatedGuests.map((g) => g.guestName).join(', ') || '',
            ...(updatedGuests.length === 0 ? { status: ROOM_STATUS.AVAILABLE } : {}),
          });
        }
      }
    } catch (err) {
      console.error('Misafir işlemi sırasında hata:', err);
    }
  };

  /* === Hesaplamalar === */
  const folioTotal = folios.reduce((sum, f) => {
    if (f.category === 'discount') return sum - f.amount;
    if (f.category === 'payment') return sum - f.amount;
    return sum + f.amount;
  }, 0);

  const hasGuests = room.guests && room.guests.length > 0;
  const hasPayment = folios.some((f) => f.category === 'payment');
  const isCheckInDisabled = !hasGuests || (!hasPayment || folioTotal > 0);
  const isOccupied = room.status === ROOM_STATUS.OCCUPIED;

  /* Mevcut rezervasyonda değişiklik var mı? */
  const hasReservationChanges = !!room.reservationId && (
    checkInDate !== formatDateForInput(room.reservationCheckIn) ||
    checkOutDate !== formatDateForInput(room.reservationCheckOut) ||
    roomNote !== (room.notes || '') ||
    nightlyRate !== (room.price ? String(room.price) : '')
  );

  return (
    <Box>
      <RoomHeaderToolbar
        roomNumber={room.roomNumber}
        bedType={room.bedType}
        status={room.status}
        isCheckInDisabled={isCheckInDisabled}
        isOccupied={isOccupied}
        hasGuests={!!hasGuests}
        hasReservation={!!room.reservationId}
        allRoomNumbers={allRoomNumbers}
        onFolioAddOpen={() => setFolioAddOpen(true)}
        onDetailOpen={() => setDetailDialogOpen(true)}
        onInvoiceOpen={() => setInvoiceDialogOpen(true)}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOutClick}
        onCancel={handleCancelClick}
        onRevertCheckout={handleRevertCheckout}
        onRevertCheckin={handleRevertCheckin}
        onSaveReservation={handleSaveReservation}
        isSaveEnabled={hasReservationChanges}
        onRoomSwitch={onRoomSwitch}
      />

      <RoomDetailSections
        guests={room.guests || []}
        beds={room.beds || []}
        onMenuAction={handleGuestMenuAction}
        customerMode={customerMode}
        onCustomerModeChange={setCustomerMode}
        onNewGuestClick={() => setNewGuestDialogOpen(true)}
        onSearchGuestClick={() => setGuestSearchOpen(true)}
        quickRes={quickRes}
        onQuickResChange={(field, value) => setQuickRes((p) => ({ ...p, [field]: value }))}
        onQuickResSubmit={handleQuickReservation}
        note={roomNote}
        onNoteChange={setRoomNote}
        onNoteSave={handleNoteSave}
        minibarItems={room.minibar || []}
        roomId={room.id}
        isOccupied={isOccupied}
        isAdmin={isAdmin}
        checkInDate={checkInDate}
        onCheckInDateChange={setCheckInDate}
        checkOutDate={checkOutDate}
        onCheckOutDateChange={setCheckOutDate}
        selectedCompanyId={selectedCompanyId}
        onCompanyChange={setSelectedCompanyId}
        nightlyRate={nightlyRate}
        onNightlyRateChange={handleNightlyRateChange}
        companies={companies}
        folios={folios}
        folioTotal={folioTotal}
        onFolioDetailOpen={() => setFolioDetailOpen(true)}
      />

      {/* Dialog'lar */}
      <NewGuestDialog
        open={newGuestDialogOpen}
        onClose={() => setNewGuestDialogOpen(false)}
        onSave={handleNewGuestSave}
      />

      <FolioDetailDialog
        open={folioDetailOpen}
        roomNumber={room.roomNumber}
        folios={folios}
        folioTotal={folioTotal}
        onClose={() => setFolioDetailOpen(false)}
        onFolioAddOpen={() => setFolioAddOpen(true)}
        onFolioDelete={handleFolioDelete}
        onPrint={handleFolioPrint}
        onEmail={handleFolioEmail}
      />

      <StayHistoryDialog
        open={stayHistoryDialogOpen}
        guestName={stayHistoryGuestName}
        data={stayHistoryData}
        onClose={() => setStayHistoryDialogOpen(false)}
      />

      <GuestCardDialog
        open={guestCardDialogOpen}
        guest={guestCardData}
        companies={companies}
        onClose={() => setGuestCardDialogOpen(false)}
      />

      <GuestSearchDialog
        open={guestSearchOpen}
        roomNumber={room.roomNumber}
        onClose={() => setGuestSearchOpen(false)}
        onSelect={handleRegisteredGuestSelect}
      />

      <FolioAddDialog
        open={folioAddOpen}
        roomId={Number(room.id)}
        onClose={() => setFolioAddOpen(false)}
        onSave={handleFolioAdd}
      />

      <DetailDialog
        open={detailDialogOpen}
        room={room}
        onClose={() => setDetailDialogOpen(false)}
      />

      <InvoiceCreateDialog
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        defaultType="sales"
        customerType={selectedCompanyId ? 'company' : 'individual'}
        customerName={
          selectedCompanyId
            ? companies.find((c) => c.id === Number(selectedCompanyId))?.name || ''
            : room.guests && room.guests.length > 0
              ? room.guests[0].guestName
              : ''
        }
        taxNumber={
          selectedCompanyId
            ? companies.find((c) => c.id === Number(selectedCompanyId))?.taxNumber || ''
            : ''
        }
        address={
          selectedCompanyId
            ? companies.find((c) => c.id === Number(selectedCompanyId))?.address || ''
            : ''
        }
        companyId={selectedCompanyId ? Number(selectedCompanyId) : undefined}
        roomId={room.id}
      />

      {/* Rezervasyon İptal Onay */}
      <ConfirmDialog
        open={cancelConfirmOpen}
        title="Rezervasyon İptal"
        message={`Oda ${room.roomNumber} için rezervasyonu iptal etmek istediğinize emin misiniz?`}
        confirmText="İptal Et"
        confirmColor="error"
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelConfirmOpen(false)}
        loading={cancelLoading}
      />

      {/* Check-out Onay */}
      <ConfirmDialog
        open={checkoutConfirmOpen}
        title="Check-out"
        message={`Oda ${room.roomNumber} için check-out yapmak istediğinize emin misiniz?`}
        confirmText="Check-out Yap"
        confirmColor="secondary"
        onConfirm={handleCheckOutConfirm}
        onCancel={() => setCheckoutConfirmOpen(false)}
        loading={checkoutLoading}
      />
    </Box>
  );
};

export default RoomDetailContent;
