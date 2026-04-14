/**
 * Rezervasyon Listesi Sayfası
 *
 * Tüm rezervasyonları tablo ile listeler.
 * Durum, tarih, misafir bilgileri ve ödeme durumu gösterilir.
 * Satıra tıklanınca ilgili odanın detayı tab olarak açılır.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Button,
  Box,
  Chip,
  CircularProgress,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Hotel as HotelIcon,
  GroupWork as GroupIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Dayjs } from 'dayjs';

import { PageHeader, DataTable, StatusBadge, ConfirmDialog } from '../../components/common';
import { FilterPanel, DateRangePicker } from '../../components/forms';
import RoomDetailContent from '../../components/rooms/RoomDetailContent';
import usePermission from '../../hooks/usePermission';
import usePageTabs from '../../hooks/usePageTabs';
import { formatDate, formatCurrency } from '../../utils/formatters';
import {
  RESERVATION_FILTER_LABELS,
} from '../../utils/constants';
import { reservationsApi, roomsApi, companiesApi } from '../../api/services';
import type { ApiReservation, ApiRoom, ApiCompany, ApiRoomMinibarItem } from '../../api/services';

/* Alt bileşenler */
import ReservationDialogs from '../../components/reservations';
import type { NewReservationResult, BulkReservationResult } from '../../components/reservations';
import ReservationEditDialog from '../../components/reservations/ReservationEditDialog';
import PastReservationDialog from '../../components/rooms/roomdetail/PastReservationDialog';

/* ==================== TİPLER ==================== */

/** RoomDetailContent'in beklediği oda yapısı */
interface RoomForDetail {
  id: number;
  roomNumber: string;
  bedType: string;
  floor: number;
  capacity?: number;
  view?: string;
  price?: number;
  status: string;
  guestName?: string;
  guests?: { guestId: number; guestName: string; phone: string; checkIn: string; checkOut?: string; isActive: boolean }[];
  notes?: string;
  reservationId?: number | null;
  reservationCheckIn?: string | null;
  reservationCheckOut?: string | null;
  beds?: { type: string }[];
  minibar?: ApiRoomMinibarItem[];
}

interface RoomTab {
  roomId: number;
  roomNumber: string;
  guestName: string;
}

/* ==================== YARDIMCI ==================== */

/** ApiRoom → RoomForDetail dönüşümü */
const mapApiRoomToDetail = (r: ApiRoom): RoomForDetail => ({
  id: r.id,
  roomNumber: r.roomNumber,
  bedType: r.bedType,
  floor: r.floor,
  capacity: r.capacity,
  view: r.view,
  price: parseFloat(r.price) || 0,
  status: r.status,
  guestName: r.guestName ?? undefined,
  guests: r.guests?.map((g) => ({
    guestId: g.guestId,
    guestName: g.guestName,
    phone: g.phone,
    checkIn: g.checkIn,
    checkOut: g.checkOut ?? undefined,
    isActive: g.isActive,
  })),
  notes: r.notes ?? undefined,
  reservationId: r.reservationId,
  reservationCheckIn: r.reservationCheckIn,
  reservationCheckOut: r.reservationCheckOut,
  beds: r.beds,
  minibar: r.minibar,
});

/** Ödeme durumu hesapla */
const computePaymentStatus = (res: ApiReservation): string => {
  const total = parseFloat(res.totalAmount) || 0;
  const paid = parseFloat(res.paidAmount) || 0;
  if (total <= 0) return 'unpaid';
  if (paid >= total) return 'paid';
  if (paid > 0) return 'partial';
  return 'unpaid';
};

/* ==================== KOLON TANIMLARI ==================== */

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'Rez. No',
    width: 100,
    renderCell: (params: GridRenderCellParams) => (
      <strong style={{ color: '#1565C0' }}>#{params.value}</strong>
    ),
  },
  {
    field: 'guestNames',
    headerName: 'Misafir',
    width: 180,
    flex: 1,
    valueGetter: (value: string | null) => value || '-',
  },
  {
    field: 'roomNumber',
    headerName: 'Oda',
    width: 80,
    align: 'center' as const,
    headerAlign: 'center' as const,
  },
  {
    field: 'checkIn',
    headerName: 'Giriş',
    width: 120,
    valueGetter: (value: string | null) => value ? formatDate(value) : '-',
  },
  {
    field: 'checkOut',
    headerName: 'Çıkış',
    width: 120,
    valueGetter: (value: string | null) => value ? formatDate(value) : '-',
  },
  {
    field: 'totalAmount',
    headerName: 'Toplam',
    width: 130,
    renderCell: (params: GridRenderCellParams) =>
      formatCurrency(parseFloat(params.value) || 0),
  },
  {
    field: 'paidAmount',
    headerName: 'Ödenen',
    width: 130,
    renderCell: (params: GridRenderCellParams) =>
      formatCurrency(parseFloat(params.value) || 0),
  },
  {
    field: 'status',
    headerName: 'Durum',
    width: 130,
    renderCell: (params: GridRenderCellParams) => (
      <StatusBadge status={params.value} type="reservation" />
    ),
  },
  {
    field: 'paymentStatus',
    headerName: 'Ödeme',
    width: 120,
    renderCell: (params: GridRenderCellParams) => (
      <StatusBadge status={params.value} type="payment" />
    ),
  },
  {
    field: 'companyName',
    headerName: 'Firma',
    width: 140,
    renderCell: (params: GridRenderCellParams) =>
      params.value ? (
        <Chip label={params.value} size="small" color="secondary" variant="outlined" sx={{ fontSize: '0.7rem' }} />
      ) : '-',
  },
  {
    field: 'createdByStaff',
    headerName: 'Personel',
    width: 120,
    valueGetter: (value: string | null) => value || '-',
  },
];

/* ==================== ANA BİLEŞEN ==================== */

interface Filters {
  filter: string;
  dateStart: Dayjs | null;
  dateEnd: Dayjs | null;
}

const ReservationList: React.FC = () => {
  const { canManageReservations } = usePermission();

  /* API verileri */
  const [reservations, setReservations] = useState<ApiReservation[]>([]);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Dialog state'leri */
  const [newResDialogOpen, setNewResDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  /* Düzenle / İptal state'leri */
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editReservation, setEditReservation] = useState<ApiReservation | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<ApiReservation | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  /* Tab state */
  const [openTabs, setOpenTabs] = useState<RoomTab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1);

  /* Geçmiş rezervasyon dialog state */
  const [pastResDialogOpen, setPastResDialogOpen] = useState(false);
  const [pastResId, setPastResId] = useState<number | null>(null);

  /* Filtre state'leri */
  const [filters, setFilters] = useState<Filters>({
    filter: '',
    dateStart: null,
    dateEnd: null,
  });

  /* Oda ve firma verilerini bir kere yükle */
  useEffect(() => {
    roomsApi.getAll()
      .then((data) => setRooms(data))
      .catch((err) => console.error('Odalar yüklenemedi:', err));
    companiesApi.getAll()
      .then((data) => setCompanies(data))
      .catch((err) => console.error('Firmalar yüklenemedi:', err));
  }, []);

  /* Rezervasyonları yükle (filtre değişince tekrar) */
  const fetchReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiFilters: {
        filter?: string;
        dateFrom?: string;
        dateTo?: string;
      } = {};

      if (filters.filter) {
        apiFilters.filter = filters.filter;
      }
      if (filters.dateStart) {
        apiFilters.dateFrom = filters.dateStart.format('YYYY-MM-DD');
      }
      if (filters.dateEnd) {
        apiFilters.dateTo = filters.dateEnd.format('YYYY-MM-DD');
      }

      const data = await reservationsApi.getAll(apiFilters);
      setReservations(data);
    } catch (err) {
      console.error('Rezervasyonlar yüklenemedi:', err);
      setError('Rezervasyonlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [filters.filter, filters.dateStart, filters.dateEnd]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  /** Filtre değişikliğini işle */
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  /** Tüm filtreleri temizle */
  const handleClearFilters = () => {
    setFilters({ filter: '', dateStart: null, dateEnd: null });
  };

  /** Rezervasyon satırına tıklayınca:
   *   - Pasif rezervasyon (checked_out / cancelled / isActive=false) → PastReservationDialog
   *   - Aktif rezervasyon (checked_in / reserved) → oda detay tab'ı
   * Pasif rezervasyon için oda açılırsa o odanın ŞU ANKİ durumu gösterilir;
   * ama kullanıcı tıkladığı rezervasyonun misafirleri/folio'sunu görmek ister.
   * Bu yüzden pasif rezervasyonlar dialog'da açılır.
   */
  const handleRowClick = (row: { id: string | number; [key: string]: unknown }) => {
    const reservation = reservations.find((r) => r.id === row.id);
    if (!reservation) return;

    const isPast = !reservation.isActive
      || reservation.status === 'checked_out'
      || reservation.status === 'cancelled';

    if (isPast) {
      setPastResId(reservation.id);
      setPastResDialogOpen(true);
      return;
    }

    const room = rooms.find((r) => r.roomNumber === reservation.roomNumber);
    if (!room) return;

    const existingIndex = openTabs.findIndex((t) => t.roomId === room.id);
    if (existingIndex !== -1) {
      setActiveTabIndex(existingIndex);
    } else {
      const newTab: RoomTab = {
        roomId: room.id,
        roomNumber: room.roomNumber,
        guestName: reservation.guestNames || '-',
      };
      setOpenTabs((prev) => [...prev, newTab]);
      setActiveTabIndex(openTabs.length);
    }
  };

  /** Tab kapat */
  const handleTabClose = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setOpenTabs((prev) => prev.filter((_, i) => i !== index));
    if (activeTabIndex === index) {
      setActiveTabIndex(-1);
    } else if (activeTabIndex > index) {
      setActiveTabIndex((prev) => prev - 1);
    }
  };

  /** Oda güncelle (tab içi kullanım — state güncelle) */
  /* WebSocket zaten günceller, burada sadece refetch */
  const handleRoomUpdate = (_roomId: number, _updates: Record<string, unknown>) => {
    roomsApi.getAll().then(setRooms).catch(() => {});
  };

  /** Yeni tek rezervasyon kaydet (dialog'dan) */
  const handleNewReservationSave = async (result: NewReservationResult) => {
    // Dialog'dan dönen verilerle listeyi yenile
    void result;
    setNewResDialogOpen(false);
    fetchReservations();
  };

  /** Toplu rezervasyon kaydet (dialog'dan) */
  const handleBulkSave = async (result: BulkReservationResult) => {
    void result;
    setBulkDialogOpen(false);
    fetchReservations();
  };

  /** Aktif tab'ın odası */
  const activeApiRoom = activeTabIndex >= 0 && activeTabIndex < openTabs.length
    ? rooms.find((r) => r.id === openTabs[activeTabIndex].roomId)
    : null;

  const activeRoom: RoomForDetail | null = activeApiRoom
    ? mapApiRoomToDetail(activeApiRoom)
    : null;

  /** DataGrid satırları: paymentStatus ekleniyor */
  const tableRows = reservations.map((res) => ({
    ...res,
    paymentStatus: computePaymentStatus(res),
  }));

  /** Filtre tanımları */
  const filterConfig = [
    {
      id: 'filter',
      label: 'Filtre',
      options: Object.entries(RESERVATION_FILTER_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      value: filters.filter,
      onChange: (value: string) => handleFilterChange('filter', value),
    },
  ];

  const resHeaderTabs = openTabs.map((tab) => ({
    key: `room-${tab.roomId}`,
    icon: <HotelIcon sx={{ fontSize: 16 }} />,
    label: `Oda ${tab.roomNumber}`,
    badge: tab.guestName,
  }));

  const handleBackToList = useCallback(() => setActiveTabIndex(-1), []);

  usePageTabs({
    tabs: resHeaderTabs,
    activeTabIndex,
    onTabChange: setActiveTabIndex,
    onTabClose: handleTabClose,
    onBackToList: handleBackToList,
  });

  /** Rezervasyon düzenle */
  const handleEditClick = (row: ApiReservation) => {
    setEditReservation(row);
    setEditDialogOpen(true);
  };

  /** Rezervasyon iptal onay dialog'u aç */
  const handleCancelClick = (row: ApiReservation) => {
    setCancelTarget(row);
    setCancelDialogOpen(true);
  };

  /** Rezervasyon iptal onayla */
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await reservationsApi.cancel(cancelTarget.id);
      fetchReservations();
      setCancelDialogOpen(false);
      setCancelTarget(null);
    } catch (err: unknown) {
      console.error('Rezervasyon iptal hatası:', err);
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      setSnackbar({ open: true, message: axiosErr?.response?.data?.error || axiosErr?.message || 'Rezervasyon iptal edilemedi', severity: 'error' });
    } finally {
      setCancelLoading(false);
    }
  };

  /** Düzenleme kaydet */
  const handleEditSave = () => {
    setEditDialogOpen(false);
    setEditReservation(null);
    fetchReservations();
  };

  /** İşlem kolonunu dahil eden kolon listesi */
  const allColumns: GridColDef[] = [
    ...columns,
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => {
        const row = params.row as ApiReservation;
        const isDisabled = row.status === 'cancelled' || row.status === 'checked_out';
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button
              size="small"
              sx={{ minWidth: 32, p: 0.5 }}
              onClick={(e) => { e.stopPropagation(); handleEditClick(row); }}
              disabled={isDisabled}
            >
              <EditIcon fontSize="small" />
            </Button>
            <Button
              size="small"
              color="error"
              sx={{ minWidth: 32, p: 0.5 }}
              onClick={(e) => { e.stopPropagation(); handleCancelClick(row); }}
              disabled={isDisabled}
            >
              <CancelIcon fontSize="small" />
            </Button>
          </Box>
        );
      },
    },
  ];

  /** Dialog'a gönderilecek oda listesi (price: number olmalı) */
  const dialogRooms = rooms.map((r) => ({
    id: r.id,
    roomNumber: r.roomNumber,
    bedType: r.bedType,
    floor: r.floor,
    price: parseFloat(r.price) || 0,
    status: r.status,
  }));

  return (
    <div>
      <PageHeader
        title="Rezervasyonlar"
        subtitle={`${tableRows.length} rezervasyon`}
        actions={
          canManageReservations && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setNewResDialogOpen(true)}
              >
                Yeni Rezervasyon
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<GroupIcon />}
                onClick={() => setBulkDialogOpen(true)}
              >
                Toplu Rezervasyon
              </Button>
            </Box>
          )
        }
      />

      {/* Aktif Tab İçeriği veya Liste */}
      {activeTabIndex >= 0 && activeRoom ? (
        <RoomDetailContent key={activeRoom.id} room={activeRoom} onRoomUpdate={handleRoomUpdate} onClose={handleBackToList} />
      ) : (
        <>
          {/* Filtreler */}
          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
            <FilterPanel
              filters={filterConfig}
              onClearAll={handleClearFilters}
            />
            <DateRangePicker
              startDate={filters.dateStart}
              endDate={filters.dateEnd}
              onStartChange={(date) => setFilters((prev) => ({ ...prev, dateStart: date }))}
              onEndChange={(date) => setFilters((prev) => ({ ...prev, dateEnd: date }))}
              startLabel="Başlangıç"
              endLabel="Bitiş"
            />
          </Box>

          {/* Yükleniyor */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }} color="text.secondary">
                Rezervasyonlar yükleniyor...
              </Typography>
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="error">{error}</Typography>
              <Button onClick={fetchReservations} sx={{ mt: 2 }}>
                Tekrar Dene
              </Button>
            </Box>
          ) : (
            /* Rezervasyon tablosu */
            <DataTable
              rows={tableRows}
              columns={allColumns}
              onRowClick={handleRowClick}
              searchable
              searchPlaceholder="Misafir adı veya oda numarası ara..."
            />
          )}
        </>
      )}

      {/* Dialog bileşenleri */}
      <ReservationDialogs
        rooms={dialogRooms}
        newResDialogOpen={newResDialogOpen}
        onNewResClose={() => setNewResDialogOpen(false)}
        onNewResSave={handleNewReservationSave}
        bulkDialogOpen={bulkDialogOpen}
        onBulkClose={() => setBulkDialogOpen(false)}
        onBulkSave={handleBulkSave}
      />

      {/* Rezervasyon İptal Onay Dialog */}
      <ConfirmDialog
        open={cancelDialogOpen}
        title="Rezervasyon İptal"
        message={`#${cancelTarget?.id} numaralı rezervasyonu iptal etmek istediğinize emin misiniz?`}
        confirmText="İptal Et"
        confirmColor="error"
        onConfirm={handleCancelConfirm}
        onCancel={() => { setCancelDialogOpen(false); setCancelTarget(null); }}
        loading={cancelLoading}
      />

      {/* Rezervasyon Düzenle Dialog */}
      <ReservationEditDialog
        open={editDialogOpen}
        onClose={() => { setEditDialogOpen(false); setEditReservation(null); }}
        reservation={editReservation}
        rooms={dialogRooms}
        companies={companies}
        onSave={handleEditSave}
      />

      {/* Geçmiş Rezervasyon Detay Dialog */}
      <PastReservationDialog
        open={pastResDialogOpen}
        reservationId={pastResId}
        onClose={() => { setPastResDialogOpen(false); setPastResId(null); }}
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
    </div>
  );
};

export default ReservationList;
