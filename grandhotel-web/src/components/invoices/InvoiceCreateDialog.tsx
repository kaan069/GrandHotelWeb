/**
 * InvoiceCreateDialog — Fatura Oluşturma Dialog'u
 *
 * RoomDetailContent / CompanyDetail / AgencyDetail'den kullanılır.
 * roomId verilirse açılırken backend'den müşteri + folio bilgileri çekilir.
 * InvoiceForm'dan dönen sonuca göre PDF popup'ı açılır veya hata bilgisi gösterilir.
 */

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { Receipt as ReceiptIcon } from '@mui/icons-material';

import InvoiceForm, { type InvoiceSaveResult } from './InvoiceForm';
import InvoicePdfDialog from './InvoicePdfDialog';
import { InvoiceType, InvoiceCustomerType } from '../../utils/constants';
import { invoicesApi, type InvoicePrepareResponse } from '../../api/services';
import useAuth from '../../hooks/useAuth';

interface InvoiceCreateDialogProps {
  open: boolean;
  onClose: () => void;
  defaultType?: InvoiceType;
  customerType?: InvoiceCustomerType;
  customerName?: string;
  taxNumber?: string;
  address?: string;
  companyId?: number;
  roomId?: number;
  defaultDescription?: string;
}

const InvoiceCreateDialog: React.FC<InvoiceCreateDialogProps> = ({
  open,
  onClose,
  defaultType = 'sales',
  customerType = 'individual',
  customerName = '',
  taxNumber = '',
  address = '',
  companyId,
  roomId,
  defaultDescription = '',
}) => {
  const { user } = useAuth();
  const [prepareData, setPrepareData] = useState<InvoicePrepareResponse | null>(null);
  const [prepareLoading, setPrepareLoading] = useState(false);
  const [prepareError, setPrepareError] = useState('');
  const [pdfResult, setPdfResult] = useState<{ pdfUrl: string; invoiceNo: string } | null>(null);
  const [timeoutToast, setTimeoutToast] = useState(false);

  useEffect(() => {
    if (!open || !roomId) {
      setPrepareData(null);
      setPrepareError('');
      return;
    }
    setPrepareLoading(true);
    setPrepareError('');
    invoicesApi
      .prepare(roomId)
      .then((data) => setPrepareData(data))
      .catch((err: unknown) => {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Oda bilgileri alınamadı.';
        setPrepareError(message);
      })
      .finally(() => setPrepareLoading(false));
  }, [open, roomId]);

  const handleSave = (result: InvoiceSaveResult) => {
    if (result.status === 'completed' && result.pdfUrl) {
      onClose();
      setPdfResult({ pdfUrl: result.pdfUrl, invoiceNo: result.invoiceNo });
    } else if (result.status === 'completed') {
      // completed ama URL gelmedi (mock mod veya Paraşüt pasif)
      onClose();
      setPdfResult({ pdfUrl: '', invoiceNo: result.invoiceNo });
    } else if (result.status === 'timeout') {
      onClose();
      setTimeoutToast(true);
    }
    // 'failed' → form içinde alert gösteriliyor, dialog açık kalsın
  };

  // prepare'den gelen veriler öncelikli, yoksa prop'lar
  const effectiveCustomerType: InvoiceCustomerType = prepareData?.customerType ?? customerType;
  const effectiveCustomerName = prepareData?.customerName || customerName;
  const effectiveTaxNumber = prepareData?.taxNumber || taxNumber;
  const effectiveAddress = prepareData?.address || address;
  const effectiveCompanyId = prepareData?.companyId ?? companyId;
  const effectiveGuestId = prepareData?.guestId;
  const effectiveReservationId = prepareData?.reservationId;
  const effectiveNotes = prepareData?.notes || defaultDescription;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="warning" />
            <Typography variant="h6" component="span">
              Fatura Kes {effectiveCustomerName && `- ${effectiveCustomerName}`}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {prepareLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {prepareError && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {prepareError} — bilgileri elle girebilirsiniz.
                </Alert>
              )}
              <InvoiceForm
                key={`${open}-${roomId ?? 'no-room'}`}
                defaultType={defaultType}
                defaultCustomerType={effectiveCustomerType}
                defaultCustomerName={effectiveCustomerName}
                defaultTaxNumber={effectiveTaxNumber}
                defaultAddress={effectiveAddress}
                defaultCompanyId={effectiveCompanyId ?? undefined}
                defaultRoomId={roomId}
                defaultGuestId={effectiveGuestId}
                defaultReservationId={effectiveReservationId}
                defaultDescription={effectiveNotes}
                createdBy={user ? `${user.firstName} ${user.lastName}`.trim() : undefined}
                onSave={handleSave}
                onCancel={onClose}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      <InvoicePdfDialog
        open={!!pdfResult}
        pdfUrl={pdfResult?.pdfUrl || ''}
        invoiceNo={pdfResult?.invoiceNo || ''}
        onClose={() => setPdfResult(null)}
      />

      <Snackbar
        open={timeoutToast}
        autoHideDuration={6000}
        onClose={() => setTimeoutToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setTimeoutToast(false)}>
          Fatura hala işleniyor. Faturalar listesinden durumunu takip edebilirsiniz.
        </Alert>
      </Snackbar>
    </>
  );
};

export default InvoiceCreateDialog;
