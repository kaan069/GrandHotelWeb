/**
 * FolioAddDialog - Folio Ekleme Dialog'u
 *
 * Oda hesabına yeni folio kalemi ekler.
 * Minibar kategorisi seçildiğinde stoktan ürün listesi gösterilir.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
} from '@mui/material';
import { Receipt as ReceiptIcon } from '@mui/icons-material';

import { FOLIO_CATEGORIES, FOLIO_CATEGORY_LABELS } from '../../utils/constants';
import { minibarApi } from '../../api/services';
import type { ApiMinibarProduct } from '../../api/services';

interface FolioAddDialogProps {
  open: boolean;
  roomId: number;
  onClose: () => void;
  onSave: (data: { category: string; description: string; amount: number }) => void;
}

const FolioAddDialog: React.FC<FolioAddDialogProps> = ({
  open,
  roomId,
  onClose,
  onSave,
}) => {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* Minibar ürünleri */
  const [minibarProducts, setMinibarProducts] = useState<ApiMinibarProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  useEffect(() => {
    if (open && category === FOLIO_CATEGORIES.MINIBAR && minibarProducts.length === 0) {
      minibarApi.getProducts()
        .then(setMinibarProducts)
        .catch((err) => console.error('Minibar ürünleri yüklenemedi:', err));
    }
  }, [open, category]);

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setErrors((p) => ({ ...p, category: '' }));
    // Minibar'dan çıkılırsa seçimi temizle
    if (value !== FOLIO_CATEGORIES.MINIBAR) {
      setSelectedProductId('');
    }
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const product = minibarProducts.find((p) => String(p.id) === productId);
    if (product) {
      setDescription(product.name);
      setAmount(String(parseFloat(product.price)));
      setErrors((p) => ({ ...p, description: '', amount: '' }));
    }
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!category) newErrors.category = 'Kategori seçiniz';
    if (category === FOLIO_CATEGORIES.MINIBAR && !selectedProductId) newErrors.product = 'Ürün seçiniz';
    if (!description.trim()) newErrors.description = 'Açıklama giriniz';
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Geçerli tutar giriniz';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      category,
      description: description.trim(),
      amount: parseFloat(amount),
    });

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setCategory('');
    setDescription('');
    setAmount('');
    setSelectedProductId('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isMinibar = category === FOLIO_CATEGORIES.MINIBAR;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReceiptIcon color="primary" />
        Folio Ekle
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <TextField
          select
          label="Kategori"
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          error={!!errors.category}
          helperText={errors.category}
          fullWidth
        >
          {Object.entries(FOLIO_CATEGORIES).map(([key, value]) => (
            <MenuItem key={key} value={value}>
              {FOLIO_CATEGORY_LABELS[value] || value}
            </MenuItem>
          ))}
        </TextField>

        {/* Minibar ürün seçimi */}
        {isMinibar && (
          <TextField
            select
            label="Minibar Ürünü"
            value={selectedProductId}
            onChange={(e) => handleProductChange(e.target.value)}
            error={!!errors.product}
            helperText={errors.product}
            fullWidth
          >
            {minibarProducts.map((p) => (
              <MenuItem key={p.id} value={String(p.id)}>
                {p.name} — {parseFloat(p.price).toLocaleString('tr-TR')} ₺
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          label="Açıklama"
          value={description}
          onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: '' })); }}
          error={!!errors.description}
          helperText={errors.description}
          fullWidth
          multiline
          rows={2}
          slotProps={{ input: { readOnly: isMinibar } }}
        />

        <TextField
          label="Tutar (₺)"
          type="number"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: '' })); }}
          error={!!errors.amount}
          helperText={errors.amount}
          fullWidth
          inputProps={{ min: 0, step: 0.01 }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">Vazgeç</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Ekle</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FolioAddDialog;
