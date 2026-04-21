/**
 * RoomDetailContent - Oda Detay Sekme İçeriği
 *
 * Dashboard'da bir oda sekmesi açıldığında gösterilen ana içerik bileşeni.
 * Alt bileşenler roomdetail/ klasöründe tanımlıdır.
 */

import React, { useState, useEffect } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';

import {
  Guest,
  Company,
  Agency,
  FolioItem,
  RoomGuest,
  StayHistory,
  ROOM_STATUS,
  FOLIO_CATEGORY_LABELS,
} from '../../utils/constants';
import { companiesApi, agenciesApi, guestsApi, foliosApi, roomsApi, reservationsApi, auditApi, minibarApi } from '../../api/services';
import usePermission from '../../hooks/usePermission';
import useAuth from '../../hooks/useAuth';
import type { ApiRoomMinibarItem } from '../../api/services';
import { ConfirmDialog } from '../common';
import GuestSearchDialog from './GuestSearchDialog';
import FolioAddDialog from './FolioAddDialog';
import type { FolioAddData } from './FolioAddDialog';
import DetailDialog from './DetailDialog';
import { InvoiceCreateDialog } from '../invoices';

/* Alt bileşenler */
import RoomDetailSections, {
  RoomHeaderToolbar,
  NewGuestDialog,
  FolioDetailDialog,
  StayHistoryDialog,
  GuestCardDialog,
  PastReservationDialog,
} from './roomdetail';

/* Firma verisi cache — promise tabanlı, StrictMode'da bile tek çağrı.
 * Rejection halinde cache'i temizle ki sonraki çağrı yeniden denesin.
 */
let companiesPromise: Promise<Company[]> | null = null;
const getCompanies = (): Promise<Company[]> => {
  if (!companiesPromise) {
    companiesPromise = (companiesApi.getAll() as unknown as Promise<Company[]>)
      .catch((err) => {
        companiesPromise = null;
        throw err;
      });
  }
  return companiesPromise;
};

/* Acente verisi cache — companiesPromise ile aynı pattern. */
let agenciesPromise: Promise<Agency[]> | null = null;
const getAgencies = (): Promise<Agency[]> => {
  if (!agenciesPromise) {
    agenciesPromise = (agenciesApi.getAll() as unknown as Promise<Agency[]>)
      .catch((err) => {
        agenciesPromise = null;
        throw err;
      });
  }
  return agenciesPromise;
};

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
  reservationCompanyId?: number | null;
  reservationAgencyId?: number | null;
  reservationAgencyCode?: string | null;
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
  const { user } = useAuth();
  const currentUserName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Bilinmiyor';
  /* === State === */
  /* Tarihler backend'den gelir — reservationCheckIn/Out alanları */
  const formatDateForInput = (isoStr?: string | null) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0]; // YYYY-MM-DD — HTML date input formatı
  };
  /* Boş odada default tarih: bugün / yarın */
  const todayStr = () => new Date().toISOString().split('T')[0];
  const tomorrowStr = () => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toISOString().split('T')[0];
  };
  const [checkInDate, setCheckInDate] = useState(
    formatDateForInput(room.reservationCheckIn) || todayStr()
  );
  const [checkOutDate, setCheckOutDate] = useState(
    formatDateForInput(room.reservationCheckOut) || tomorrowStr()
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    room.reservationCompanyId ? String(room.reservationCompanyId) : ''
  );
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(
    room.reservationAgencyId ? String(room.reservationAgencyId) : ''
  );
  const [agencyReservationCode, setAgencyReservationCode] = useState<string>(
    room.reservationAgencyCode || ''
  );
  const [customerMode, setCustomerMode] = useState<'new' | 'registered'>('new');
  const [quickRes, setQuickRes] = useState({ firstName: '', lastName: '', phone: '' });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
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
  const [pastReservationId, setPastReservationId] = useState<number | null>(null);

  const [guestCardDialogOpen, setGuestCardDialogOpen] = useState(false);
  const [guestCardData, setGuestCardData] = useState<Guest | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [checkoutConfirmOpen, setCheckoutConfirmOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  /* Firmaya kayıtlı misafirler paneli */
  const [companyGuests, setCompanyGuests] = useState<Array<{ id: number; firstName: string; lastName: string; phone: string }>>([]);
  const [companyGuestsLoading, setCompanyGuestsLoading] = useState(false);
  const [removeFromCompanyTarget, setRemoveFromCompanyTarget] = useState<{ id: number; name: string } | null>(null);

  /* === Effects === */
  // Oda değiştiğinde rezervasyondaki firma seçimini sync et
  useEffect(() => {
    setSelectedCompanyId(room.reservationCompanyId ? String(room.reservationCompanyId) : '');
  }, [room.id, room.reservationCompanyId]);

  // Oda değiştiğinde rezervasyondaki acente + rez kodu sync
  useEffect(() => {
    setSelectedAgencyId(room.reservationAgencyId ? String(room.reservationAgencyId) : '');
    setAgencyReservationCode(room.reservationAgencyCode || '');
  }, [room.id, room.reservationAgencyId, room.reservationAgencyCode]);

  // Firma seçildiğinde o firmaya kayıtlı misafirleri getir
  useEffect(() => {
    if (!selectedCompanyId) {
      setCompanyGuests([]);
      return;
    }
    const compIdNum = Number(selectedCompanyId);
    if (Number.isNaN(compIdNum)) return;

    let cancelled = false;
    setCompanyGuestsLoading(true);
    companiesApi.getGuests(compIdNum)
      .then((data) => {
        if (cancelled) return;
        setCompanyGuests(data.map((g) => ({
          id: g.id,
          firstName: g.firstName,
          lastName: g.lastName,
          phone: g.phone,
        })));
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Firma misafirleri yüklenemedi:', err);
        setCompanyGuests([]);
      })
      .finally(() => {
        if (!cancelled) setCompanyGuestsLoading(false);
      });

    return () => { cancelled = true; };
  }, [selectedCompanyId]);

  useEffect(() => {
    setQuickRes({ firstName: '', lastName: '', phone: '' });

    const fetchData = async () => {
      try {
        // Her isteği BAĞIMSIZ catch et — biri başarısız olursa (örn. agencies henüz deploy değil)
        // diğerleri yine de yüklenir. allSettled → tüm sonuçlar döner, rejection zincir kırmaz.
        const [companiesResult, agenciesResult, foliosResult] = await Promise.allSettled([
          getCompanies(),
          getAgencies(),
          room.reservationId
            ? foliosApi.getForReservation(room.reservationId)
            : foliosApi.getForRoom(Number(room.id)),
        ]);
        if (companiesResult.status === 'fulfilled') {
          setCompanies(companiesResult.value as unknown as Company[]);
        } else {
          console.error('Firmalar yüklenemedi:', companiesResult.reason);
        }
        if (agenciesResult.status === 'fulfilled') {
          setAgencies(agenciesResult.value as unknown as Agency[]);
        } else {
          console.warn('Acenteler yüklenemedi (backend deploy gerekebilir):', agenciesResult.reason);
          setAgencies([]);
        }
        const foliosData = foliosResult.status === 'fulfilled' ? foliosResult.value : [];
        setFolios(foliosData.map((f) => ({
          id: f.id,
          reservationId: f.reservationId,
          category: f.category,
          description: f.description,
          amount: Number(f.amount),
          date: f.date,
          guestId: f.guestId ?? undefined,
          createdBy: f.createdBy ?? undefined,
          createdAt: f.createdAt ?? undefined,
        })));

        // Rezervasyon varsa sahibinin bilgisini hızlı rezervasyon alanına getir
        if (room.reservationId) {
          const resDetail = await reservationsApi.getById(room.reservationId);
          if (resDetail.stays && resDetail.stays.length > 0) {
            const owner = resDetail.stays[0];
            const nameParts = (owner.guestName || '').split(' ');
            setQuickRes({
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
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
      } catch (err: unknown) {
        console.error('Misafir eklenirken hata:', err);
        const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
        setSnackbar({ open: true, message: axiosErr?.response?.data?.error || axiosErr?.message || 'Misafir eklenemedi', severity: 'error' });
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
      // Odada firma seçili ise, yeni misafiri o firmaya kaydetmek için onay iste
      let companyIdToAssign: number | null = null;
      if (selectedCompanyId) {
        const comp = companies.find((c) => c.id === Number(selectedCompanyId));
        const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();
        const ok = window.confirm(
          `${fullName} "${comp?.name || ''}" firmasına kaydedilsin mi?`
        );
        if (ok) {
          companyIdToAssign = Number(selectedCompanyId);
        }
      }

      const apiGuest = await guestsApi.create({
        tcNo: data.tcNo,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone.trim(),
        email: data.email.trim() || undefined,
        companyId: companyIdToAssign,
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

      // Firmaya kayıt yapıldıysa panel listesine de ekle
      if (companyIdToAssign && companyGuests.every((g) => g.id !== guest.id)) {
        setCompanyGuests((prev) => [...prev, {
          id: guest.id,
          firstName: guest.firstName,
          lastName: guest.lastName,
          phone: guest.phone,
        }]);
      }

      addGuestToRoom(guest);
      setNewGuestDialogOpen(false);
    } catch (err) {
      console.error('Misafir kaydedilirken hata:', err);
    }
  };

  const handleRegisteredGuestSelect = async (guest: Guest) => {
    // Odada bir firma seçili ve misafirin firması farklıysa, onay isteyip güncelle
    if (selectedCompanyId && guest.companyId !== Number(selectedCompanyId)) {
      const targetCompany = companies.find((c) => c.id === Number(selectedCompanyId));
      const currentCompany = guest.companyId ? companies.find((c) => c.id === guest.companyId) : null;
      const fromName = currentCompany ? `"${currentCompany.name}"` : 'firmasız';
      const ok = window.confirm(
        `${guest.firstName} ${guest.lastName} şu an ${fromName}. "${targetCompany?.name}" firmasına geçirilsin mi?`
      );
      if (ok) {
        try {
          await guestsApi.update(guest.id, { companyId: Number(selectedCompanyId) });
          // Firmaya kayıtlı misafirler listesi tazele
          if (companyGuests.every((g) => g.id !== guest.id)) {
            setCompanyGuests((prev) => [...prev, {
              id: guest.id, firstName: guest.firstName, lastName: guest.lastName, phone: guest.phone,
            }]);
          }
        } catch (err) {
          console.error('Misafir firması güncellenemedi:', err);
        }
      }
    }
    addGuestToRoom(guest);
  };

  /* Firmaya kayıtlı misafirler kutusundan bir misafir seç → odaya ekle */
  const handleSelectCompanyGuest = async (guestId: number) => {
    const row = companyGuests.find((g) => g.id === guestId);
    if (!row) return;
    const guest: Guest = {
      id: row.id,
      tcNo: '',
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone,
      companyId: selectedCompanyId ? Number(selectedCompanyId) : undefined,
      isBlocked: false,
      createdAt: '',
    };
    await addGuestToRoom(guest);
  };

  /* Firmadan çıkar onay dialog'unu aç */
  const handleOpenRemoveFromCompany = (guestId: number, guestName: string) => {
    setRemoveFromCompanyTarget({ id: guestId, name: guestName });
  };

  /* Firmadan çıkar onayı */
  const handleConfirmRemoveFromCompany = async () => {
    if (!removeFromCompanyTarget) return;
    const { id, name } = removeFromCompanyTarget;
    try {
      await guestsApi.update(id, { companyId: null });
      setCompanyGuests((prev) => prev.filter((g) => g.id !== id));
      setRemoveFromCompanyTarget(null);
      const companyName = companies.find((c) => c.id === Number(selectedCompanyId))?.name || '';
      await auditApi.create({
        roomId: room.id,
        action: 'guest_removed_from_company',
        description: `${name} "${companyName}" firmasından çıkarıldı`,
        performedBy: currentUserName,
      });
      setSnackbar({ open: true, message: `${name} firmadan çıkarıldı`, severity: 'success' });
    } catch (err: unknown) {
      console.error('Firmadan çıkarma hatası:', err);
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      setSnackbar({ open: true, message: axiosErr?.response?.data?.error || axiosErr?.message || 'Firmadan çıkarılamadı', severity: 'error' });
    }
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
      setSnackbar({ open: true, message: 'Rezervasyon kaydedildi. Misafir geldiğinde check-in yapılacak.', severity: 'success' });
    } catch (err) {
      console.error('Hızlı rezervasyon hatası:', err);
      setSnackbar({ open: true, message: 'Rezervasyon oluşturulamadı', severity: 'error' });
    }
  };

  const handleFolioAdd = async (data: FolioAddData) => {
    try {
      if (!room.reservationId) {
        console.error('Folio eklemek için aktif rezervasyon gerekli');
        return;
      }

      let apiFolio;

      if (data.isMinibarConsume && data.productId && data.quantity) {
        // Minibar — consume API çağır (stok düşer + folio otomatik oluşur)
        const result = await minibarApi.consume(room.id, {
          productId: data.productId,
          quantity: data.quantity,
          staffName: '',
        });
        apiFolio = result.folioItem;
      } else {
        // Normal folio ekleme
        apiFolio = await foliosApi.create({
          reservationId: room.reservationId,
          category: data.category,
          description: data.description,
          amount: data.amount,
          date: new Date().toISOString().split('T')[0],
        });
      }

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

      // Minibar ise oda bilgisini yenile (stok güncellendi)
      if (data.isMinibarConsume) {
        try {
          const updatedRoom = await roomsApi.getById(room.id);
          onRoomUpdate(room.id, { minibar: updatedRoom.minibar });
        } catch { /* minibar güncelleme hatası görmezden gel */ }
      }
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
          performedBy: currentUserName,
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
          agencyId: selectedAgencyId ? Number(selectedAgencyId) : null,
          agencyReservationCode: agencyReservationCode || '',
          totalAmount: nightlyRate ? Number(nightlyRate) : undefined,
        });
        // Gecelik ücret değiştiyse Room.price'ı da güncelle
        const newPrice = nightlyRate ? Number(nightlyRate) : room.price;
        if (newPrice !== room.price) {
          await roomsApi.updatePrice(room.id, newPrice!);
        }
        // State'i senkronize et
        onRoomUpdate(room.id, {
          reservationCheckIn: checkInDate ? new Date(checkInDate + 'T14:00:00').toISOString() : room.reservationCheckIn,
          reservationCheckOut: checkOutDate ? new Date(checkOutDate + 'T12:00:00').toISOString() : room.reservationCheckOut,
          notes: roomNote,
          price: newPrice,
        });
        setSnackbar({ open: true, message: 'Rezervasyon güncellendi.', severity: 'success' });
      } catch (err: unknown) {
        console.error('Rezervasyon güncelleme hatası:', err);
        const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
        setSnackbar({ open: true, message: axiosErr?.response?.data?.error || axiosErr?.message || 'Rezervasyon güncellenemedi', severity: 'error' });
      }
    } else {
      // Yeni rezervasyon oluştur
      const guests = room.guests || [];
      if (guests.length === 0) {
        setSnackbar({ open: true, message: 'Kaydetmek için en az 1 misafir eklemelisiniz.', severity: 'warning' });
        return;
      }
      try {
        await reservationsApi.create({
          roomId: room.id,
          guestId: guests[0].guestId,
          companyId: selectedCompanyId ? Number(selectedCompanyId) : undefined,
          agencyId: selectedAgencyId ? Number(selectedAgencyId) : undefined,
          agencyReservationCode: agencyReservationCode || undefined,
          checkIn: checkInDate || new Date().toISOString().split('T')[0],
          checkOut: checkOutDate || undefined,
          notes: roomNote,
        });
        // Misafirleri odaya ekle (addGuest check_in=now set eder → oda düzeninde görünür)
        for (const g of guests) {
          try { await roomsApi.addGuest(room.id, g.guestId); } catch { /* ilk misafir zaten var, güncellenir */ }
        }
        setSnackbar({ open: true, message: 'Rezervasyon kaydedildi.', severity: 'success' });
      } catch (err: unknown) {
        console.error('Rezervasyon kayıt hatası:', err);
        const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
        setSnackbar({ open: true, message: axiosErr?.response?.data?.error || axiosErr?.message || 'Rezervasyon kaydedilemedi', severity: 'error' });
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
        // Mevcut rezervasyon var → check-in'e çevir (UI'dan seçili firma+acenteyi geçir)
        await reservationsApi.checkIn(room.reservationId, {
          companyId: selectedCompanyId ? Number(selectedCompanyId) : null,
          agencyId: selectedAgencyId ? Number(selectedAgencyId) : null,
          agencyReservationCode: agencyReservationCode || '',
        });
        // Varsa ek misafirleri ekle
        for (let i = 1; i < guests.length; i++) {
          await roomsApi.addGuest(room.id, guests[i].guestId);
        }
      } else {
        // Rezervasyon yok → direkt check-in (UI'dan seçili firma+acenteyi geçir)
        await roomsApi.checkIn(room.id, {
          guestId: guests[0].guestId,
          notes: roomNote,
          checkOut: checkOutDate || undefined,
          companyId: selectedCompanyId ? Number(selectedCompanyId) : undefined,
          agencyId: selectedAgencyId ? Number(selectedAgencyId) : undefined,
          agencyReservationCode: agencyReservationCode || undefined,
        });
        for (let i = 1; i < guests.length; i++) {
          await roomsApi.addGuest(room.id, guests[i].guestId);
        }
      }
    } catch (err: unknown) {
      console.error('Check-in hatası:', err);
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      setSnackbar({ open: true, message: axiosErr?.response?.data?.error || axiosErr?.message || 'Check-in yapılamadı', severity: 'error' });
    }
  };

  const handleCheckOutClick = () => {
    if (folioTotal > 0) {
      setSnackbar({ open: true, message: `Odanın ${folioTotal.toLocaleString('tr-TR')} ₺ borcu bulunmaktadır. Lütfen ödeme yapınız.`, severity: 'warning' });
      return;
    }
    if (!hasPayment) {
      setSnackbar({ open: true, message: 'Bu konaklama için folio\'ya henüz ücret/ödeme eklenmemiş. Lütfen önce folio kayıtlarını oluşturup ödeme alınız.', severity: 'warning' });
      return;
    }
    setCheckoutConfirmOpen(true);
  };

  const handleCheckOutConfirm = async () => {
    setCheckoutLoading(true);
    try {
      await roomsApi.checkOut(room.id);
      setCheckoutConfirmOpen(false);
    } catch (err: unknown) {
      console.error('Check-out hatası:', err);
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      setSnackbar({ open: true, message: axiosErr?.response?.data?.error || axiosErr?.message || 'Check-out yapılamadı', severity: 'error' });
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
          performedBy: currentUserName,
        });
      } else {
        // Kapı müşterisi — checkout + available yap
        await roomsApi.checkOut(room.id);
        await roomsApi.updateStatus(room.id, ROOM_STATUS.AVAILABLE);
        await auditApi.create({
          roomId: room.id,
          action: 'checkin_reversed',
          description: `Oda ${room.roomNumber} check-in iptal edildi`,
          performedBy: currentUserName,
        });
      }
    } catch (err: unknown) {
      console.error('Check-in iptal hatası:', err);
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      setSnackbar({ open: true, message: axiosErr?.response?.data?.error || axiosErr?.message || 'Check-in iptal yapılamadı', severity: 'error' });
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
        performedBy: currentUserName,
      });
    } catch (err: unknown) {
      console.error('Check-out iptal hatası:', err);
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      setSnackbar({ open: true, message: axiosErr?.response?.data?.error || axiosErr?.message || 'Check-out iptal yapılamadı', severity: 'error' });
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
    } catch (err: unknown) {
      console.error('İptal hatası:', err);
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      setSnackbar({ open: true, message: axiosErr?.response?.data?.error || axiosErr?.message || 'İptal yapılamadı', severity: 'error' });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleNightlyRateChange = (value: string) => {
    setNightlyRate(value);
  };

  const handleNoteSave = () => { onRoomUpdate(room.id, { notes: roomNote.trim() || undefined }); };

  const handleGuestMenuAction = async (action: 'history' | 'card' | 'block' | 'remove' | 'checkout', guestId: number) => {
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
      } else if (action === 'checkout') {
        const guestName = (room.guests || []).find((g) => g.guestId === guestId)?.guestName || '';
        if (!window.confirm(`${guestName} için check-out yapılsın mı?`)) return;
        await roomsApi.checkOut(room.id, { guestId });
        await auditApi.create({
          roomId: room.id,
          action: 'guest_checkout',
          description: `${guestName} check-out yapıldı`,
          performedBy: currentUserName,
        });
        const now = new Date().toISOString();
        const updatedGuests = (room.guests || []).map((g) =>
          g.guestId === guestId ? { ...g, isActive: false, checkOut: now } : g
        );
        const activeGuests = updatedGuests.filter((g) => g.isActive !== false);
        onRoomUpdate(room.id, {
          guests: updatedGuests,
          guestName: activeGuests.map((g) => g.guestName).join(', ') || '',
        });
      } else if (action === 'remove') {
        const guestName = (room.guests || []).find((g) => g.guestId === guestId)?.guestName || '';
        if (!window.confirm(`${guestName} misafirini odadan çıkarmak istediğinize emin misiniz?`)) return;
        await roomsApi.removeGuest(room.id, guestId);
        await auditApi.create({
          roomId: room.id,
          action: 'guest_removed',
          description: `${guestName} misafiri odadan çıkarıldı`,
          performedBy: currentUserName,
        });
        const updatedGuests = (room.guests || []).filter((g) => g.guestId !== guestId);
        onRoomUpdate(room.id, {
          guests: updatedGuests,
          guestName: updatedGuests.map((g) => g.guestName).join(', ') || '',
          // Son misafir çıkarıldıysa oda 'dirty' olur (backend aynı şekilde set eder).
          ...(updatedGuests.length === 0 ? { status: ROOM_STATUS.DIRTY, reservationId: null, reservationCompanyId: null } : {}),
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

  /* === Hesaplamalar ===
   * Ödeme gibi davranan kategoriler folioTotal'dan düşer:
   *   - payment (nakit/kart)
   *   - account_transfer_debit (cariye borçlu aktar → oda borcu kapandı sayılır)
   *   - account_transfer_credit (cariye alacaklı aktar → fazla ödeme kredi oldu)
   *   - discount (indirim)
   */
  const PAYMENT_LIKE_CATEGORIES = new Set([
    'payment',
    'account_transfer_debit',
    'account_transfer_credit',
  ]);
  const folioTotal = folios.reduce((sum, f) => {
    if (f.category === 'discount') return sum - f.amount;
    if (PAYMENT_LIKE_CATEGORIES.has(f.category)) return sum - f.amount;
    return sum + f.amount;
  }, 0);

  const hasGuests = room.guests && room.guests.length > 0;
  const hasPayment = folios.some((f) => PAYMENT_LIKE_CATEGORIES.has(f.category));
  const isCheckInDisabled = !hasGuests;
  const isOccupied = room.status === ROOM_STATUS.OCCUPIED;

  /* Mevcut rezervasyonda değişiklik var mı? */
  const hasReservationChanges = !!room.reservationId && (
    checkInDate !== formatDateForInput(room.reservationCheckIn) ||
    checkOutDate !== formatDateForInput(room.reservationCheckOut) ||
    roomNote !== (room.notes || '') ||
    nightlyRate !== (room.price ? String(room.price) : '') ||
    selectedCompanyId !== (room.reservationCompanyId ? String(room.reservationCompanyId) : '') ||
    selectedAgencyId !== (room.reservationAgencyId ? String(room.reservationAgencyId) : '') ||
    agencyReservationCode !== (room.reservationAgencyCode || '')
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
        onCompanyChange={(compId: string) => {
          setSelectedCompanyId(compId);
          if (compId) {
            const comp = companies.find((c) => c.id === Number(compId));
            if (comp?.agreedRate) {
              setNightlyRate(String(comp.agreedRate));
            }
          }
        }}
        nightlyRate={nightlyRate}
        onNightlyRateChange={handleNightlyRateChange}
        companies={companies}
        agencies={agencies}
        selectedAgencyId={selectedAgencyId}
        onAgencyChange={setSelectedAgencyId}
        agencyReservationCode={agencyReservationCode}
        onAgencyReservationCodeChange={setAgencyReservationCode}
        folios={folios}
        folioTotal={folioTotal}
        onFolioDetailOpen={() => setFolioDetailOpen(true)}
        companyGuests={companyGuests}
        companyGuestsLoading={companyGuestsLoading}
        roomGuestIds={(room.guests || []).map((g) => g.guestId)}
        onSelectCompanyGuest={handleSelectCompanyGuest}
        onRemoveGuestFromCompany={handleOpenRemoveFromCompany}
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
        onRowClick={(reservationId) => setPastReservationId(reservationId)}
      />

      <PastReservationDialog
        open={!!pastReservationId}
        reservationId={pastReservationId}
        onClose={() => setPastReservationId(null)}
      />

      <ConfirmDialog
        open={!!removeFromCompanyTarget}
        title="Misafiri Firmadan Çıkar"
        message={
          removeFromCompanyTarget
            ? `${removeFromCompanyTarget.name} "${companies.find((c) => c.id === Number(selectedCompanyId))?.name || ''}" firmasından çıkarılacak. Emin misiniz?`
            : ''
        }
        confirmText="Çıkar"
        confirmColor="error"
        onConfirm={handleConfirmRemoveFromCompany}
        onCancel={() => setRemoveFromCompanyTarget(null)}
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
        defaultDescription={agencyReservationCode ? `Rez: ${agencyReservationCode}` : ''}
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
    </Box>
  );
};

export default RoomDetailContent;
