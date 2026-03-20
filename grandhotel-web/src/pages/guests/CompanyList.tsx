/**
 * Firma Listesi Sayfası
 *
 * İki görünüm:
 *   1. Tüm Firmalar — standart firma listesi
 *   2. Borçlu Firmalar — bakiyesi olan firmalar (toplam, ödenen, bakiye)
 *
 * Firmaya tıklanınca tab açılır, firma detayı ve konaklama geçmişi gösterilir.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Hotel as HotelIcon,
  Add as AddIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

import { PageHeader, DataTable, StayDetailContent } from '../../components/common';
import { Company, StayHistory } from '../../utils/constants';
import { companiesApi } from '../../api/services';
import { formatPhone, formatCurrency } from '../../utils/formatters';
import usePageTabs from '../../hooks/usePageTabs';

/* Alt bileşenler */
import CompanyContent from '../../components/companies';
import type { CompanyAddResult } from '../../components/companies';

interface CompanyRow extends Company {
  [key: string]: unknown;
}

interface DebtorRow {
  id: number;
  name: string;
  taxNumber: string | null;
  phone: string | null;
  email: string | null;
  totalAmount: string;
  paidAmount: string;
  balance: string;
  reservationCount: number;
  activeReservations: number;
  [key: string]: unknown;
}

interface CompanyTabItem {
  type: 'company';
  companyId: number;
  companyName: string;
}

interface StayTabItem {
  type: 'stay';
  stay: StayHistory;
  label: string;
}

type TabItem = CompanyTabItem | StayTabItem;

/* ── Tüm Firmalar kolonları ── */
const companyColumns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 60, align: 'center', headerAlign: 'center' },
  {
    field: 'name', headerName: 'Firma Adı', width: 220, flex: 1,
    renderCell: (p: GridRenderCellParams) => <strong style={{ color: '#1565C0' }}>{p.value}</strong>,
  },
  {
    field: 'taxNumber', headerName: 'Vergi No', width: 140,
    renderCell: (p: GridRenderCellParams) => p.value || '-',
  },
  {
    field: 'phone', headerName: 'Telefon', width: 150,
    renderCell: (p: GridRenderCellParams) => p.value ? formatPhone(p.value) : '-',
  },
  {
    field: 'email', headerName: 'E-posta', width: 200, flex: 1,
    renderCell: (p: GridRenderCellParams) => p.value || '-',
  },
  {
    field: 'address', headerName: 'Adres', width: 200, flex: 1,
    renderCell: (p: GridRenderCellParams) => p.value || '-',
  },
];

/* ── Borçlu Firmalar kolonları ── */
const debtorColumns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 60, align: 'center', headerAlign: 'center' },
  {
    field: 'name', headerName: 'Firma Adı', width: 200, flex: 1,
    renderCell: (p: GridRenderCellParams) => <strong style={{ color: '#1565C0' }}>{p.value}</strong>,
  },
  {
    field: 'taxNumber', headerName: 'Vergi No', width: 130,
    renderCell: (p: GridRenderCellParams) => p.value || '-',
  },
  {
    field: 'totalAmount', headerName: 'Toplam', width: 130, align: 'right', headerAlign: 'right',
    renderCell: (p: GridRenderCellParams) => formatCurrency(Number(p.value)),
  },
  {
    field: 'paidAmount', headerName: 'Ödenen', width: 130, align: 'right', headerAlign: 'right',
    renderCell: (p: GridRenderCellParams) => (
      <span style={{ color: '#22C55E' }}>{formatCurrency(Number(p.value))}</span>
    ),
  },
  {
    field: 'balance', headerName: 'Bakiye', width: 130, align: 'right', headerAlign: 'right',
    renderCell: (p: GridRenderCellParams) => (
      <strong style={{ color: '#EF4444' }}>{formatCurrency(Number(p.value))}</strong>
    ),
  },
  {
    field: 'reservationCount', headerName: 'Rez.', width: 70, align: 'center', headerAlign: 'center',
  },
  {
    field: 'activeReservations', headerName: 'Aktif', width: 70, align: 'center', headerAlign: 'center',
    renderCell: (p: GridRenderCellParams) => p.value > 0 ? (
      <Chip label={p.value} size="small" color="error" />
    ) : '0',
  },
];

const CompanyList: React.FC = () => {
  /* ── Sayfa görünümü: 0 = Tüm Firmalar, 1 = Borçlu Firmalar ── */
  const [viewTab, setViewTab] = useState(0);

  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [debtors, setDebtors] = useState<DebtorRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [openTabs, setOpenTabs] = useState<TabItem[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1);
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);

  /* ── Veri çekme ── */
  const refreshCompanies = async () => {
    setLoading(true);
    try {
      const data = await companiesApi.getAll();
      setCompanies(data as CompanyRow[]);
    } catch (err) {
      console.error('Firma verileri yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshDebtors = async () => {
    setLoading(true);
    try {
      const data = await companiesApi.getDebtors();
      setDebtors(data as DebtorRow[]);
    } catch (err) {
      console.error('Borçlu firma verileri yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCompanies();
  }, []);

  /* Tab değiştiğinde borçlu firmalar yükle */
  useEffect(() => {
    if (viewTab === 1) {
      refreshDebtors();
    }
  }, [viewTab]);

  /* ── Tab yönetimi (firma detay sekmeleri) ── */
  const handleRowClick = (row: { id: string | number; [key: string]: unknown }) => {
    const companyId = Number(row.id);
    const companyName = String(row.name || '');

    const existingIndex = openTabs.findIndex((t) => t.type === 'company' && t.companyId === companyId);
    if (existingIndex !== -1) {
      setActiveTabIndex(existingIndex);
    } else {
      const newTab: CompanyTabItem = { type: 'company', companyId, companyName };
      setOpenTabs((prev) => [...prev, newTab]);
      setActiveTabIndex(openTabs.length);
    }
  };

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

  const handleTabClose = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setOpenTabs((prev) => prev.filter((_, i) => i !== index));
    if (activeTabIndex === index) {
      setActiveTabIndex(-1);
    } else if (activeTabIndex > index) {
      setActiveTabIndex((prev) => prev - 1);
    }
  };

  const handleAddCompany = async (result: CompanyAddResult) => {
    try {
      await companiesApi.create(result);
      await refreshCompanies();
    } catch (err) {
      console.error('Firma eklenirken hata:', err);
    }
  };

  /* ── Aktif tab ── */
  const activeTab = activeTabIndex >= 0 && activeTabIndex < openTabs.length ? openTabs[activeTabIndex] : null;
  const activeCompany = activeTab?.type === 'company'
    ? companies.find((c) => c.id === activeTab.companyId) || null
    : null;

  const headerTabs = openTabs.map((tab) => ({
    key: tab.type === 'company' ? `c-${tab.companyId}` : `s-${tab.stay.id}`,
    icon: tab.type === 'company' ? <BusinessIcon sx={{ fontSize: 16 }} /> : <HotelIcon sx={{ fontSize: 16 }} />,
    label: tab.type === 'company' ? tab.companyName : tab.label,
  }));

  const handleBackToList = useCallback(() => setActiveTabIndex(-1), []);

  usePageTabs({
    tabs: headerTabs,
    activeTabIndex,
    onTabChange: setActiveTabIndex,
    onTabClose: handleTabClose,
    onBackToList: handleBackToList,
  });

  /* ── Toplam borç (üst bilgi için) ── */
  const totalDebt = debtors.reduce((sum, d) => sum + Number(d.balance), 0);

  return (
    <div>
      <PageHeader
        title="Firmalar"
        subtitle={viewTab === 0
          ? `Toplam ${companies.length} firma`
          : `${debtors.length} borçlu firma · Toplam bakiye: ${formatCurrency(totalDebt)}`
        }
      />

      {/* Tab İçeriği veya Liste */}
      {loading && activeTabIndex < 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : activeTab?.type === 'stay' ? (
        <StayDetailContent stay={activeTab.stay} />
      ) : activeTabIndex >= 0 && activeCompany ? (
        <CompanyContent
          activeCompany={activeCompany}
          onStayClick={handleStayClick}
          addDialogOpen={false}
          onAddClose={() => {}}
          onAddSave={() => {}}
        />
      ) : (
        <>
          {/* ── Görünüm Tabları: Tüm Firmalar / Borçlu Firmalar ── */}
          <Tabs
            value={viewTab}
            onChange={(_, v) => { setViewTab(v); setActiveTabIndex(-1); }}
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              label="Tüm Firmalar"
              icon={<BusinessIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Borçlu Firmalar
                  {debtors.length > 0 && (
                    <Chip label={debtors.length} size="small" color="error" sx={{ height: 20 }} />
                  )}
                </Box>
              }
              icon={<WarningIcon sx={{ fontSize: 18, color: '#EF4444' }} />}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          </Tabs>

          {/* ── Tüm Firmalar Tablosu ── */}
          {viewTab === 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddCompanyOpen(true)}>
                  Firma Ekle
                </Button>
              </Box>
              <DataTable
                rows={companies}
                columns={companyColumns}
                onRowClick={handleRowClick}
                searchable
                searchPlaceholder="Firma adı, vergi no ile ara..."
              />
            </>
          )}

          {/* ── Borçlu Firmalar Tablosu ── */}
          {viewTab === 1 && (
            <DataTable
              rows={debtors}
              columns={debtorColumns}
              onRowClick={handleRowClick}
              searchable
              searchPlaceholder="Borçlu firma ara..."
            />
          )}
        </>
      )}

      {/* Firma Ekleme Dialog */}
      <CompanyContent
        activeCompany={null}
        onStayClick={handleStayClick}
        addDialogOpen={addCompanyOpen}
        onAddClose={() => setAddCompanyOpen(false)}
        onAddSave={handleAddCompany}
      />
    </div>
  );
};

export default CompanyList;
