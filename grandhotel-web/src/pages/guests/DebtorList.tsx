/**
 * Borçlular Sayfası
 *
 * Tüm açık cari hesap hareketlerini (debit + credit) tek DataGrid'de gösterir.
 *   - Debit (borçlu)   → pozitif amount, kırmızı
 *   - Credit (alacaklı) → negatif amount, yeşil
 * Satıra tıklayınca kaynak rezervasyon tab olarak açılır (ReservationList pattern'i).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
  Snackbar,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { Hotel as HotelIcon } from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

import { PageHeader, DataTable } from '../../components/common';
import RoomDetailContent from '../../components/rooms/RoomDetailContent';
import usePageTabs from '../../hooks/usePageTabs';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { accountTransactionsApi, roomsApi } from '../../api/services';
import type {
  ApiAccountTransaction,
  ApiRoom,
  ApiRoomMinibarItem,
  AccountTransactionDebtorListResponse,
} from '../../api/services';

/* ==================== TİPLER ==================== */

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
  reservationCompanyId?: number | null;
  reservationAgencyId?: number | null;
  reservationAgencyCode?: string | null;
  beds?: { type: string }[];
  minibar?: ApiRoomMinibarItem[];
}

interface RoomTab {
  roomId: number;
  roomNumber: string;
  guestName: string;
}

type TabFilter = 'all' | 'guest' | 'company_or_agency';

/* ==================== YARDIMCI ==================== */

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
  guests: r.guests?.filter((g) => g.guestId !== null && g.checkIn).map((g) => ({
    guestId: g.guestId as number,
    guestName: g.guestName,
    phone: g.phone,
    checkIn: g.checkIn as string,
    checkOut: g.checkOut ?? undefined,
    isActive: g.isActive,
  })),
  notes: r.notes ?? undefined,
  reservationId: r.reservationId,
  reservationCheckIn: r.reservationCheckIn,
  reservationCheckOut: r.reservationCheckOut,
  reservationCompanyId: r.reservationCompanyId,
  reservationAgencyId: r.reservationAgencyId,
  reservationAgencyCode: r.reservationAgencyCode,
  beds: r.beds,
  minibar: r.minibar,
});

/** Hedef türü → Türkçe etiket */
const TARGET_TYPE_LABELS: Record<string, string> = {
  company: 'Firma',
  agency: 'Acente',
  guest: 'Şahıs',
};

/** Signed amount: debit=+, credit=− */
const signedAmount = (tx: ApiAccountTransaction) => {
  const a = parseFloat(tx.amount) || 0;
  return tx.type === 'credit' ? -a : a;
};

/* ==================== KOLON TANIMLARI ==================== */

const columns: GridColDef[] = [
  {
    field: 'createdAt',
    headerName: 'Tarih',
    width: 120,
    valueGetter: (value: string | null) => (value ? formatDate(value) : '-'),
  },
  {
    field: 'guestName',
    headerName: 'Ad Soyad',
    width: 180,
    flex: 1,
    valueGetter: (value: string) => value || '-',
  },
  {
    field: 'roomNumber',
    headerName: 'Oda',
    width: 80,
    align: 'center' as const,
    headerAlign: 'center' as const,
    valueGetter: (value: string) => value || '-',
  },
  {
    field: 'targetType',
    headerName: 'Hedef',
    width: 130,
    renderCell: (params: GridRenderCellParams) => {
      const tx = params.row as ApiAccountTransaction;
      const label = TARGET_TYPE_LABELS[tx.targetType || ''] || '—';
      const name = tx.targetName || '';
      const color: 'primary' | 'secondary' | 'default' =
        tx.targetType === 'company' ? 'secondary' : tx.targetType === 'agency' ? 'primary' : 'default';
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
          <Chip label={label} size="small" color={color} variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{name}</Typography>
        </Box>
      );
    },
  },
  {
    field: 'description',
    headerName: 'Açıklama',
    width: 200,
    flex: 1,
    valueGetter: (value: string) => value || '-',
  },
  {
    field: 'amount',
    headerName: 'Tutar',
    width: 140,
    valueGetter: (_value: unknown, row: ApiAccountTransaction) => signedAmount(row),
    renderCell: (params: GridRenderCellParams) => {
      const tx = params.row as ApiAccountTransaction;
      const isCredit = tx.type === 'credit';
      return (
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: isCredit ? 'success.main' : 'error.main' }}
        >
          {isCredit ? '−' : '+'}{formatCurrency(parseFloat(tx.amount) || 0)}
        </Typography>
      );
    },
  },
  {
    field: 'status',
    headerName: 'Durum',
    width: 100,
    renderCell: (params: GridRenderCellParams) => (
      <Chip
        label={params.value === 'open' ? 'Açık' : 'Kapandı'}
        size="small"
        color={params.value === 'open' ? 'warning' : 'success'}
        variant="outlined"
      />
    ),
  },
];

/* ==================== ANA BİLEŞEN ==================== */

const DebtorList: React.FC = () => {
  const [data, setData] = useState<AccountTransactionDebtorListResponse | null>(null);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<TabFilter>('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  /* Tab state — rezervasyon detayını sekmede göstermek için */
  const [openTabs, setOpenTabs] = useState<RoomTab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await accountTransactionsApi.getDebtorList();
      setData(res);
    } catch (err) {
      console.error('Borçlular yüklenemedi:', err);
      setError('Borçlular yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    roomsApi.getAll().then(setRooms).catch(() => {});
  }, [fetchData]);

  const allRows = data?.items || [];

  const filteredRows = allRows.filter((r) => {
    if (activeFilter === 'guest') return r.targetType === 'guest';
    if (activeFilter === 'company_or_agency') return r.targetType !== 'guest';
    return true;
  });

  const handleRowClick = (row: { id: string | number;[key: string]: unknown }) => {
    const tx = allRows.find((t) => t.id === row.id);
    if (!tx || !tx.sourceReservationId) {
      setSnackbar({ open: true, message: 'Kaynak rezervasyon bulunamadı', severity: 'error' });
      return;
    }

    const roomNumber = tx.roomNumber;
    const room = rooms.find((r) => r.roomNumber === roomNumber);
    if (!room) {
      setSnackbar({ open: true, message: 'Oda bulunamadı — veriler güncelleniyor', severity: 'error' });
      roomsApi.getAll().then(setRooms).catch(() => {});
      return;
    }

    const existingIndex = openTabs.findIndex((t) => t.roomId === room.id);
    if (existingIndex !== -1) {
      setActiveTabIndex(existingIndex);
    } else {
      const newTab: RoomTab = {
        roomId: room.id,
        roomNumber: room.roomNumber,
        guestName: tx.guestName || tx.targetName || '-',
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

  const handleBackToList = useCallback(() => {
    setActiveTabIndex(-1);
    fetchData();
  }, [fetchData]);

  /* Rezervasyon detayında bir oda güncellenince (folio eklendi vb.) listeyi tazele */
  const handleRoomUpdate = () => {
    roomsApi.getAll().then(setRooms).catch(() => {});
    fetchData();
  };

  const activeApiRoom = activeTabIndex >= 0 && activeTabIndex < openTabs.length
    ? rooms.find((r) => r.id === openTabs[activeTabIndex].roomId)
    : null;

  const activeRoom: RoomForDetail | null = activeApiRoom ? mapApiRoomToDetail(activeApiRoom) : null;

  const headerTabs = openTabs.map((tab) => ({
    key: `room-${tab.roomId}`,
    icon: <HotelIcon sx={{ fontSize: 16 }} />,
    label: `Oda ${tab.roomNumber}`,
    badge: tab.guestName,
  }));

  usePageTabs({
    tabs: headerTabs,
    activeTabIndex,
    onTabChange: setActiveTabIndex,
    onTabClose: handleTabClose,
    onBackToList: handleBackToList,
  });

  const summary = data?.summary;
  const netBalance = summary ? parseFloat(summary.netBalance) : 0;

  return (
    <div>
      <PageHeader
        title="Borçlular"
        subtitle={summary ? `${summary.count} açık kayıt · Net bakiye: ${formatCurrency(netBalance)}` : 'Yükleniyor...'}
      />

      {activeTabIndex >= 0 && activeRoom ? (
        <RoomDetailContent
          key={activeRoom.id}
          room={activeRoom}
          onRoomUpdate={handleRoomUpdate}
          onClose={handleBackToList}
        />
      ) : (
        <>
          {/* Özet kutuları */}
          {summary && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 180px', p: 2, borderRadius: 2, bgcolor: 'error.lighter', border: '1px solid', borderColor: 'error.light' }}>
                <Typography variant="caption" color="text.secondary">Toplam Borç (Debit)</Typography>
                <Typography variant="h6" color="error.main" sx={{ fontWeight: 700 }}>
                  {formatCurrency(parseFloat(summary.debitTotal))}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 180px', p: 2, borderRadius: 2, bgcolor: 'success.lighter', border: '1px solid', borderColor: 'success.light' }}>
                <Typography variant="caption" color="text.secondary">Toplam Alacak (Credit)</Typography>
                <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                  {formatCurrency(parseFloat(summary.creditTotal))}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 180px', p: 2, borderRadius: 2, bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">Net Bakiye</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: netBalance > 0 ? 'error.main' : netBalance < 0 ? 'success.main' : 'text.primary' }}>
                  {formatCurrency(netBalance)}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Tab filtresi */}
          <Tabs
            value={activeFilter}
            onChange={(_e, v: TabFilter) => setActiveFilter(v)}
            sx={{ mb: 2 }}
          >
            <Tab label={`Tümü (${allRows.length})`} value="all" />
            <Tab label={`Şahıs (${allRows.filter((r) => r.targetType === 'guest').length})`} value="guest" />
            <Tab label={`Firma/Acente (${allRows.filter((r) => r.targetType !== 'guest').length})`} value="company_or_agency" />
          </Tabs>

          {/* Tablo */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }} color="text.secondary">Borçlular yükleniyor...</Typography>
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="error">{error}</Typography>
              <Button onClick={fetchData} sx={{ mt: 2 }}>Tekrar Dene</Button>
            </Box>
          ) : (
            <DataTable
              rows={filteredRows.map((r) => ({ ...r }))}
              columns={columns}
              onRowClick={handleRowClick}
              searchable
              searchPlaceholder="Ad, oda no veya açıklama ara..."
            />
          )}
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default DebtorList;
