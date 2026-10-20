/**
 * Eleman Mesai QR Dialog — giriş/çıkış için QR üretir.
 *
 * 3 mod (QR içeriği backend'den gelir: mesai:<mod>:<otel token'ı>):
 *   - Otomatik (mesai:auto:…) — tek QR, backend o günkü kayda göre giriş/çıkış belirler
 *   - Giriş (mesai:giris:…)
 *   - Çıkış (mesai:cikis:…)
 *
 * Mobil uygulama QR'ı okur ve token'ı /api/staff/attendance/mark/'a gönderir;
 * backend token'ı personelin oteliyle karşılaştırır (uydurma/başka otel QR'ı geçmez).
 * "Kodları Yenile" eski (yazdırılmış) QR'ları geçersiz kılar.
 */

import React, { useEffect, useRef, useState } from 'react';
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
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Login as EntryIcon,
  Logout as ExitIcon,
  AutorenewRounded as AutoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { QRCodeCanvas } from 'qrcode.react';

import { attendanceApi, AttendanceQrCodes } from '../../api/services';

interface Props {
  open: boolean;
  onClose: () => void;
  hotelName: string;
}

type Mode = 'auto' | 'entry' | 'exit';

/** codeKey: backend'in döndüğü codes sözlüğündeki anahtar */
const MODES: Record<Mode, { codeKey: keyof AttendanceQrCodes; label: string; subtitle: string; color: string }> = {
  auto: {
    codeKey: 'auto',
    label: 'Otomatik (Tek QR)',
    subtitle: 'Elemanın o günkü kaydına göre giriş ya da çıkış olarak işlenir.',
    color: '#3E2C1C',
  },
  entry: {
    codeKey: 'giris',
    label: 'Sadece Giriş',
    subtitle: 'Bu QR sadece giriş kaydı oluşturur. Çalışan vardiya başlangıcında okutur.',
    color: '#2E7D32',
  },
  exit: {
    codeKey: 'cikis',
    label: 'Sadece Çıkış',
    subtitle: 'Bu QR sadece çıkış kaydı oluşturur. Çalışan vardiya bitiminde okutur.',
    color: '#C62828',
  },
};

const AttendanceQRDialog: React.FC<Props> = ({ open, onClose, hotelName }) => {
  const [mode, setMode] = useState<Mode>('auto');
  const [codes, setCodes] = useState<AttendanceQrCodes | null>(null);
  const [error, setError] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const current = MODES[mode];
  const qrValue = codes ? codes[current.codeKey] : '';

  useEffect(() => {
    if (!open) return;
    setError('');
    attendanceApi.getQrCodes()
      .then(setCodes)
      .catch(() => setError('Mesai QR kodları alınamadı. Bu işlem için patron/müdür yetkisi gerekir.'));
  }, [open]);

  const handleRegenerate = async () => {
    if (!window.confirm('Yeni QR kodları oluşturulacak. Yazdırılmış eski QR\'lar artık çalışmaz. Devam edilsin mi?')) return;
    setRegenerating(true);
    try {
      setCodes(await attendanceApi.regenerateQrCodes());
    } catch {
      setError('QR kodları yenilenemedi.');
    } finally {
      setRegenerating(false);
    }
  };

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
          {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
          {qrValue ? (
            <QRCodeCanvas
              value={qrValue}
              size={256}
              level="H"
              includeMargin
              fgColor={current.color}
            />
          ) : !error && (
            <Box sx={{ width: 256, height: 256, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          )}
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
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">Kapat</Button>
        <Button onClick={handleRegenerate} startIcon={<RefreshIcon />} color="warning" disabled={!codes || regenerating}>
          Kodları Yenile
        </Button>
        <Button onClick={handleDownload} startIcon={<DownloadIcon />} variant="outlined" disabled={!qrValue}>
          PNG İndir
        </Button>
        <Button onClick={handlePrint} startIcon={<PrintIcon />} variant="contained" disabled={!qrValue}>
          Yazdır
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AttendanceQRDialog;
