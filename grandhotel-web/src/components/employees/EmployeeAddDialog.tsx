/**
 * EmployeeAddDialog - Yeni Eleman Ekleme Dialogu
 *
 * Patron yeni personel ekleyebilir:
 *   - Ad, Soyad
 *   - Görevler (çoklu seçim)
 *   - Telefon
 *   - 4 haneli otomatik şifre
 *   - İşe giriş tarihi
 *
 * Props:
 *   - open (boolean): Dialog açık mı
 *   - onClose (function): Kapatma
 *   - onSave (function): Kaydetme callback'i (formData)
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import { FormField } from '../forms';
import { ROLES, ROLE_LABELS } from '../../utils/constants';

/** 4 haneli rastgele şifre üret */
const generatePassword = (): string =>
  String(Math.floor(1000 + Math.random() * 9000));

/** Patron hariç seçilebilir roller */
const SELECTABLE_ROLES = Object.entries(ROLE_LABELS).filter(
  ([key]) => key !== ROLES.PATRON
);

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  roles: string[];
  phone: string;
  password: string;
  hireDate: string;
  salary?: number;
}

interface EmployeeAddDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: EmployeeFormData) => void;
}

const INITIAL_FORM: EmployeeFormData = {
  firstName: '',
  lastName: '',
  roles: [],
  phone: '',
  password: generatePassword(),
  hireDate: new Date().toISOString().split('T')[0],
};

const EmployeeAddDialog: React.FC<EmployeeAddDialogProps> = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState<EmployeeFormData>({ ...INITIAL_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [salaryDisplay, setSalaryDisplay] = useState('');

  useEffect(() => {
    if (open) {
      setFormData({ ...INITIAL_FORM, password: generatePassword() });
      setErrors({});
      setSalaryDisplay('');
    }
  }, [open]);

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d,.]/g, '');
    setSalaryDisplay(raw);
    // Türkçe formatı parse et: binlik nokta, ondalık virgül
    const normalized = raw.replace(/\./g, '').replace(',', '.');
    const numeric = parseFloat(normalized);
    setFormData(prev => ({ ...prev, salary: isNaN(numeric) ? undefined : numeric }));
  };

  const handleSalaryBlur = () => {
    if (formData.salary != null && !isNaN(formData.salary)) {
      setSalaryDisplay(formData.salary.toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleRoleToggle = (role: string) => {
    setFormData((prev) => {
      const roles = prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role];
      return { ...prev, roles };
    });
    if (errors.roles) setErrors((prev) => ({ ...prev, roles: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Ad zorunlu';
    if (!formData.lastName.trim()) newErrors.lastName = 'Soyad zorunlu';
    if (formData.roles.length === 0) newErrors.roles = 'En az bir görev seçin';
    if (!formData.phone.trim()) newErrors.phone = 'Telefon zorunlu';
    if (!formData.password.trim())
      newErrors.password = 'Şifre zorunlu';
    if (!formData.hireDate) newErrors.hireDate = 'İşe giriş tarihi zorunlu';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({ ...formData });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Yeni Eleman Ekle
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {/* Ad ve Soyad */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormField
              label="Ad"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              placeholder="Örn: Mehmet"
              required
              sx={{ flex: 1 }}
            />
            <FormField
              label="Soyad"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              placeholder="Örn: Demir"
              required
              sx={{ flex: 1 }}
            />
          </Box>

          {/* Görevler (çoklu seçim) */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
              Görevler *
            </Typography>
            <FormGroup row>
              {SELECTABLE_ROLES.map(([key, label]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={formData.roles.includes(key)}
                      onChange={() => handleRoleToggle(key)}
                      size="small"
                    />
                  }
                  label={label}
                />
              ))}
            </FormGroup>
            {errors.roles && (
              <FormHelperText error>{errors.roles}</FormHelperText>
            )}
          </Box>

          {/* Telefon */}
          <FormField
            label="Telefon"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            placeholder="Örn: 0532 123 45 67"
            required
          />

          {/* Şifre (4 haneli, otomatik üretilir) */}
          <FormField
            label="Şifre (4 Haneli)"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        password: generatePassword(),
                      }))
                    }
                    size="small"
                    title="Yeni şifre üret"
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* İşe Giriş Tarihi + Maaş */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormField
              label="İşe Giriş Tarihi"
              name="hireDate"
              type="date"
              value={formData.hireDate}
              onChange={handleChange}
              error={errors.hireDate}
              required
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <FormField
              label="Aylık Maaş (₺)"
              name="salary"
              value={salaryDisplay}
              onChange={handleSalaryChange}
              onBlur={handleSalaryBlur}
              placeholder="Örn: 28.104,75"
              sx={{ flex: 1 }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          İptal
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeAddDialog;
