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
import { TravelExplore as TravelExploreIcon } from '@mui/icons-material';

import { FormField } from '../forms';

interface AgencyFormData {
  name: string;
  taxNumber: string;
  phone: string;
  email: string;
  contactPerson: string;
  commissionRate: string;
  address: string;
  notes: string;
}

const emptyForm: AgencyFormData = {
  name: '',
  taxNumber: '',
  phone: '',
  email: '',
  contactPerson: '',
  commissionRate: '',
  address: '',
  notes: '',
};

export interface AgencyAddResult {
  name: string;
  taxNumber?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  commissionRate?: number;
  address?: string;
  notes?: string;
}

interface AgencyAddDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (result: AgencyAddResult) => void;
  initial?: Partial<AgencyFormData>;
  title?: string;
}

const AgencyAddDialog: React.FC<AgencyAddDialogProps> = ({
  open,
  onClose,
  onSave,
  initial,
  title = 'Yeni Acente Ekle',
}) => {
  const [form, setForm] = useState<AgencyFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<AgencyFormData>>({});

  const handleOpen = () => {
    setForm({ ...emptyForm, ...(initial || {}) });
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof AgencyFormData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSave = () => {
    const errs: Partial<AgencyFormData> = {};
    if (!form.name.trim()) errs.name = 'Acente adı zorunlu';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSave({
      name: form.name.trim(),
      taxNumber: form.taxNumber.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      contactPerson: form.contactPerson.trim() || undefined,
      commissionRate: form.commissionRate ? Number(form.commissionRate) : undefined,
      address: form.address.trim() || undefined,
      notes: form.notes.trim() || undefined,
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
        <TravelExploreIcon color="primary" />
        {title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormField
            label="Acente Adı"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Acente adını girin (ör. Booking.com)"
            required
            error={errors.name}
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField
                label="Vergi Numarası"
                name="taxNumber"
                value={form.taxNumber}
                onChange={handleChange}
                placeholder="Vergi numarası"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormField
                label="Komisyon Oranı (%)"
                name="commissionRate"
                type="number"
                value={form.commissionRate}
                onChange={handleChange}
                placeholder="15"
              />
            </Grid>
          </Grid>
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
                placeholder="info@acente.com"
              />
            </Grid>
          </Grid>
          <FormField
            label="Yetkili Kişi"
            name="contactPerson"
            value={form.contactPerson}
            onChange={handleChange}
            placeholder="İletişim kurulacak kişi"
          />
          <FormField
            label="Adres"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Acente adresi"
            multiline
            rows={2}
          />
          <FormField
            label="Notlar"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Ek notlar (opsiyonel)"
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

export default AgencyAddDialog;
