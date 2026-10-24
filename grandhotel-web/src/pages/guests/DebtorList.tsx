/**
 * Borçlular Sayfası
 *
 * Cari bakiyesi olan her firma / acente / şahıs tek satır (backend
 * GET /account-transactions/debtors/): açık konaklama sayısı, en eski borç, bakiye, avans.
 * Satıra tıklayınca borçlu sekmede açılır: borç kutucukları (DebtCards — konaklama başına,
 * seçip tahsilat) ve altında cari hesap ekstresi (geçmiş, avans tahsilatı, iptal).
 *
 * "Konaklayan" sekmesi: henüz çıkış yapmamış, folio borcu (harcama > ödenen) olan odalar
 * (GET /reservations/?filter=in_house_unpaid). Satır → oda detayı (folio, ödeme al).
 * Mobil karşılığı: GrandHotelMobil/src/screens/tasks/DebtorsScreen.tsx
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Hotel as HotelIcon,
  Person as PersonIcon,
  Public as AgencyIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import dayjs from 'dayjs';

import { PageHeader, DataTable } from '../../components/common';
import DebtCards from '../../components/debtors/DebtCards';
import AccountTransactionTable from '../../components/debtors/AccountTransactionTable';
import RoomDetailById from '../../components/rooms/RoomDetailById';
import usePageTabs from '../../hooks/usePageTabs';
import useNotification from '../../hooks/useNotification';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { getApiErrorMessage } from '../../utils/apiError';
import { accountTransactionsApi, reservationsApi } from '../../api/services';
import type { ApiReservation, CariDebtorPartyRow, CariDebtorsResponse, CariTargetType } from '../../api/services';

/* ==================== TİPLER ==================== */

type TabFilter = 'all' | 'guest' | 'company_or_agency' | 'in_house';

interface PartyTab {
  kind: 'party';
  targetType: CariTargetType;
  id: number;
  name: string;
}

/** Konaklayan borçlu → oda detayı sekmesi */
interface RoomTab {
  kind: 'room';
  roomId: number;
  roomNumber: string;
  guestName: string;
}

type OpenTab = PartyTab | RoomTab;

type InHouseRow = ApiReservation & { [key: string]: unknown };

type DebtorRow = CariDebtorPartyRow & { rowId: string; [key: string]: unknown };

/* ==================== YARDIMCI ==================== */

const TARGET_TYPE_LABELS: Record<CariTargetType, string> = {
  company: 'Firma',
  agency: 'Acente',
  guest: 'Şahıs',
};

const TARGET_TYPE_COLORS: Record<CariTargetType, 'secondary' | 'primary' | 'default'> = {
  company: 'secondary',
  agency: 'primary',
  guest: 'default',
};

const TARGET_ICONS: Record<CariTargetType, React.ReactElement> = {
  company: <BusinessIcon sx={{ fontSize: 16 }} />,
  agency: <AgencyIcon sx={{ fontSize: 16 }} />,
  guest: <PersonIcon sx={{ fontSize: 16 }} />,
};

const num = (v: string | number | null | undefined) => parseFloat(String(v ?? 0)) || 0;

/** { company: 5 } / { agency: 3 } / { guest: 9 } */
const targetFilter = (t: PartyTab) => ({ [t.targetType]: t.id }) as { company?: number; agency?: number; guest?: number };

/* ==================== KOLON TANIMLARI ==================== */

const columns: GridColDef[] = [
  {
    field: 'targetType',
    headerName: 'Tür',
    width: 100,
    renderCell: (params: GridRenderCellParams) => {
      const type = params.value as CariTargetType;
      return <Chip label={TARGET_TYPE_LABELS[type]} size="small" color={TARGET_TYPE_COLORS[type]} variant="outlined" />;
    },
  },
  {
    field: 'name',
    headerName: 'Borçlu',
    flex: 1,
    minWidth: 200,
    renderCell: (params: GridRenderCellParams) => <strong>{params.value as string}</strong>,
  },
  {
    field: 'phone',
    headerName: 'Telefon',
    width: 140,
    valueGetter: (value: string) => value || '-',
  },
  {
    field: 'openCount',
    headerName: 'Açık Borç',
    width: 130,
    align: 'center' as const,
    headerAlign: 'center' as const,
    renderCell: (params: GridRenderCellParams) => `${params.value} konaklama`,
  },
  {
    field: 'oldestOpenAt',
    headerName: 'En Eski Borç',
    width: 150,
    renderCell: (params: GridRenderCellParams) => {
      if (!params.value) return '-';
      const days = dayjs().diff(dayjs(params.value as string), 'day');
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <Typography variant="body2">{formatDate(params.value as string)}</Typography>
          <Typography variant="caption" color={days > 30 ? 'error.main' : 'text.secondary'}>{days} gün önce</Typography>
        </Box>
      );
    },
  },
  {
    field: 'balance',
    headerName: 'Bakiye',
    width: 140,
    valueGetter: (value: string) => num(value),
    renderCell: (params: GridRenderCellParams) => (
      <Typography variant="body2" component="span" sx={{ fontWeight: 700, color: 'error.main' }}>
        {formatCurrency(params.value as number)}
      </Typography>
    ),
  },
  {
    field: 'unallocatedCredit',
    headerName: 'Avans',
    width: 120,
    valueGetter: (value: string) => num(value),
    renderCell: (params: GridRenderCellParams) => ((params.value as number) > 0 ? formatCurrency(params.value as number) : '-'),
  },
];

/** Konaklayan (çıkış yapmamış) borçlular — folio borcu olan odalar */
const inHouseColumns: GridColDef[] = [
  {
    field: 'roomNumber',
    headerName: 'Oda',
    width: 80,
    renderCell: (params: GridRenderCellParams) => <strong>{params.value as string}</strong>,
  },
  {
    field: 'guestNames',
    headerName: 'Misafir',
    flex: 1,
    minWidth: 180,
    valueGetter: (value: string | null, row: ApiReservation) => value || row.placeholderGuestName || '-',
  },
  {
    field: 'companyName',
    headerName: 'Firma / Acente',
    width: 160,
    valueGetter: (value: string | null, row: ApiReservation) => value || row.agencyName || '-',
  },
  {
    field: 'checkIn',
    headerName: 'Giriş',
    width: 110,
    valueGetter: (value: string | null) => formatDate(value),
  },
  {
    field: 'checkOut',
    headerName: 'Planlanan Çıkış',
    width: 130,
    valueGetter: (value: string | null) => formatDate(value),
  },
  {
    field: 'totalAmount',
    headerName: 'Harcama',
    width: 120,
    valueGetter: (value: string) => num(value),
    renderCell: (params: GridRenderCellParams) => formatCurrency(params.value as number),
  },
  {
    field: 'paidAmount',
    headerName: 'Ödenen',
    width: 120,
    valueGetter: (value: string) => num(value),
    renderCell: (params: GridRenderCellParams) => formatCurrency(params.value as number),
  },
  {
    field: 'debt',
    headerName: 'Borç',
    width: 130,
    valueGetter: (_value: unknown, row: ApiReservation) => num(row.totalAmount) - num(row.paidAmount),
    renderCell: (params: GridRenderCellParams) => (
      <Typography variant="body2" component="span" sx={{ fontWeight: 700, color: 'error.main' }}>
        {formatCurrency(params.value as number)}
      </Typography>
    ),
  },
];

/* ==================== BORÇLU DETAYI (sekme) ==================== */

const PartyDebtView: React.FC<{ party: PartyTab; onChanged: () => void }> = ({ party, onChanged }) => {
  /* Kutucuklar ve ekstre birbirini tazeler (tahsilat / iptal) */
  const [debtsReload, setDebtsReload] = useState(0);
  const [statementReload, setStatementReload] = useState(0);
  const filter = targetFilter(party);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Chip
              size="small"
              icon={TARGET_ICONS[party.targetType]}
              label={TARGET_TYPE_LABELS[party.targetType]}
              color={TARGET_TYPE_COLORS[party.targetType]}
              variant="outlined"
            />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{party.name}</Typography>
          </Box>
          <DebtCards
            target={filter}
            reloadToken={debtsReload}
            onChanged={() => { setStatementReload((t) => t + 1); onChanged(); }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <AccountTransactionTable
            filter={filter}
            reloadToken={statementReload}
            onChanged={() => { setDebtsReload((t) => t + 1); onChanged(); }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

/* ==================== ANA BİLEŞEN ==================== */

const DebtorList: React.FC = () => {
  const { showError } = useNotification();
  const [data, setData] = useState<CariDebtorsResponse | null>(null);
  const [inHouse, setInHouse] = useState<ApiReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TabFilter>('all');

  /* Sekmeler — borçlu detayları / konaklayan odalar */
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [debtors, inHouseRows] = await Promise.all([
        accountTransactionsApi.getDebtors(),
        reservationsApi.getAll({ filter: 'in_house_unpaid' }),
      ]);
      setData(debtors);
      setInHouse(inHouseRows);
    } catch (err) {
      setError(true);
      showError(getApiErrorMessage(err, 'Borçlular yüklenemedi'));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allRows: DebtorRow[] = (data?.items || []).map((r) => ({ ...r, rowId: `${r.targetType}-${r.id}` }));
  const filteredRows = allRows.filter((r) => {
    if (activeFilter === 'guest') return r.targetType === 'guest';
    if (activeFilter === 'company_or_agency') return r.targetType !== 'guest';
    return true;
  });
  const guestCount = allRows.filter((r) => r.targetType === 'guest').length;
  const inHouseRows: InHouseRow[] = inHouse.map((r) => ({ ...r }));
  const inHouseTotal = inHouse.reduce((s, r) => s + num(r.totalAmount) - num(r.paidAmount), 0);

  const handleRowClick = (row: { id: string | number; [key: string]: unknown }) => {
    const r = row as unknown as DebtorRow;
    openTab(
      (t) => t.kind === 'party' && t.targetType === r.targetType && t.id === r.id,
      { kind: 'party', targetType: r.targetType, id: r.id, name: r.name },
    );
  };

  const handleInHouseClick = (row: { id: string | number; [key: string]: unknown }) => {
    const r = row as unknown as ApiReservation;
    openTab(
      (t) => t.kind === 'room' && t.roomId === r.roomId,
      { kind: 'room', roomId: r.roomId, roomNumber: r.roomNumber, guestName: r.guestNames || r.placeholderGuestName || '' },
    );
  };

  const openTab = (matches: (t: OpenTab) => boolean, tab: OpenTab) => {
    const existingIndex = openTabs.findIndex(matches);
    if (existingIndex !== -1) {
      setActiveTabIndex(existingIndex);
      return;
    }
    setOpenTabs((prev) => [...prev, tab]);
    setActiveTabIndex(openTabs.length);
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

  usePageTabs({
    tabs: openTabs.map((t) => (t.kind === 'party'
      ? { key: `${t.targetType}-${t.id}`, icon: TARGET_ICONS[t.targetType], label: t.name, badge: TARGET_TYPE_LABELS[t.targetType] }
      : { key: `room-${t.roomId}`, icon: <HotelIcon sx={{ fontSize: 16 }} />, label: `Oda ${t.roomNumber}`, badge: t.guestName })),
    activeTabIndex,
    onTabChange: setActiveTabIndex,
    onTabClose: handleTabClose,
    onBackToList: handleBackToList,
  });

  const summary = data?.summary;
  const activeTab = activeTabIndex >= 0 && activeTabIndex < openTabs.length ? openTabs[activeTabIndex] : null;

  return (
    <div>
      <PageHeader
        title="Borçlular"
        subtitle={summary
          ? `${summary.count} cari borçlu · ${inHouse.length} konaklayan borçlu · Toplam ${formatCurrency(num(summary.totalBalance) + inHouseTotal)}`
          : 'Yükleniyor...'}
      />

      {activeTab?.kind === 'party' ? (
        <PartyDebtView key={`${activeTab.targetType}-${activeTab.id}`} party={activeTab} onChanged={fetchData} />
      ) : activeTab?.kind === 'room' ? (
        <RoomDetailById key={`room-${activeTab.roomId}`} roomId={activeTab.roomId} onClose={handleBackToList} onChanged={fetchData} />
      ) : (
        <>
          {/* Özet kutuları */}
          {summary && (
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 180px', p: 2, borderRadius: 2, bgcolor: (t) => alpha(t.palette.error.main, 0.08), border: '1px solid', borderColor: 'error.light' }}>
                <Typography variant="caption" color="text.secondary">Cari Borç (çıkış yapmış)</Typography>
                <Typography variant="h6" color="error.main" sx={{ fontWeight: 700 }}>
                  {formatCurrency(num(summary.totalBalance))}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 180px', p: 2, borderRadius: 2, bgcolor: (t) => alpha(t.palette.error.main, 0.08), border: '1px solid', borderColor: 'error.light' }}>
                <Typography variant="caption" color="text.secondary">Konaklayanların Borcu ({inHouse.length} oda)</Typography>
                <Typography variant="h6" color="error.main" sx={{ fontWeight: 700 }}>
                  {formatCurrency(inHouseTotal)}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 180px', p: 2, borderRadius: 2, bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">Cari Borçlu</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{summary.count}</Typography>
              </Box>
              <Box sx={{ flex: '1 1 180px', p: 2, borderRadius: 2, bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">Açık Konaklama Borcu</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{summary.openCount}</Typography>
              </Box>
            </Box>
          )}

          <Tabs value={activeFilter} onChange={(_e, v: TabFilter) => setActiveFilter(v)} sx={{ mb: 2 }}>
            <Tab label={`Tümü (${allRows.length})`} value="all" />
            <Tab label={`Şahıs (${guestCount})`} value="guest" />
            <Tab label={`Firma/Acente (${allRows.length - guestCount})`} value="company_or_agency" />
            <Tab label={`Konaklayan (${inHouse.length})`} value="in_house" sx={{ color: 'error.main' }} />
          </Tabs>

          {error && !data ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="error">Borçlular yüklenirken bir hata oluştu.</Typography>
              <Button onClick={fetchData} sx={{ mt: 2 }}>Tekrar Dene</Button>
            </Box>
          ) : activeFilter === 'in_house' ? (
            <DataTable
              rows={inHouseRows}
              columns={inHouseColumns}
              loading={loading}
              onRowClick={handleInHouseClick}
              searchable
              searchPlaceholder="Oda, misafir veya firma ara..."
            />
          ) : (
            <DataTable
              rows={filteredRows}
              columns={columns}
              loading={loading}
              getRowId={(r) => (r as DebtorRow).rowId}
              onRowClick={handleRowClick}
              searchable
              searchPlaceholder="Borçlu adı, telefon veya vergi no ara..."
            />
          )}
        </>
      )}
    </div>
  );
};

export default DebtorList;
