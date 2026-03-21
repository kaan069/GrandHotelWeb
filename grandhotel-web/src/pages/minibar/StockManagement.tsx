/**
 * Stok Yönetimi Sayfası
 *
 * Minibar ve diğer kategorilerdeki stok ürünlerini listeler,
 * ekleme/düzenleme/silme işlemleri sağlar.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Box,
  Chip,
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

import { PageHeader, DataTable, ConfirmDialog } from '../../components/common';
import { stockApi } from '../../api/services';
import type { ApiStockItem } from '../../api/services';

/* ==================== SABİTLER ==================== */

const CATEGORY_LABELS: Record<string, string> = {
  cleaning: 'Temizlik',
  kitchen: 'Mutfak',
  office: 'Ofis',
  other: 'Diğer',
};

const UNIT_LABELS: Record<string, string> = {
  adet: 'Adet',
  kg: 'Kg',
  lt: 'Lt',
  paket: 'Paket',
};

/* ==================== FORM ==================== */

interface StockForm {
  name: string;
  category: string;
  unit: string;
  quantity: string;
  isMinibar: boolean;
  minibarPrice: string;
}

const emptyForm: StockForm = {
  name: '',
  category: 'kitchen',
  unit: 'adet',
  quantity: '',
  isMinibar: false,
  minibarPrice: '',
};

/* ==================== KOLONLAR ==================== */

const baseColumns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'name', headerName: 'Ürün Adı', width: 200, flex: 1 },
  {
    field: 'category',
    headerName: 'Kategori',
    width: 120,
    renderCell: (params: GridRenderCellParams) => (
      <Chip label={CATEGORY_LABELS[params.value] || params.value} size="small" variant="outlined" />
    ),
  },
  {
    field: 'unit',
    headerName: 'Birim',
    width: 80,
    valueGetter: (value: string) => UNIT_LABELS[value] || value,
  },
  { field: 'quantity', headerName: 'Stok', width: 100, align: 'center' as const, headerAlign: 'center' as const },
  {
    field: 'isMinibar',
    headerName: 'Minibar',
    width: 90,
    align: 'center' as const,
    headerAlign: 'center' as const,
    renderCell: (params: GridRenderCellParams) =>
      params.value ? <Chip label="Evet" size="small" color="primary" variant="outlined" /> : '—',
  },
  {
    field: 'minibarPrice',
    headerName: 'Minibar Fiyatı',
    width: 130,
    renderCell: (params: GridRenderCellParams) =>
      params.value ? `${parseFloat(params.value).toLocaleString('tr-TR')} ₺` : '—',
  },
];

/* ==================== ANA BİLEŞEN ==================== */

const StockManagement: React.FC = () => {
  const [items, setItems] = useState<ApiStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  /* Dialog state */
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ApiStockItem | null>(null);
  const [form, setForm] = useState<StockForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<StockForm>>({});
  const [formLoading, setFormLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ApiStockItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const apiFilter = categoryFilter === 'minibar' ? undefined : (categoryFilter || undefined);
      const data = await stockApi.getAll(apiFilter);
      setItems(categoryFilter === 'minibar' ? data.filter((d) => d.isMinibar) : data);
    } catch (err) {
      console.error('Stok verileri yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  /* Form aç/kapat */
  const openAddForm = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEditForm = (item: ApiStockItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: String(item.quantity),
      isMinibar: item.isMinibar,
      minibarPrice: item.minibarPrice ? String(parseFloat(item.minibarPrice)) : '',
    });
    setFormErrors({});
    setFormOpen(true);
  };

  /* Kaydet */
  const handleSave = async () => {
    const errs: Partial<StockForm> = {};
    if (!form.name.trim()) errs.name = 'Ürün adı zorunlu';
    if (!form.quantity || isNaN(Number(form.quantity))) errs.quantity = 'Geçerli miktar girin';
    if (form.isMinibar && (!form.minibarPrice || isNaN(Number(form.minibarPrice)))) errs.minibarPrice = 'Minibar fiyatı zorunlu';
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setFormLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        quantity: Number(form.quantity),
        isMinibar: form.isMinibar,
        minibarPrice: form.isMinibar && form.minibarPrice ? Number(form.minibarPrice) : undefined,
      };

      if (editingItem) {
        await stockApi.update(editingItem.id, payload);
      } else {
        await stockApi.create(payload);
      }
      setFormOpen(false);
      fetchItems();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Kayıt başarısız');
    } finally {
      setFormLoading(false);
    }
  };

  /* Sil */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await stockApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchItems();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Silme başarısız');
    } finally {
      setDeleteLoading(false);
    }
  };

  /* İşlem kolonu */
  const columns: GridColDef[] = [
    ...baseColumns,
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => {
        const row = params.row as ApiStockItem;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button size="small" sx={{ minWidth: 32, p: 0.5 }} onClick={(e) => { e.stopPropagation(); openEditForm(row); }}>
              <EditIcon fontSize="small" />
            </Button>
            <Button size="small" color="error" sx={{ minWidth: 32, p: 0.5 }} onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
              <DeleteIcon fontSize="small" />
            </Button>
          </Box>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Stok Yönetimi"
        subtitle={`${items.length} ürün`}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddForm}>
            Yeni Ürün
          </Button>
        }
      />

      {/* Kategori filtre */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {['', 'cleaning', 'kitchen', 'office', 'other'].map((cat) => (
          <Chip
            key={cat}
            label={cat ? CATEGORY_LABELS[cat] : 'Tümü'}
            variant={categoryFilter === cat ? 'filled' : 'outlined'}
            color={categoryFilter === cat ? 'primary' : 'default'}
            onClick={() => setCategoryFilter(cat)}
            size="small"
          />
        ))}
        <Chip
          label="Minibar Ürünleri"
          variant={categoryFilter === 'minibar' ? 'filled' : 'outlined'}
          color={categoryFilter === 'minibar' ? 'secondary' : 'default'}
          onClick={() => setCategoryFilter(categoryFilter === 'minibar' ? '' : 'minibar')}
          size="small"
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }} color="text.secondary">Stok yükleniyor...</Typography>
        </Box>
      ) : (
        <DataTable
          rows={items as any}
          columns={columns}
          searchable
          searchPlaceholder="Ürün adı ara..."
        />
      )}

      {/* Ekle / Düzenle Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingItem ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Ürün Adı"
            fullWidth
            size="small"
            required
            value={form.name}
            onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setFormErrors((p) => ({ ...p, name: '' })); }}
            error={!!formErrors.name}
            helperText={formErrors.name}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            select
            label="Kategori"
            fullWidth
            size="small"
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            sx={{ mb: 2 }}
          >
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <MenuItem key={val} value={val}>{label}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Birim"
            fullWidth
            size="small"
            value={form.unit}
            onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
            sx={{ mb: 2 }}
          >
            {Object.entries(UNIT_LABELS).map(([val, label]) => (
              <MenuItem key={val} value={val}>{label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Miktar"
            type="number"
            fullWidth
            size="small"
            required
            value={form.quantity}
            onChange={(e) => { setForm((p) => ({ ...p, quantity: e.target.value })); setFormErrors((p) => ({ ...p, quantity: '' })); }}
            error={!!formErrors.quantity}
            helperText={formErrors.quantity}
            sx={{ mb: 2 }}
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.isMinibar}
                onChange={(e) => setForm((p) => ({ ...p, isMinibar: e.target.checked, minibarPrice: e.target.checked ? p.minibarPrice : '' }))}
              />
            }
            label="Minibarda satılsın"
            sx={{ mb: 1 }}
          />
          {form.isMinibar && (
            <TextField
              label="Minibar Satış Fiyatı (₺)"
              type="number"
              fullWidth
              size="small"
              required
              value={form.minibarPrice}
              onChange={(e) => { setForm((p) => ({ ...p, minibarPrice: e.target.value })); setFormErrors((p) => ({ ...p, minibarPrice: '' })); }}
              error={!!formErrors.minibarPrice}
              helperText={formErrors.minibarPrice}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} color="inherit">Vazgeç</Button>
          <Button variant="contained" onClick={handleSave} disabled={formLoading}>
            {formLoading ? <CircularProgress size={20} /> : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Silme Onay */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Ürün Sil"
        message={`"${deleteTarget?.name}" ürününü silmek istediğinize emin misiniz?`}
        confirmText="Sil"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
};

export default StockManagement;
