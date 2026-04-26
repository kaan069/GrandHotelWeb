/**
 * Menü QR Dialog — otelin şube koduyla katalog QR'ını üretip yazdırır.
 *
 * QR içeriği: {origin}/menu/{branchCode}?t={menuAccessToken}
 * Token olmadan tarayıcıya elle yazılan URL 403 alır.
 * "Yenile" butonu yeni token üretir → eski QR geçersiz olur.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { QRCodeCanvas } from 'qrcode.react';

import { hotelApi } from '../../api/services';

interface Props {
  open: boolean;
  onClose: () => void;
  branchCode: string;
  hotelName: string;
}

const MenuQRDialog: React.FC<Props> = ({ open, onClose, branchCode, hotelName }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    hotelApi.get()
      .then((h) => setToken(h.menuAccessToken ?? null))
      .catch(() => setError('Token alınamadı.'))
      .finally(() => setLoading(false));
  }, [open]);

  const url = token
    ? `${window.location.origin}/menu/${branchCode}?t=${encodeURIComponent(token)}`
    : '';

  const handleDownload = () => {
    const canvas = wrapperRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `menu-qr-${branchCode}.png`;
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
        <head><title>Menü QR — ${hotelName}</title></head>
        <body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">
          <h2 style="margin-bottom:8px;">${hotelName}</h2>
          <p style="margin-top:0;color:#666;">Menüyü görüntülemek için QR kodu okutun</p>
          <img src="${dataUrl}" style="width:320px;height:320px;" />
          <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300);}</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  const handleRegenerate = async () => {
    const ok = window.confirm(
      'Yeni QR kodu üretilecek ve eski QR kodunuz geçersiz olacak. ' +
      'Müşterilerinizin bastığınız eski QR kodları çalışmayacak. Devam edilsin mi?'
    );
    if (!ok) return;
    setRegenerating(true);
    setError(null);
    try {
      const res = await hotelApi.regenerateMenuToken();
      setToken(res.menuAccessToken);
    } catch {
      setError('Token yenilenemedi.');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Menü QR Kodu</DialogTitle>
      <DialogContent>
        <Box
          ref={wrapperRef}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 2,
            minHeight: 320,
            justifyContent: 'center',
          }}
        >
          {loading || !token ? (
            <CircularProgress />
          ) : (
            <>
              <QRCodeCanvas value={url} size={256} level="H" includeMargin />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, wordBreak: 'break-all', textAlign: 'center', fontSize: 11 }}>
                {url}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                Müşterileriniz bu QR'ı okutarak menünüzü görüntüleyebilir.
                URL elle yazılarak erişilemez.
              </Typography>
            </>
          )}
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>{error}</Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1, justifyContent: 'space-between' }}>
        <Button
          onClick={handleRegenerate}
          startIcon={regenerating ? <CircularProgress size={16} /> : <RefreshIcon />}
          disabled={loading || regenerating}
          color="warning"
          size="small"
        >
          QR'ı Yenile
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} color="inherit">Kapat</Button>
          <Button onClick={handleDownload} startIcon={<DownloadIcon />} variant="outlined" disabled={!token}>
            PNG İndir
          </Button>
          <Button onClick={handlePrint} startIcon={<PrintIcon />} variant="contained" disabled={!token}>
            Yazdır
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default MenuQRDialog;
