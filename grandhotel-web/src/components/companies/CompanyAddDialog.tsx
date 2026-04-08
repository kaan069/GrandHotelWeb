import React, { useState } from 'react';
import {
  Box,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';

import { FormField } from '../forms';

interface CompanyFormData {
  name: string;
  taxNumber: string;
  phone: string;
  email: string;
  address: string;
  agreedRate: string;
}

const emptyForm: CompanyFormData = {
  name: '',
  taxNumber: '',
  phone: '',
  email: '',
  address: '',
  agreedRate: '',
};

export interface CompanyAddResult {
  name: string;
  taxNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  agreedRate?: number;
}

interface CompanyAddDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (result: CompanyAddResult) => void;
}

const CompanyAddDialog: React.FC<CompanyAddDialogProps> = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState<CompanyFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<CompanyFormData>>({});

  const handleOpen = () => {
    setForm(emptyForm);
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CompanyFormData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSave = () => {
    const errs: Partial<CompanyFormData> = {};
    if (!form.name.trim()) errs.name = 'Firma adı zorunlu';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSave({
      name: form.name.trim(),
      taxNumber: form.taxNumber.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      agreedRate: form.agreedRate ? Number(form.agreedRate) : undefined,
    });

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onEnter: handleOpen }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BusinessIcon color="primary" />
        Yeni Firma Ekle
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormField
            label="Firma Adı"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Firma adını girin"
            required
            error={errors.name}
          />
          <FormField
            label="Vergi Numarası"
            name="taxNumber"
            value={form.taxNumber}
            onChange={handleChange}
            placeholder="Vergi numarasını girin"
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField
                label="Telefon"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="0212 123 45 67"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField
                label="E-posta"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="info@firma.com"
              />
            </Grid>
          </Grid>
          <FormField
            label="Anlaşmalı Gecelik Fiyat (₺)"
            name="agreedRate"
            type="number"
            value={form.agreedRate}
            onChange={handleChange}
            placeholder="Örn: 1000"
          />
          <FormField
            label="Adres"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Firma adresini girin"
            multiline
            rows={2}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">İptal</Button>
        <Button onClick={handleSave} variant="contained">Kaydet</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompanyAddDialog;
