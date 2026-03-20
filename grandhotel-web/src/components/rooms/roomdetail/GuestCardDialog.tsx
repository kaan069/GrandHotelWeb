import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

import { Guest, Company } from '../../../utils/constants';
import { formatDate } from '../../../utils/formatters';

interface GuestCardDialogProps {
  open: boolean;
  guest: Guest | null;
  companies: Company[];
  onClose: () => void;
}

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value}</Typography>
  </Box>
);

const GuestCardDialog: React.FC<GuestCardDialogProps> = ({ open, guest, companies, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon color="primary" />
        Müşteri Kartı
      </DialogTitle>
      <DialogContent>
        {guest && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 1 }}>
            <InfoRow label="Ad Soyad" value={`${guest.firstName} ${guest.lastName}`} />
            <Divider />
            <InfoRow label="TC Kimlik No" value={guest.tcNo || '-'} />
            <Divider />
            <InfoRow label="Telefon" value={guest.phone} />
            <Divider />
            <InfoRow label="E-posta" value={guest.email || '-'} />
            <Divider />
            {guest.companyId && (
              <>
                <InfoRow
                  label="Firma"
                  value={companies.find((c) => c.id === guest.companyId)?.name || '-'}
                />
                <Divider />
              </>
            )}
            <InfoRow label="Kayıt Tarihi" value={formatDate(guest.createdAt)} />
            {guest.isBlocked && (
              <>
                <Divider />
                <InfoRow
                  label="Durum"
                  value={<Chip label="Engelli" size="small" color="error" />}
                />
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Kapat</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GuestCardDialog;
