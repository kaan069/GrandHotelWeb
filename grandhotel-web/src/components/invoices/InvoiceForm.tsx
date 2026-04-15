/**
 * InvoiceForm - Fatura Oluşturma Formu
 *
 * Hem dialog içinden hem de InvoiceList sayfasından kullanılabilir.
 * Kategori kısayolları ile hızlı kalem ekleme destekler.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  MenuItem,
  Button,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  InputAdornment,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

import { FormField, CurrencyInput } from '../forms';
import {
  InvoiceType,
  InvoiceCustomerType,
  InvoiceItemCategory,
  InvoiceItem,
  Invoice,
  Company,
  INVOICE_TYPE_LABELS,
  INVOICE_ITEM_CATEGORY_LABELS,
} from '../../utils/constants';
import { addInvoice } from '../../utils/invoiceStorage';
import { companiesApi } from '../../api/services';

interface InvoiceFormProps {
  defaultType?: InvoiceType;
  defaultCustomerType?: InvoiceCustomerType;
  defaultCustomerName?: string;
  defaultTaxNumber?: string;
  defaultAddress?: string;
  defaultCompanyId?: number;
  defaultRoomId?: number;
  defaultDescription?: string;
  onSave?: (invoice: Invoice) => void;
  onCancel?: () => void;
}

const CATEGORY_SHORTCUTS: { key: InvoiceItemCategory; label: string; color: string }[] = [
  { key: 'konaklama', label: 'Konaklama', color: '#1976d2' },
  { key: 'yiyecek', label: 'Yiyecek', color: '#2e7d32' },
  { key: 'icecek', label: 'İçecek', color: '#ed6c02' },
  { key: 'minibar', label: 'Minibar', color: '#9c27b0' },
  { key: 'hizmet', label: 'Hizmet', color: '#0288d1' },
  { key: 'diger', label: 'Diğer', color: '#757575' },
];

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  defaultType = 'sales',
  defaultCustomerType = 'individual',
  defaultCustomerName = '',
  defaultTaxNumber = '',
  defaultAddress = '',
  defaultCompanyId,
  defaultRoomId,
  defaultDescription = '',
  onSave,
  onCancel,
}) => {
  const [invoiceType, setInvoiceType] = useState<InvoiceType>(defaultType);
  const [customerType, setCustomerType] = useState<InvoiceCustomerType>(defaultCustomerType);
  const [customerName, setCustomerName] = useState(defaultCustomerName);
  const [taxNumber, setTaxNumber] = useState(defaultTaxNumber);
  const [address, setAddress] = useState(defaultAddress);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState<number>(20);
  const [notes, setNotes] = useState(defaultDescription);
  const [hasAccommodationTax, setHasAccommodationTax] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [companySearchOpen, setCompanySearchOpen] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);

  /* Firma arama açılınca firmaları API'den çek */
  useEffect(() => {
    if (companySearchOpen) {
      companiesApi.getAll()
        .then((data) => setCompanies(data.map((c) => ({
          ...c,
          taxNumber: c.taxNumber || undefined,
          address: c.address || undefined,
          phone: c.phone || undefined,
          email: c.email || undefined,
        }))))
        .catch(() => setCompanies([]));
    }
  }, [companySearchOpen]);

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
    (c.taxNumber && c.taxNumber.includes(companySearchQuery))
  );

  const handleSelectCompany = (company: Company) => {
    setCustomerType('company');
    setCustomerName(company.name);
    setTaxNumber(company.taxNumber || '');
    setAddress(company.address || '');
    setCompanySearchOpen(false);
    setCompanySearchQuery('');
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const accommodationTaxAmount = hasAccommodationTax ? subtotal * 0.02 : 0;
  const total = subtotal + taxAmount + accommodationTaxAmount;

  const addItem = useCallback((category: InvoiceItemCategory) => {
    const newItem: InvoiceItem = {
      id: items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1,
      category,
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    setItems((prev) => [...prev, newItem]);
  }, [items]);

  const updateItem = useCallback((id: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.amount = Number(updated.quantity) * Number(updated.unitPrice);
        }
        return updated;
      })
    );
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) errs.customerName = 'Müşteri adı zorunlu';
    if (items.length === 0) errs.items = 'En az bir fatura kalemi ekleyin';
    const emptyDesc = items.some((i) => !i.description.trim());
    if (emptyDesc) errs.items = 'Tüm kalemlerin açıklaması doldurulmalı';
    const zeroAmount = items.some((i) => i.amount <= 0);
    if (zeroAmount) errs.items = 'Tüm kalemlerin tutarı 0\'dan büyük olmalı';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const invoice = addInvoice({
      type: invoiceType,
      date,
      dueDate: dueDate || undefined,
      customerType,
      customerName: customerName.trim(),
      taxNumber: taxNumber.trim() || undefined,
      address: address.trim() || undefined,
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      status: 'issued',
      notes: notes.trim() || undefined,
      relatedRoomId: defaultRoomId,
      relatedCompanyId: defaultCompanyId,
    });

    onSave?.(invoice);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Müşteri Bilgileri */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
          Müşteri Bilgileri
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ToggleButtonGroup
                value={customerType}
                exclusive
                onChange={(_, val) => val && setCustomerType(val)}
                size="small"
              >
                <ToggleButton value="individual">Şahıs</ToggleButton>
                <ToggleButton value="company">Firma</ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant="outlined"
                size="small"
                startIcon={<SearchIcon />}
                onClick={() => setCompanySearchOpen(true)}
              >
                Şirket Bul
              </Button>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: customerType === 'company' ? 4 : 6 }}>
            <FormField
              label={customerType === 'company' ? 'Firma Adı' : 'Ad Soyad'}
              name="customerName"
              value={customerName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)}
              error={errors.customerName}
              required
            />
          </Grid>
          {customerType === 'company' && (
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormField
                label="Vergi Numarası"
                name="taxNumber"
                value={taxNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxNumber(e.target.value)}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: customerType === 'company' ? 4 : 6 }}>
            <FormField
              label="Adres"
              name="address"
              value={address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>

      <Divider />

      {/* Fatura Bilgileri */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
          Fatura Bilgileri
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormField
              label="Fatura Türü"
              name="invoiceType"
              value={invoiceType}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceType(e.target.value as InvoiceType)}
              select
            >
              {(Object.keys(INVOICE_TYPE_LABELS) as InvoiceType[]).map((key) => (
                <MenuItem key={key} value={key}>{INVOICE_TYPE_LABELS[key]}</MenuItem>
              ))}
            </FormField>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <FormField
              label="Fatura Tarihi"
              name="date"
              type="date"
              value={date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
              required
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <FormField
              label="Vade Tarihi"
              name="dueDate"
              type="date"
              value={dueDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>

      <Divider />

      {/* Kategori Kısayolları */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
          Kalem Ekle (Kısayollar)
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {CATEGORY_SHORTCUTS.map((cat) => (
            <Chip
              key={cat.key}
              label={cat.label}
              onClick={() => addItem(cat.key)}
              icon={<AddIcon />}
              variant="outlined"
              sx={{
                borderColor: cat.color,
                color: cat.color,
                '&:hover': { bgcolor: `${cat.color}15` },
                fontWeight: 500,
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Kalem Tablosu */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
          Fatura Kalemleri
        </Typography>
        {errors.items && (
          <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>
            {errors.items}
          </Typography>
        )}
        {items.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Henüz kalem eklenmedi. Yukarıdaki kısayollardan veya aşağıdaki butonu kullanarak ekleyin.
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => addItem('diger')}
              sx={{ mt: 1 }}
            >
              Kalem Ekle
            </Button>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 120 }}>Kategori</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Açıklama</TableCell>
                  <TableCell sx={{ width: 80 }} align="center">Miktar</TableCell>
                  <TableCell sx={{ width: 120 }} align="right">Birim Fiyat</TableCell>
                  <TableCell sx={{ width: 120 }} align="right">Tutar</TableCell>
                  <TableCell sx={{ width: 48 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <FormField
                        label=""
                        name="category"
                        value={item.category}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(item.id, 'category', e.target.value)}
                        select
                        sx={{ '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
                      >
                        {(Object.keys(INVOICE_ITEM_CATEGORY_LABELS) as InvoiceItemCategory[]).map((key) => (
                          <MenuItem key={key} value={key}>{INVOICE_ITEM_CATEGORY_LABELS[key]}</MenuItem>
                        ))}
                      </FormField>
                    </TableCell>
                    <TableCell>
                      <FormField
                        label=""
                        name="description"
                        value={item.description}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Açıklama girin"
                        sx={{ '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        label=""
                        name="quantity"
                        type="number"
                        value={item.quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(item.id, 'quantity', Number(e.target.value))}
                        sx={{ '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
                      />
                    </TableCell>
                    <TableCell>
                      <CurrencyInput
                        name="unitPrice"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(item.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => removeItem(item.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {items.length > 0 && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => addItem('diger')}
            sx={{ mt: 1 }}
          >
            Kalem Ekle
          </Button>
        )}
      </Box>

      {/* Toplamlar */}
      {items.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Paper variant="outlined" sx={{ p: 2, minWidth: 280 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Ara Toplam:</Typography>
              <Typography variant="body2" fontWeight={500}>{formatCurrency(subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">KDV:</Typography>
                <FormField
                  label=""
                  name="taxRate"
                  type="number"
                  value={taxRate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxRate(Number(e.target.value))}
                  sx={{ width: 60, '& .MuiInputBase-root': { fontSize: '0.8125rem' } }}
                  InputProps={{ endAdornment: <Typography variant="caption">%</Typography> }}
                />
              </Box>
              <Typography variant="body2" fontWeight={500}>{formatCurrency(taxAmount)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hasAccommodationTax}
                    onChange={(e) => setHasAccommodationTax(e.target.checked)}
                    size="small"
                  />
                }
                label={<Typography variant="body2" color="text.secondary">Konaklama Vergisi (%2)</Typography>}
              />
              <Typography variant="body2" fontWeight={500}>
                {hasAccommodationTax ? formatCurrency(accommodationTaxAmount) : '—'}
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={700}>Genel Toplam:</Typography>
              <Typography variant="subtitle1" fontWeight={700} color="primary">{formatCurrency(total)}</Typography>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Notlar */}
      <FormField
        label="Notlar"
        name="notes"
        value={notes}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
        multiline
        rows={2}
        placeholder="Opsiyonel not ekleyin..."
      />

      {/* Butonlar */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        {onCancel && (
          <Button variant="outlined" color="inherit" onClick={onCancel}>
            İptal
          </Button>
        )}
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
        >
          Fatura Oluştur
        </Button>
      </Box>

      {/* Şirket Arama Dialog */}
      <Dialog
        open={companySearchOpen}
        onClose={() => { setCompanySearchOpen(false); setCompanySearchQuery(''); }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon color="primary" />
            Şirket Bul
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="Firma adı veya vergi no ile arayın..."
            value={companySearchQuery}
            onChange={(e) => setCompanySearchQuery(e.target.value)}
            sx={{ mb: 1, mt: 0.5 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
          {filteredCompanies.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              {companySearchQuery ? 'Sonuç bulunamadı' : 'Kayıtlı firma yok'}
            </Typography>
          ) : (
            <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
              {filteredCompanies.map((company) => (
                <ListItemButton
                  key={company.id}
                  onClick={() => handleSelectCompany(company)}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemText
                    primary={company.name}
                    secondary={[company.taxNumber, company.address].filter(Boolean).join(' • ')}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default InvoiceForm;
