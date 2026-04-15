/**
 * Acente Listesi Sayfası
 *
 * İki görünüm:
 *   1. Tüm Acenteler
 *   2. Borçlu Acenteler — bakiyesi olan acenteler (ciro, ödenen, bakiye, komisyon)
 *
 * Acenteye tıklanınca tab açılır: acente detayı + rezervasyon geçmişi + komisyon özeti.
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
  TravelExplore as TravelExploreIcon,
  Add as AddIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

import { PageHeader, DataTable } from '../../components/common';
import type { Agency } from '../../utils/constants';
import { agenciesApi } from '../../api/services';
import { formatPhone, formatCurrency } from '../../utils/formatters';
import usePageTabs from '../../hooks/usePageTabs';

import AgencyContent from '../../components/agencies';
import type { AgencyAddResult } from '../../components/agencies';

interface AgencyRow extends Agency {
  [key: string]: unknown;
}

interface DebtorRow {
  id: number;
  name: string;
  taxNumber: string | null;
  phone: string | null;
  email: string | null;
  commissionRate: string;
  totalAmount: string;
  paidAmount: string;
  balance: string;
  reservationCount: number;
  activeReservations: number;
  [key: string]: unknown;
}

interface AgencyTabItem {
  agencyId: number;
  agencyName: string;
}

const agencyColumns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 60, align: 'center', headerAlign: 'center' },
  {
    field: 'name', headerName: 'Acente Adı', width: 220, flex: 1,
    renderCell: (p: GridRenderCellParams) => <strong style={{ color: '#1565C0' }}>{p.value}</strong>,
  },
  {
    field: 'taxNumber', headerName: 'Vergi No', width: 140,
    renderCell: (p: GridRenderCellParams) => p.value || '-',
  },
  {
    field: 'contactPerson', headerName: 'Yetkili', width: 160,
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
    field: 'commissionRate', headerName: 'Komisyon', width: 110, align: 'right', headerAlign: 'right',
    renderCell: (p: GridRenderCellParams) => p.value !== null && p.value !== undefined
      ? <Chip label={`%${Number(p.value)}`} size="small" color="info" variant="outlined" />
      : '-',
  },
];

const debtorColumns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 60, align: 'center', headerAlign: 'center' },
  {
    field: 'name', headerName: 'Acente Adı', width: 200, flex: 1,
    renderCell: (p: GridRenderCellParams) => <strong style={{ color: '#1565C0' }}>{p.value}</strong>,
  },
  {
    field: 'taxNumber', headerName: 'Vergi No', width: 130,
    renderCell: (p: GridRenderCellParams) => p.value || '-',
  },
  {
    field: 'commissionRate', headerName: 'Komisyon', width: 100, align: 'right', headerAlign: 'right',
    renderCell: (p: GridRenderCellParams) => `%${Number(p.value)}`,
  },
  {
    field: 'totalAmount', headerName: 'Ciro', width: 130, align: 'right', headerAlign: 'right',
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

const AgencyList: React.FC = () => {
  const [viewTab, setViewTab] = useState(0);
  const [agencies, setAgencies] = useState<AgencyRow[]>([]);
  const [debtors, setDebtors] = useState<DebtorRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [openTabs, setOpenTabs] = useState<AgencyTabItem[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1);
  const [addAgencyOpen, setAddAgencyOpen] = useState(false);

  const refreshAgencies = async () => {
    setLoading(true);
    try {
      const data = await agenciesApi.getAll();
      setAgencies(data as AgencyRow[]);
    } catch (err) {
      console.error('Acente verileri yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshDebtors = async () => {
    setLoading(true);
    try {
      const data = await agenciesApi.getDebtors();
      setDebtors(data as DebtorRow[]);
    } catch (err) {
      console.error('Borçlu acente verileri yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAgencies();
  }, []);

  useEffect(() => {
    if (viewTab === 1) {
      refreshDebtors();
    }
  }, [viewTab]);

  const handleRowClick = (row: { id: string | number; [key: string]: unknown }) => {
    const agencyId = Number(row.id);
    const agencyName = String(row.name || '');

    const existingIndex = openTabs.findIndex((t) => t.agencyId === agencyId);
    if (existingIndex !== -1) {
      setActiveTabIndex(existingIndex);
    } else {
      setOpenTabs((prev) => [...prev, { agencyId, agencyName }]);
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

  const handleAddAgency = async (result: AgencyAddResult) => {
    try {
      await agenciesApi.create(result);
      await refreshAgencies();
    } catch (err) {
      console.error('Acente eklenirken hata:', err);
    }
  };

  const activeTab = activeTabIndex >= 0 && activeTabIndex < openTabs.length ? openTabs[activeTabIndex] : null;
  const activeAgency = activeTab
    ? agencies.find((a) => a.id === activeTab.agencyId) || null
    : null;

  const headerTabs = openTabs.map((tab) => ({
    key: `a-${tab.agencyId}`,
    icon: <TravelExploreIcon sx={{ fontSize: 16 }} />,
    label: tab.agencyName,
  }));

  const handleBackToList = useCallback(() => setActiveTabIndex(-1), []);

  usePageTabs({
    tabs: headerTabs,
    activeTabIndex,
    onTabChange: setActiveTabIndex,
    onTabClose: handleTabClose,
    onBackToList: handleBackToList,
  });

  const totalDebt = debtors.reduce((sum, d) => sum + Number(d.balance), 0);

  return (
    <div>
      <PageHeader
        title="Acenteler"
        subtitle={viewTab === 0
          ? `Toplam ${agencies.length} acente`
          : `${debtors.length} borçlu acente · Toplam bakiye: ${formatCurrency(totalDebt)}`
        }
      />

      {loading && activeTabIndex < 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : activeTabIndex >= 0 && activeAgency ? (
        <AgencyContent
          activeAgency={activeAgency}
          addDialogOpen={false}
          onAddClose={() => {}}
          onAddSave={() => {}}
        />
      ) : (
        <>
          <Tabs
            value={viewTab}
            onChange={(_, v) => { setViewTab(v); setActiveTabIndex(-1); }}
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              label="Tüm Acenteler"
              icon={<TravelExploreIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Borçlu Acenteler
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

          {viewTab === 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddAgencyOpen(true)}>
                  Acente Ekle
                </Button>
              </Box>
              <DataTable
                rows={agencies}
                columns={agencyColumns}
                onRowClick={handleRowClick}
                searchable
                searchPlaceholder="Acente adı, vergi no ile ara..."
              />
            </>
          )}

          {viewTab === 1 && (
            <DataTable
              rows={debtors}
              columns={debtorColumns}
              onRowClick={handleRowClick}
              searchable
              searchPlaceholder="Borçlu acente ara..."
            />
          )}
        </>
      )}

      {/* Acente Ekleme Dialog */}
      <AgencyContent
        activeAgency={null}
        addDialogOpen={addAgencyOpen}
        onAddClose={() => setAddAgencyOpen(false)}
        onAddSave={handleAddAgency}
      />
    </div>
  );
};

export default AgencyList;
