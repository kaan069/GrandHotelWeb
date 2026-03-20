/**
 * InvoiceList - Fatura Listesi Sayfası
 *
 * Fatura türlerine göre (Satış, Alış, İade, Gelen) fatura listesi gösterir.
 * Tab sistemi ile fatura detayı ve yeni fatura oluşturma destekler.
 * URL'den fatura türünü okur.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Card,
  CardContent,
  Grid,
  Divider,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useLocation } from 'react-router-dom';

import { PageHeader, DataTable, StatusBadge } from '../../components/common';
import { InvoiceForm } from '../../components/invoices';
import {
  Invoice,
  InvoiceType,
  INVOICE_TYPE_LABELS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  INVOICE_ITEM_CATEGORY_LABELS,
  InvoiceItemCategory,
} from '../../utils/constants';
import { loadInvoices } from '../../utils/invoiceStorage';

interface InvoiceRow extends Invoice {
  [key: string]: unknown;
}

/* Tab Tipleri */
interface FormTabItem {
  type: 'invoice-form';
  invoiceType: InvoiceType;
  label: string;
}

interface DetailTabItem {
  type: 'invoice-detail';
  invoiceId: number;
  label: string;
}

type TabItem = FormTabItem | DetailTabItem;

/** URL'den fatura türünü çıkar */
const getInvoiceTypeFromPath = (pathname: string): InvoiceType | undefined => {
  const map: Record<string, InvoiceType> = {
    '/invoices/sales': 'sales',
    '/invoices/purchase': 'purchase',
    '/invoices/return': 'return',
    '/invoices/incoming': 'incoming',
  };
  return map[pathname];
};

const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
};

const columns: GridColDef[] = [
  {
    field: 'invoiceNo',
    headerName: 'Fatura No',
    width: 140,
    renderCell: (params: GridRenderCellParams) => (
      <strong style={{ color: '#1565C0' }}>{params.value}</strong>
    ),
  },
  {
    field: 'date',
    headerName: 'Tarih',
    width: 110,
    renderCell: (params: GridRenderCellParams) => formatDate(params.value),
  },
  {
    field: 'customerName',
    headerName: 'Müşteri',
    width: 200,
    flex: 1,
  },
  {
    field: 'customerType',
    headerName: 'Tür',
    width: 90,
    renderCell: (params: GridRenderCellParams) => (
      <Chip
        label={params.value === 'company' ? 'Firma' : 'Şahıs'}
        size="small"
        variant="outlined"
        color={params.value === 'company' ? 'primary' : 'default'}
      />
    ),
  },
  {
    field: 'total',
    headerName: 'Tutar',
    width: 130,
    align: 'right' as const,
    headerAlign: 'right' as const,
    renderCell: (params: GridRenderCellParams) => (
      <strong>{formatCurrency(params.value)}</strong>
    ),
  },
  {
    field: 'status',
    headerName: 'Durum',
    width: 110,
    renderCell: (params: GridRenderCellParams) => (
      <Chip
        label={INVOICE_STATUS_LABELS[params.value as keyof typeof INVOICE_STATUS_LABELS] || params.value}
        size="small"
        color={INVOICE_STATUS_COLORS[params.value as keyof typeof INVOICE_STATUS_COLORS] || 'default'}
      />
    ),
  },
];

const InvoiceList: React.FC = () => {
  const location = useLocation();
  const invoiceType = getInvoiceTypeFromPath(location.pathname);

  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [openTabs, setOpenTabs] = useState<TabItem[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1);

  const refreshInvoices = useCallback(() => {
    setInvoices(loadInvoices(invoiceType) as InvoiceRow[]);
  }, [invoiceType]);

  useEffect(() => {
    refreshInvoices();
    // Reset tabs when invoice type changes
    setOpenTabs([]);
    setActiveTabIndex(-1);
  }, [refreshInvoices]);

  /** Satıra tıklayınca detay tab aç */
  const handleRowClick = (row: { id: string | number; [key: string]: unknown }) => {
    const invoice = invoices.find((inv) => inv.id === row.id);
    if (!invoice) return;

    const existingIndex = openTabs.findIndex(
      (t) => t.type === 'invoice-detail' && t.invoiceId === invoice.id
    );
    if (existingIndex !== -1) {
      setActiveTabIndex(existingIndex);
    } else {
      const newTab: DetailTabItem = {
        type: 'invoice-detail',
        invoiceId: invoice.id,
        label: invoice.invoiceNo,
      };
      setOpenTabs((prev) => [...prev, newTab]);
      setActiveTabIndex(openTabs.length);
    }
  };

  /** Yeni fatura tab aç */
  const handleNewInvoice = () => {
    const existingIndex = openTabs.findIndex((t) => t.type === 'invoice-form');
    if (existingIndex !== -1) {
      setActiveTabIndex(existingIndex);
      return;
    }
    const newTab: FormTabItem = {
      type: 'invoice-form',
      invoiceType: invoiceType || 'sales',
      label: 'Yeni Fatura',
    };
    setOpenTabs((prev) => [...prev, newTab]);
    setActiveTabIndex(openTabs.length);
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

  /** Fatura kaydedildi */
  const handleInvoiceSaved = () => {
    refreshInvoices();
    // Form tab'ını kapat
    const formIndex = openTabs.findIndex((t) => t.type === 'invoice-form');
    if (formIndex !== -1) {
      setOpenTabs((prev) => prev.filter((_, i) => i !== formIndex));
      setActiveTabIndex(-1);
    }
  };

  const activeTab = activeTabIndex >= 0 && activeTabIndex < openTabs.length ? openTabs[activeTabIndex] : null;
  const pageTitle = invoiceType ? INVOICE_TYPE_LABELS[invoiceType] + 'ları' : 'Tüm Faturalar';

  return (
    <div>
      {/* Tab Bar */}
      {openTabs.length > 0 && (
        <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', borderRadius: '8px 8px 0 0' }}>
          <Tabs
            value={activeTabIndex === -1 ? false : activeTabIndex}
            onChange={(_, newValue) => setActiveTabIndex(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 42, '& .MuiTab-root': { minHeight: 42, textTransform: 'none', fontSize: '0.8125rem', fontWeight: 500 } }}
          >
            {openTabs.map((tab, index) => (
              <Tab
                key={tab.type === 'invoice-form' ? 'new' : `inv-${(tab as DetailTabItem).invoiceId}`}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {tab.type === 'invoice-form' ? <AddIcon sx={{ fontSize: 16 }} /> : <ReceiptIcon sx={{ fontSize: 16 }} />}
                    <Typography variant="body2" fontWeight={activeTabIndex === index ? 600 : 400}>
                      {tab.label}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleTabClose(e, index)}
                      sx={{ ml: 0.5, p: 0.2, '&:hover': { color: 'error.main' } }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                }
              />
            ))}
          </Tabs>
          {activeTabIndex !== -1 && (
            <Box sx={{ px: 1, pb: 0.5 }}>
              <Chip
                label="Listeye Dön"
                size="small"
                variant="outlined"
                onClick={() => setActiveTabIndex(-1)}
                sx={{ cursor: 'pointer', fontSize: '0.75rem' }}
              />
            </Box>
          )}
        </Box>
      )}

      {/* İçerik */}
      {activeTab?.type === 'invoice-form' ? (
        /* Yeni Fatura Formu */
        <Box>
          <PageHeader
            title="Yeni Fatura Oluştur"
            subtitle="Fatura bilgilerini girin ve kalemleri ekleyin"
          />
          <Card>
            <CardContent>
              <InvoiceForm
                defaultType={invoiceType || 'sales'}
                onSave={handleInvoiceSaved}
                onCancel={() => {
                  const formIndex = openTabs.findIndex((t) => t.type === 'invoice-form');
                  if (formIndex !== -1) {
                    setOpenTabs((prev) => prev.filter((_, i) => i !== formIndex));
                    setActiveTabIndex(-1);
                  }
                }}
              />
            </CardContent>
          </Card>
        </Box>
      ) : activeTab?.type === 'invoice-detail' ? (
        /* Fatura Detay */
        <InvoiceDetailView
          invoice={invoices.find((inv) => inv.id === (activeTab as DetailTabItem).invoiceId) || null}
        />
      ) : (
        /* Liste Görünümü */
        <>
          <PageHeader
            title={pageTitle}
            subtitle={`Toplam ${invoices.length} fatura`}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewInvoice}
            >
              Yeni Fatura
            </Button>
          </Box>
          <DataTable
            rows={invoices}
            columns={columns}
            onRowClick={handleRowClick}
            searchable
            searchPlaceholder="Fatura no, müşteri adı ile ara..."
          />
        </>
      )}
    </div>
  );
};

/* ==================== Fatura Detay Görünümü ==================== */

interface InvoiceDetailViewProps {
  invoice: Invoice | null;
}

const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({ invoice }) => {
  if (!invoice) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography color="text.secondary">Fatura bulunamadı.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`Fatura ${invoice.invoiceNo}`}
        subtitle={`${INVOICE_TYPE_LABELS[invoice.type]} - ${formatDate(invoice.date)}`}
      />

      <Grid container spacing={2.5}>
        {/* Sol - Fatura Bilgileri */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionIcon sx={{ fontSize: 20 }} />
                Fatura Bilgileri
              </Typography>
              <InfoRow label="Fatura No" value={invoice.invoiceNo} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Tür" value={INVOICE_TYPE_LABELS[invoice.type]} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Tarih" value={formatDate(invoice.date)} />
              <Divider sx={{ my: 0.5 }} />
              {invoice.dueDate && (
                <>
                  <InfoRow label="Vade" value={formatDate(invoice.dueDate)} />
                  <Divider sx={{ my: 0.5 }} />
                </>
              )}
              <InfoRow
                label="Durum"
                value={
                  <Chip
                    label={INVOICE_STATUS_LABELS[invoice.status]}
                    size="small"
                    color={INVOICE_STATUS_COLORS[invoice.status]}
                  />
                }
              />

              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Müşteri Bilgileri
              </Typography>
              <InfoRow label="Müşteri" value={invoice.customerName} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow
                label="Hesap Türü"
                value={invoice.customerType === 'company' ? 'Firma' : 'Şahıs'}
              />
              {invoice.taxNumber && (
                <>
                  <Divider sx={{ my: 0.5 }} />
                  <InfoRow label="Vergi No" value={invoice.taxNumber} />
                </>
              )}
              {invoice.address && (
                <>
                  <Divider sx={{ my: 0.5 }} />
                  <InfoRow label="Adres" value={invoice.address} />
                </>
              )}

              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Toplam
              </Typography>
              <InfoRow label="Ara Toplam" value={formatCurrency(invoice.subtotal)} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label={`KDV (%${invoice.taxRate})`} value={formatCurrency(invoice.taxAmount)} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow
                label="Genel Toplam"
                value={
                  <Typography variant="body2" fontWeight={700} color="primary">
                    {formatCurrency(invoice.total)}
                  </Typography>
                }
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Sağ - Kalemler */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptIcon sx={{ fontSize: 20 }} />
                Fatura Kalemleri
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Kategori</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Açıklama</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Miktar</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Birim Fiyat</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Tutar</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Chip
                            label={INVOICE_ITEM_CATEGORY_LABELS[item.category as InvoiceItemCategory] || item.category}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {invoice.notes && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">Notlar:</Typography>
                  <Typography variant="body2">{invoice.notes}</Typography>
                </Box>
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

export default InvoiceList;
