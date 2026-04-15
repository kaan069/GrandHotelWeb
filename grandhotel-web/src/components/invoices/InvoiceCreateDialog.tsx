/**
 * InvoiceCreateDialog - Fatura Oluşturma Dialog'u
 *
 * CompanyList ve RoomDetailContent'ten kullanılır.
 * InvoiceForm'u Dialog içinde sararak müşteri bilgilerini otomatik doldurur.
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
} from '@mui/material';
import { Receipt as ReceiptIcon } from '@mui/icons-material';

import InvoiceForm from './InvoiceForm';
import { InvoiceType, InvoiceCustomerType, Invoice } from '../../utils/constants';

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
  const handleSave = (_invoice: Invoice) => {
    onClose();
  };

  return (
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
            Fatura Kes {customerName && `- ${customerName}`}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <InvoiceForm
          defaultType={defaultType}
          defaultCustomerType={customerType}
          defaultCustomerName={customerName}
          defaultTaxNumber={taxNumber}
          defaultAddress={address}
          defaultCompanyId={companyId}
          defaultRoomId={roomId}
          defaultDescription={defaultDescription}
          onSave={handleSave}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceCreateDialog;
