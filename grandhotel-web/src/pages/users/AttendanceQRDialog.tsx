/**
 * Eleman Mesai QR Dialog — giriş/çıkış için QR üretir.
 *
 * 3 mod:
 *   - Otomatik (mesai:grandhotel) — tek QR, mobile son kayda göre giriş/çıkış belirler
 *   - Giriş (mesai:giris)
 *   - Çıkış (mesai:cikis)
 *
 * Mobile uygulaması bu QR'ları okur, login olmuş elemanın staffNumber'ı ile
 * /api/staff/attendance/mark/ çağrısı yapar.
 */

import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Login as EntryIcon,
  Logout as ExitIcon,
  AutorenewRounded as AutoIcon,
} from '@mui/icons-material';
import { QRCodeCanvas } from 'qrcode.react';

interface Props {
  open: boolean;
  onClose: () => void;
  hotelName: string;
}

type Mode = 'auto' | 'entry' | 'exit';

const MODES: Record<Mode, { value: string; label: string; subtitle: string; color: string }> = {
  auto: {
    value: 'mesai:grandhotel',
    label: 'Otomatik (Tek QR)',
    subtitle: 'Mobil uygulama elemanın o günkü son kaydına göre giriş ya da çıkış olarak işler.',
    color: '#3E2C1C',
  },
  entry: {
    value: 'mesai:giris',
    label: 'Sadece Giriş',
    subtitle: 'Bu QR sadece giriş kaydı oluşturur. Çalışan vardiya başlangıcında okutur.',
    color: '#2E7D32',
  },
  exit: {
    value: 'mesai:cikis',
    label: 'Sadece Çıkış',
    subtitle: 'Bu QR sadece çıkış kaydı oluşturur. Çalışan vardiya bitiminde okutur.',
    color: '#C62828',
  },
};

const AttendanceQRDialog: React.FC<Props> = ({ open, onClose, hotelName }) => {
  const [mode, setMode] = useState<Mode>('auto');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const current = MODES[mode];

  const handleDownload = () => {
    const canvas = wrapperRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `mesai-qr-${mode}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    const canvas = wrapperRef.current?.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html>
        <head><title>Mesai QR — ${current.label}</title></head>
        <body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;text-align:center;padding:40px;">
          <h2 style="margin-bottom:4px;color:${current.color};">${current.label}</h2>
          <p style="margin-top:0;color:#666;">${hotelName}</p>
          <img src="${dataUrl}" style="width:340px;height:340px;margin-top:16px;" />
          <p style="margin-top:20px;color:#444;font-size:14px;max-width:400px;">
            ${current.subtitle}
          </p>
          <p style="margin-top:8px;color:#999;font-size:12px;">Mobil uygulamadan QR'ı okutun</p>
          <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300);}</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Mesai QR Kodları</DialogTitle>

      <Tabs
        value={mode}
        onChange={(_, v) => setMode(v as Mode)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<AutoIcon />} label="Otomatik" value="auto" />
        <Tab icon={<EntryIcon />} label="Giriş" value="entry" />
        <Tab icon={<ExitIcon />} label="Çıkış" value="exit" />
      </Tabs>

      <DialogContent>
        <Box
          ref={wrapperRef}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 2,
          }}
        >
          <QRCodeCanvas
            value={current.value}
            size={256}
            level="H"
            includeMargin
            fgColor={current.color}
          />
          <Typography
            variant="subtitle1"
            sx={{ mt: 2, fontWeight: 700, color: current.color }}
          >
            {current.label}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, textAlign: 'center', maxWidth: 320 }}
          >
            {current.subtitle}
          </Typography>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ mt: 1.5, fontFamily: 'monospace' }}
          >
            {current.value}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">Kapat</Button>
        <Button onClick={handleDownload} startIcon={<DownloadIcon />} variant="outlined">
          PNG İndir
        </Button>
        <Button onClick={handlePrint} startIcon={<PrintIcon />} variant="contained">
          Yazdır
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AttendanceQRDialog;
