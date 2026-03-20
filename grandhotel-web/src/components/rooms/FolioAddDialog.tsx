/**
 * FolioAddDialog - Folio Ekleme Dialog'u
 *
 * Oda hesabına yeni folio kalemi ekler.
 */

import React, { useState } from 'react';
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

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!category) newErrors.category = 'Kategori seçiniz';
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

    // Reset
    setCategory('');
    setDescription('');
    setAmount('');
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setCategory('');
    setDescription('');
    setAmount('');
    setErrors({});
    onClose();
  };

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
          onChange={(e) => { setCategory(e.target.value); setErrors((p) => ({ ...p, category: '' })); }}
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

        <TextField
          label="Açıklama"
          value={description}
          onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: '' })); }}
          error={!!errors.description}
          helperText={errors.description}
          fullWidth
          multiline
          rows={2}
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
