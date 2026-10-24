/**
 * InvoiceList - Fatura Listesi Sayfası
 *
 * Fatura türlerine göre (Satış, Alış, İade, Gelen) fatura listesi gösterir.
 * Tab sistemi ile fatura detayı ve yeni fatura oluşturma destekler.
 * URL'den fatura türünü okur.
 *
 * API: invoicesApi.listPage({ type, page, pageSize, search }) — GET /api/invoices/?type=sales&page=1
 * (sunucu taraflı sayfalama + arama: hooks/useServerTable)
 * (InvoiceForm faturayı backend'e yazar; liste de backend'den okunur.)
 */

import React, { useState, useEffect } from 'react';
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
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useLocation } from 'react-router-dom';

import { PageHeader, DataTable } from '../../components/common';
import { InvoiceForm } from '../../components/invoices';
import {
  InvoiceType,
  InvoiceStatus,
  INVOICE_TYPE_LABELS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from '../../utils/constants';
import { invoicesApi, ApiInvoice } from '../../api/services';
import useNotification from '../../hooks/useNotification';
import useServerTable from '../../hooks/useServerTable';
import { getApiErrorMessage } from '../../utils/apiError';

interface InvoiceRow extends ApiInvoice {
  [key: string]: unknown;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  e_archive: 'e-Arşiv',
  e_invoice: 'e-Fatura',
};

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
  /** Sekme açıldığındaki kayıt (liste sayfası değişse de detay gösterilir) */
  invoice: ApiInvoice;
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

/** Backend Decimal alanları string döner ("1250.00") → Number'a çevrilir */
const formatCurrency = (amount: number | string): string => {
  return `${Number(amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
};

const columns: GridColDef[] = [
  {
    field: 'invoiceNo',
    headerName: 'Fatura No',
    width: 140,
    renderCell: (params: GridRenderCellParams) => (
      <strong style={{ color: '#1565C0' }}>{params.value || `#${params.row.id}`}</strong>
    ),
  },
  {
    field: 'issueDate',
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
    field: 'totalAmount',
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
        label={INVOICE_STATUS_LABELS[params.value as InvoiceStatus] || params.value}
        size="small"
        color={INVOICE_STATUS_COLORS[params.value as InvoiceStatus] || 'default'}
      />
    ),
  },
];

const InvoiceList: React.FC = () => {
  const location = useLocation();
  const invoiceType = getInvoiceTypeFromPath(location.pathname);

  const [openTabs, setOpenTabs] = useState<TabItem[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1);

  const table = useServerTable(
    (p) => invoicesApi.listPage({ ...p, type: invoiceType }),
    [invoiceType],
  );
  const invoices = table.rows as InvoiceRow[];
  const refreshInvoices = table.refresh;

  useEffect(() => {
    // Fatura türü değişince açık sekmeler kapanır
    setOpenTabs([]);
    setActiveTabIndex(-1);
  }, [invoiceType]);

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
        label: invoice.invoiceNo || `Fatura #${invoice.id}`,
        invoice,
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
          invoice={activeTab.invoice}
          onUpdated={(updated) => {
            setOpenTabs((prev) => prev.map((t) => (
              t.type === 'invoice-detail' && t.invoiceId === updated.id ? { ...t, invoice: { ...t.invoice, ...updated } } : t
            )));
            refreshInvoices();
          }}
        />
      ) : (
        /* Liste Görünümü */
        <>
          <PageHeader
            title={pageTitle}
            subtitle={`Toplam ${table.rowCount} fatura`}
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
          {!!table.error && (
            <Alert severity="error" sx={{ mb: 2 }}>Faturalar yüklenemedi. Sayfayı yenileyip tekrar deneyin.</Alert>
          )}
          <DataTable
            rows={invoices}
            columns={columns}
            loading={table.loading}
            server={table.server}
            onRowClick={handleRowClick}
            searchable
            searchPlaceholder="Fatura no, müşteri adı veya VKN/TCKN ile ara..."
          />
        </>
      )}
    </div>
  );
};

/* ==================== Fatura Detay Görünümü ==================== */

interface InvoiceDetailViewProps {
  invoice: ApiInvoice | null;
  onUpdated: (invoice: ApiInvoice) => void;
}

/**
 * Detay işlemleri (mobil InvoiceListScreen ile aynı):
 *   Taslak / Hatalı → Paraşüt'e tekrar gönder, iptal et
 *   İşleniyor → durumu sorgula
 *   Tamamlandı → resmî belge; iptal/iade Paraşüt'ten yapılır (backend de reddeder)
 */
const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({ invoice, onUpdated }) => {
  const { showSuccess, showError } = useNotification();
  const [busy, setBusy] = useState(false);

  const runAction = async (action: () => Promise<ApiInvoice>, success: (inv: ApiInvoice) => string) => {
    setBusy(true);
    try {
      const updated = await action();
      onUpdated(updated);
      if (updated.status === 'failed') showError(updated.errorMessage || 'Fatura gönderilemedi');
      else showSuccess(success(updated));
    } catch (err) {
      showError(getApiErrorMessage(err, 'İşlem yapılamadı'));
    } finally {
      setBusy(false);
    }
  };

  if (!invoice) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography color="text.secondary">Fatura bulunamadı.</Typography>
      </Box>
    );
  }

  const typeLabel = INVOICE_TYPE_LABELS[invoice.type as InvoiceType] || invoice.type;

  return (
    <Box>
      <PageHeader
        title={`Fatura ${invoice.invoiceNo || `#${invoice.id}`}`}
        subtitle={`${typeLabel} - ${formatDate(invoice.issueDate)}`}
      />

      {invoice.status === 'failed' && invoice.errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>{invoice.errorMessage}</Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {(invoice.status === 'draft' || invoice.status === 'failed') && (
          <>
            <Button
              variant="contained"
              disabled={busy}
              onClick={() => runAction(() => invoicesApi.send(invoice.id), () => 'Fatura gönderildi')}
            >
              Paraşüt'e Tekrar Gönder
            </Button>
            <Button
              color="error"
              disabled={busy}
              onClick={() => {
                if (!window.confirm('Fatura iptal edilsin mi? Bu işlem geri alınamaz.')) return;
                runAction(() => invoicesApi.cancel(invoice.id), () => 'Fatura iptal edildi');
              }}
            >
              Faturayı İptal Et
            </Button>
          </>
        )}
        {invoice.status === 'processing' && (
          <Button
            variant="outlined"
            disabled={busy}
            onClick={() => runAction(
              () => invoicesApi.checkStatus(invoice.id),
              (u) => `Fatura durumu: ${INVOICE_STATUS_LABELS[u.status as InvoiceStatus] || u.status}`,
            )}
          >
            Durumu Sorgula
          </Button>
        )}
        {invoice.status === 'completed' && (
          <Typography variant="caption" color="text.secondary">
            Resmîleşmiş fatura iptal/iade işlemleri Paraşüt üzerinden yapılır.
          </Typography>
        )}
      </Box>

      <Grid container spacing={2.5}>
        {/* Sol - Fatura Bilgileri */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionIcon sx={{ fontSize: 20 }} />
                Fatura Bilgileri
              </Typography>
              <InfoRow label="Fatura No" value={invoice.invoiceNo || '-'} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Tür" value={typeLabel} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Belge" value={DOCUMENT_TYPE_LABELS[invoice.documentType] || invoice.documentType} />
              <Divider sx={{ my: 0.5 }} />
              <InfoRow label="Tarih" value={formatDate(invoice.issueDate)} />
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
                    label={INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
                    size="small"
                    color={INVOICE_STATUS_COLORS[invoice.status] || 'default'}
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
              {invoice.taxOffice && (
                <>
                  <Divider sx={{ my: 0.5 }} />
                  <InfoRow label="Vergi Dairesi" value={invoice.taxOffice} />
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
              <InfoRow label="KDV" value={formatCurrency(invoice.vatAmount)} />
              {invoice.hasAccommodationTax && (
                <>
                  <Divider sx={{ my: 0.5 }} />
                  <InfoRow label="Konaklama Vergisi" value={formatCurrency(invoice.accommodationTaxAmount)} />
                </>
              )}
              <Divider sx={{ my: 0.5 }} />
              <InfoRow
                label="Genel Toplam"
                value={
                  <Typography variant="body2" fontWeight={700} color="primary">
                    {formatCurrency(invoice.totalAmount)}
                  </Typography>
                }
              />

              {invoice.pdfUrl && (
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PdfIcon />}
                  href={invoice.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ mt: 2 }}
                >
                  PDF'i Aç
                </Button>
              )}
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
                      <TableCell sx={{ fontWeight: 600 }}>Açıklama</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>Miktar</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Birim Fiyat</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>KDV</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Tutar</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="center">{Number(item.quantity)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell align="center">%{item.vatRate}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(item.total)}</TableCell>
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
