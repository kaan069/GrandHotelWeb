/**
 * Müşteri Listesi Sayfası
 *
 * Tüm müşterileri DataGrid ile listeler.
 * Müşteriye tıklanınca tab açılır, müşteri detayı ve konaklama geçmişi gösterilir.
 * Tab'lar Header (AppBar) içinde gösterilir.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  History as HistoryIcon,
  Business as BusinessIcon,
  Hotel as HotelIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

import { PageHeader, DataTable, StayDetailContent } from '../../components/common';
import { Guest, Company, StayHistory } from '../../utils/constants';
import { guestsApi, companiesApi } from '../../api/services';
import { formatDate, formatCurrency, formatPhone, maskIdentity } from '../../utils/formatters';
import usePageTabs from '../../hooks/usePageTabs';

interface GuestRow extends Guest {
  [key: string]: unknown;
}

interface GuestTabItem {
  type: 'guest';
  guestId: number;
  guestName: string;
}

interface StayTabItem {
  type: 'stay';
  stay: StayHistory;
  label: string;
}

type TabItem = GuestTabItem | StayTabItem;

const GuestList: React.FC = () => {
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTabs, setOpenTabs] = useState<TabItem[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [guestsData, companiesData] = await Promise.all([
          guestsApi.getAll(),
          companiesApi.getAll(),
        ]);
        setGuests(guestsData as GuestRow[]);
        setCompanies(companiesData as Company[]);
      } catch (err) {
        console.error('Müşteri verileri yüklenirken hata:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 60,
      align: 'center' as const,
      headerAlign: 'center' as const,
    },
    {
      field: 'fullName',
      headerName: 'Ad Soyad',
      width: 180,
      flex: 1,
      valueGetter: (_value: unknown, row: GuestRow) => `${row.firstName} ${row.lastName}`,
      renderCell: (params: GridRenderCellParams) => (
        <strong style={{ color: '#1565C0' }}>{params.value}</strong>
      ),
    },
    {
      field: 'tcNo',
      headerName: 'TC Kimlik',
      width: 140,
      renderCell: (params: GridRenderCellParams) => maskIdentity(params.value),
    },
    {
      field: 'phone',
      headerName: 'Telefon',
      width: 150,
      renderCell: (params: GridRenderCellParams) => formatPhone(params.value),
    },
    {
      field: 'email',
      headerName: 'E-posta',
      width: 180,
      flex: 1,
      renderCell: (params: GridRenderCellParams) => params.value || '-',
    },
    {
      field: 'companyId',
      headerName: 'Firma',
      width: 160,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.value) return '-';
        const company = companies.find((c) => c.id === params.value);
        return company ? (
          <Chip label={company.name} size="small" variant="outlined" />
        ) : '-';
      },
    },
    {
      field: 'createdAt',
      headerName: 'Kayıt Tarihi',
      width: 120,
      valueGetter: (value: string) => formatDate(value),
    },
  ];

  /** Müşteriye tıklayınca tab aç */
  const handleRowClick = (row: { id: string | number; [key: string]: unknown }) => {
    const guest = guests.find((g) => g.id === row.id);
    if (!guest) return;

    const existingIndex = openTabs.findIndex((t) => t.type === 'guest' && t.guestId === guest.id);
    if (existingIndex !== -1) {
      setActiveTabIndex(existingIndex);
    } else {
      const newTab: GuestTabItem = { type: 'guest', guestId: guest.id, guestName: `${guest.firstName} ${guest.lastName}` };
      setOpenTabs((prev) => [...prev, newTab]);
      setActiveTabIndex(openTabs.length);
    }
  };

  /** Konaklama detayı tab aç */
  const handleStayClick = (stay: StayHistory) => {
    const existingIndex = openTabs.findIndex((t) => t.type === 'stay' && t.stay.id === stay.id);
    if (existingIndex !== -1) {
      setActiveTabIndex(existingIndex);
    } else {
      const newTab: StayTabItem = {
        type: 'stay',
        stay,
        label: `${stay.guestName} - Oda ${stay.roomNumber}`,
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

  /** Aktif tab */
  const activeTab = activeTabIndex >= 0 && activeTabIndex < openTabs.length ? openTabs[activeTabIndex] : null;
  const activeGuest = activeTab?.type === 'guest'
    ? guests.find((g) => g.id === activeTab.guestId)
    : null;

  /** Header tab'ları (AppBar'a iletilir) */
  const headerTabs = openTabs.map((tab) => ({
    key: tab.type === 'guest' ? `g-${tab.guestId}` : `s-${tab.stay.id}`,
    icon: tab.type === 'guest' ? <PersonIcon sx={{ fontSize: 16 }} /> : <HotelIcon sx={{ fontSize: 16 }} />,
    label: tab.type === 'guest' ? tab.guestName : tab.label,
  }));

  const handleBackToList = useCallback(() => setActiveTabIndex(-1), []);

  usePageTabs({
    tabs: headerTabs,
    activeTabIndex,
    onTabChange: setActiveTabIndex,
    onTabClose: handleTabClose,
    onBackToList: handleBackToList,
  });

  return (
    <div>
      <PageHeader
        title="Müşteri Listesi"
        subtitle={`Toplam ${guests.length} müşteri`}
      />

      {/* Aktif Tab İçeriği veya Liste */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : activeTab?.type === 'stay' ? (
        <StayDetailContent stay={activeTab.stay} />
      ) : activeTabIndex >= 0 && activeGuest ? (
        <GuestDetailContent guest={activeGuest} companies={companies} onStayClick={handleStayClick} />
      ) : (
        <DataTable
          rows={guests}
          columns={columns}
          onRowClick={handleRowClick}
          searchable
          searchPlaceholder="Ad, soyad veya TC ile ara..."
        />
      )}
    </div>
  );
};

/* ==================== Müşteri Detay İçeriği ==================== */

interface GuestDetailContentProps {
  guest: Guest;
  companies: Company[];
  onStayClick: (stay: StayHistory) => void;
}

const GuestDetailContent: React.FC<GuestDetailContentProps> = ({ guest, companies, onStayClick }) => {
  const [stayHistory, setStayHistory] = useState<StayHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const data = await guestsApi.stayHistory(guest.id);
        setStayHistory(data as unknown as StayHistory[]);
      } catch (err) {
        console.error('Konaklama geçmişi yüklenirken hata:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [guest.id]);

  const company = guest.companyId ? companies.find((c) => c.id === guest.companyId) : null;

  const totalSpent = stayHistory.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPaid = stayHistory.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const totalDebt = totalSpent - totalPaid;
  const totalNights = stayHistory.reduce((sum, s) => {
    const diffTime = new Date(s.checkOut).getTime() - new Date(s.checkIn).getTime();
    return sum + Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, 0);

  return (
    <Box>
      {/* Müşteri Başlık */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <PersonIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" fontWeight={600}>
          {guest.firstName} {guest.lastName}
        </Typography>
        {company && (
          <Chip icon={<BusinessIcon sx={{ fontSize: 14 }} />} label={company.name} size="small" variant="outlined" />
        )}
      </Box>

      <Grid container spacing={2.5}>
        {/* Sol - Müşteri Bilgileri */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Kişisel Bilgiler
              </Typography>
              <InfoRow label="TC Kimlik" value={guest.tcNo} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Telefon" value={formatPhone(guest.phone)} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="E-posta" value={guest.email || '-'} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Firma" value={company?.name || '-'} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Kayıt Tarihi" value={formatDate(guest.createdAt)} />

              {/* Özet İstatistikler */}
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Konaklama Özeti
              </Typography>
              {loadingHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <>
                  <InfoRow label="Toplam Konaklama" value={`${stayHistory.length} kez`} />
                  <Divider sx={{ my: 0.5 }} />
                  <InfoRow label="Toplam Gece" value={`${totalNights} gece`} />
                  <Divider sx={{ my: 0.5 }} />
                  <InfoRow label="Toplam Harcama" value={formatCurrency(totalSpent)} />
                  <Divider sx={{ my: 0.5 }} />
                  <InfoRow label="Toplam Ödeme" value={formatCurrency(totalPaid)} />
                  <Divider sx={{ my: 0.5 }} />
                  <InfoRow
                    label="Toplam Borç"
                    value={
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color={totalDebt > 0 ? 'error.main' : 'success.main'}
                      >
                        {formatCurrency(totalDebt)}
                      </Typography>
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sağ - Konaklama Geçmişi */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon sx={{ fontSize: 20 }} />
                Konaklama Geçmişi
              </Typography>

              {loadingHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : stayHistory.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Oda</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Giriş</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Çıkış</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Gece</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Firma</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Tutar</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Ödenen</TableCell>
                        <TableCell sx={{ fontWeight: 600 }} align="right">Bakiye</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stayHistory.map((stay) => {
                        const nights = Math.ceil(
                          (new Date(stay.checkOut).getTime() - new Date(stay.checkIn).getTime()) / (1000 * 60 * 60 * 24)
                        );
                        const balance = stay.totalAmount - (stay.paidAmount || 0);
                        return (
                          <TableRow
                            key={stay.id}
                            hover
                            sx={{
                              cursor: 'pointer',
                              bgcolor: balance > 0 ? 'rgba(244, 67, 54, 0.08)' : 'transparent',
                            }}
                            onClick={() => onStayClick(stay)}
                          >
                            <TableCell>
                              <Chip label={stay.roomNumber} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>{formatDate(stay.checkIn)}</TableCell>
                            <TableCell>{formatDate(stay.checkOut)}</TableCell>
                            <TableCell>{nights}</TableCell>
                            <TableCell>{stay.companyName || '-'}</TableCell>
                            <TableCell align="right">{formatCurrency(stay.totalAmount)}</TableCell>
                            <TableCell align="right">{formatCurrency(stay.paidAmount || 0)}</TableCell>
                            <TableCell align="right" sx={{ color: balance > 0 ? 'error.main' : 'success.main', fontWeight: balance > 0 ? 700 : 400 }}>
                              {formatCurrency(balance)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Bu müşterinin konaklama geçmişi bulunmuyor.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

/** Bilgi satırı yardımcı bileşeni */
const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value}</Typography>
  </Box>
);

export default GuestList;
