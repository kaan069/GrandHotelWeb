/**
 * IdScanDialog — USB barkod tarayıcı ile T.C. Kimlik MRZ okuma modalı.
 *
 * Akış:
 *  1. Modal açılır, autofocus input
 *  2. Operatör scanner ile kimliğin arkasını okutur
 *  3. Scanner string'i input'a yapıştırır (saniyenin altında, hızlı klavye basışları)
 *  4. parseMrz başarılıysa otomatik onScan(data) callback'i tetiklenir, modal kapanır
 *  5. Operatör manual da yapıştırabilir (Enter ile gönderir)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CreditCard as CardIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

import { parseMrz, type MrzData } from '../../utils/mrzParser';

interface IdScanDialogProps {
  open: boolean;
  onClose: () => void;
  onScan: (data: MrzData) => void;
}

const IdScanDialog: React.FC<IdScanDialogProps> = ({ open, onClose, onScan }) => {
  const [buffer, setBuffer] = useState('');
  const [error, setError] = useState('');
  const [waiting, setWaiting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Modal açıldığında reset + odakla
  useEffect(() => {
    if (!open) return;
    setBuffer('');
    setError('');
    setWaiting(true);
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [open]);

  // Buffer her güncellendiğinde parse dene
  useEffect(() => {
    if (!buffer || buffer.length < 60) return;
    const result = parseMrz(buffer);
    if (result && result.tcNo && result.tcNo.length === 11) {
      setWaiting(false);
      setError('');
      onScan(result);
    }
  }, [buffer, onScan]);

  const handleManualSubmit = () => {
    if (!buffer.trim()) {
      setError('Önce kimliği okutun veya MRZ stringini yapıştırın');
      return;
    }
    const result = parseMrz(buffer);
    if (!result || !result.tcNo || result.tcNo.length !== 11) {
      setError('MRZ okunamadı. Kimliği düzgün okuttuğunuzdan emin olun.');
      return;
    }
    onScan(result);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CardIcon color="primary" />
        Kimlik Tara
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ textAlign: 'center', py: 2 }}>
          {waiting ? (
            <>
              <CircularProgress size={32} sx={{ mb: 1 }} />
              <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                Kimlik kartının arkasını barkod okuyucuya tutun
              </Typography>
              <Typography variant="caption" color="text.secondary">
                MRZ otomatik okunup form alanları doldurulacak
              </Typography>
            </>
          ) : (
            <>
              <CheckIcon color="success" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="body1">Kimlik okundu, işleniyor...</Typography>
            </>
          )}
        </Box>

        <TextField
          inputRef={inputRef}
          label="MRZ Verisi"
          fullWidth
          multiline
          minRows={3}
          value={buffer}
          onChange={(e) => {
            setBuffer(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleManualSubmit();
            }
          }}
          placeholder="Scanner ile okutun veya MRZ'yi buraya yapıştırın"
          inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
          sx={{ mt: 2 }}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          İptal
        </Button>
        <Button onClick={handleManualSubmit} variant="contained" disabled={!buffer.trim()}>
          MRZ'i İşle
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IdScanDialog;
