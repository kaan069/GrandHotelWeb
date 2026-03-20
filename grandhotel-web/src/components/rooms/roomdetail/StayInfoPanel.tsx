import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  Divider,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';

import { Company, FolioItem, FOLIO_CATEGORY_LABELS } from '../../../utils/constants';

interface StayInfoPanelProps {
  checkInDate: string;
  onCheckInDateChange: (value: string) => void;
  checkOutDate: string;
  onCheckOutDateChange: (value: string) => void;
  selectedCompanyId: string;
  onCompanyChange: (value: string) => void;
  nightlyRate: string;
  onNightlyRateChange: (value: string) => void;
  companies: Company[];
  folios: FolioItem[];
  folioTotal: number;
  onFolioDetailOpen: () => void;
}

const StayInfoPanel: React.FC<StayInfoPanelProps> = ({
  checkInDate,
  onCheckInDateChange,
  checkOutDate,
  onCheckOutDateChange,
  selectedCompanyId,
  onCompanyChange,
  nightlyRate,
  onNightlyRateChange,
  companies,
  folios,
  folioTotal,
  onFolioDetailOpen,
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Konaklama Bilgileri
        </Typography>

        <TextField
          label="Giriş Tarihi"
          type="date"
          fullWidth
          value={checkInDate}
          onChange={(e) => onCheckInDateChange(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ mb: 2 }}
        />

        <TextField
          label="Çıkış Tarihi"
          type="date"
          fullWidth
          value={checkOutDate}
          onChange={(e) => onCheckOutDateChange(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ mb: 2 }}
        />

        <TextField
          select
          label="Firma"
          fullWidth
          value={selectedCompanyId}
          onChange={(e) => onCompanyChange(e.target.value)}
          sx={{ mb: 2 }}
        >
          <MenuItem value="">
            <em>Firma Seçilmedi</em>
          </MenuItem>
          {companies.map((company) => (
            <MenuItem key={company.id} value={String(company.id)}>
              {company.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Gecelik Ücret (₺)"
          type="number"
          fullWidth
          value={nightlyRate}
          onChange={(e) => onNightlyRateChange(e.target.value)}
          slotProps={{
            htmlInput: { min: 0 },
          }}
        />

        {/* Folio Özeti */}
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            <ReceiptIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
            Folio Özeti
          </Typography>
          {folios.length > 0 ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Kalem</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Tutar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {folios.map((folio) => (
                    <TableRow key={folio.id}>
                      <TableCell sx={{ fontSize: '0.8125rem' }}>
                        {FOLIO_CATEGORY_LABELS[folio.category] || folio.category}
                        {folio.description ? ` - ${folio.description}` : ''}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.8125rem' }}>
                        {(folio.category === 'discount' || folio.category === 'payment' ? '-' : '')}
                        {folio.amount.toLocaleString('tr-TR')} ₺
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.8125rem' }}>Toplam</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8125rem' }}>
                      {folioTotal.toLocaleString('tr-TR')} ₺
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              Henüz folio kalemi eklenmemiş.
            </Typography>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<OpenInNewIcon />}
            onClick={onFolioDetailOpen}
            fullWidth
            sx={{ mt: 1.5 }}
          >
            Folio Aç
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StayInfoPanel;
