/**
 * InvoicePdfDialog — Paraşüt faturası kesildikten sonra PDF URL'yi gösteren popup.
 *
 * Paraşüt'ten dönen (imzalı S3) URL'yi yeni sekmede açmak için kullanılır.
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Stack,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  OpenInNew as OpenInNewIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

interface InvoicePdfDialogProps {
  open: boolean;
  pdfUrl: string;
  invoiceNo: string;
  onClose: () => void;
}

const InvoicePdfDialog: React.FC<InvoicePdfDialogProps> = ({
  open,
  pdfUrl,
  invoiceNo,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleOpen = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopy = async () => {
    if (!pdfUrl) return;
    try {
      await navigator.clipboard.writeText(pdfUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard erişimi engellenmiş, sessiz geç
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CheckIcon color="success" />
        Fatura Oluşturuldu
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" />
            <Typography variant="body1" fontWeight={600}>
              {invoiceNo || 'Paraşüt Faturası'}
            </Typography>
          </Box>

          <Alert severity="success" variant="outlined">
            Paraşüt üzerinden fatura başarıyla kesildi. Aşağıdaki butonla
            faturayı yeni sekmede açıp müşteriye paylaşabilirsiniz.
          </Alert>

          {pdfUrl && (
            <Box
              sx={{
                p: 1.5,
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200',
                wordBreak: 'break-all',
                fontSize: 12,
                fontFamily: 'monospace',
                color: 'text.secondary',
              }}
            >
              {pdfUrl}
            </Box>
          )}

          {copied && <Alert severity="info">Bağlantı panoya kopyalandı.</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleCopy} startIcon={<CopyIcon />} disabled={!pdfUrl}>
          Bağlantıyı Kopyala
        </Button>
        <Button onClick={onClose} color="inherit">
          Kapat
        </Button>
        <Button
          onClick={handleOpen}
          variant="contained"
          startIcon={<OpenInNewIcon />}
          disabled={!pdfUrl}
        >
          Faturayı Aç
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoicePdfDialog;
