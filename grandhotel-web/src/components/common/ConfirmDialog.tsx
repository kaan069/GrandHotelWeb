/**
 * ConfirmDialog Bileşeni
 *
 * Silme, iptal gibi kritik işlemler öncesinde kullanıcıdan onay almak için kullanılır.
 *
 * Örnek Kullanım:
 *   <ConfirmDialog
 *     open={deleteDialogOpen}
 *     title="Oda Silinecek"
 *     message="201 numaralı oda kalıcı olarak silinecek. Bu işlem geri alınamaz."
 *     confirmText="Sil"
 *     confirmColor="error"
 *     onConfirm={handleDelete}
 *     onCancel={() => setDeleteDialogOpen(false)}
 *   />
 *
 * Props:
 *   - open (boolean, zorunlu): Dialog açık mı
 *   - title (string): Dialog başlığı
 *   - message (string, zorunlu): Onay mesajı
 *   - confirmText (string): Onay butonu metni (varsayılan: "Onayla")
 *   - cancelText (string): İptal butonu metni (varsayılan: "Vazgeç")
 *   - confirmColor (string): Onay butonu rengi (varsayılan: "primary")
 *   - onConfirm (function, zorunlu): Onay butonu tıklama fonksiyonu
 *   - onCancel (function, zorunlu): İptal/kapatma fonksiyonu
 *   - loading (boolean): Onay butonunda yükleniyor göstergesi
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

type ButtonColor = 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: ButtonColor;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = 'Onay Gerekli',
  message,
  confirmText = 'Onayla',
  cancelText = 'Vazgeç',
  confirmColor = 'primary',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel} // Yüklenirken kapatmayı engelle
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Silme işlemlerinde uyarı ikonu göster */}
        {confirmColor === 'error' && (
          <WarningIcon color="error" />
        )}
        {title}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onCancel}
          disabled={loading}
          color="inherit"
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={confirmColor}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
