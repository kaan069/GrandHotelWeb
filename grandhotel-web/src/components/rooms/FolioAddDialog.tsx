/**
 * FolioAddDialog - Folio Ekleme Dialog'u
 *
 * Oda hesabına yeni folio kalemi ekler.
 * Minibar kategorisi seçildiğinde stoktan ürün listesi gösterilir,
 * adet seçimi yapılır ve consume API çağrılarak stoktan düşülür.
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
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';

import { FOLIO_CATEGORIES, FOLIO_CATEGORY_LABELS } from '../../utils/constants';
import { minibarApi } from '../../api/services';
import type { ApiMinibarProduct } from '../../api/services';

export interface FolioAddData {
  category: string;
  description: string;
  amount: number;
  /** Minibar ise — consume API çağrılacak */
  isMinibarConsume?: boolean;
  productId?: number;
  quantity?: number;
}

interface FolioAddDialogProps {
  open: boolean;
  roomId: number;
  onClose: () => void;
  onSave: (data: FolioAddData) => void;
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
  const [quantity, setQuantity] = useState(1);
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
    if (value !== FOLIO_CATEGORIES.MINIBAR) {
      setSelectedProductId('');
      setQuantity(1);
    }
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const product = minibarProducts.find((p) => String(p.id) === productId);
    if (product) {
      setDescription(product.name);
      const unitPrice = parseFloat(product.price);
      setAmount(String(unitPrice * quantity));
      setErrors((p) => ({ ...p, description: '', amount: '', product: '' }));
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = Math.max(1, quantity + delta);
    setQuantity(newQty);
    // Tutarı güncelle
    const product = minibarProducts.find((p) => String(p.id) === selectedProductId);
    if (product) {
      setAmount(String(parseFloat(product.price) * newQty));
    }
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!category) newErrors.category = 'Kategori seçiniz';
    if (isMinibar && !selectedProductId) newErrors.product = 'Ürün seçiniz';
    if (!description.trim()) newErrors.description = 'Açıklama giriniz';
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Geçerli tutar giriniz';

    // Minibar stok kontrolü
    if (isMinibar && selectedProductId) {
      const product = minibarProducts.find((p) => String(p.id) === selectedProductId);
      if (product && quantity > product.availableStock) {
        newErrors.product = `Yetersiz stok (mevcut: ${product.availableStock})`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      category,
      description: description.trim(),
      amount: parseFloat(amount),
      isMinibarConsume: isMinibar,
      productId: isMinibar ? Number(selectedProductId) : undefined,
      quantity: isMinibar ? quantity : undefined,
    });

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setCategory('');
    setDescription('');
    setAmount('');
    setSelectedProductId('');
    setQuantity(1);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isMinibar = category === FOLIO_CATEGORIES.MINIBAR;
  const selectedProduct = minibarProducts.find((p) => String(p.id) === selectedProductId);

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
                {p.availableStock !== undefined && (
                  <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                    (stok: {p.availableStock})
                  </Typography>
                )}
              </MenuItem>
            ))}
          </TextField>
        )}

        {/* Minibar adet seçimi */}
        {isMinibar && selectedProductId && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">Adet:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography variant="h6" sx={{ minWidth: 32, textAlign: 'center', fontWeight: 700 }}>
                {quantity}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleQuantityChange(1)}
                disabled={selectedProduct ? quantity >= selectedProduct.availableStock : false}
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
            {selectedProduct && (
              <Typography variant="caption" color="text.secondary">
                Birim: {parseFloat(selectedProduct.price).toLocaleString('tr-TR')} ₺
              </Typography>
            )}
          </Box>
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
          slotProps={{ input: { readOnly: isMinibar } }}
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
