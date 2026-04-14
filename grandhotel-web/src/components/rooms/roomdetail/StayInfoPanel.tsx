import React, { useMemo } from 'react';
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
  Chip,
  Stack,
  Tooltip,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  OpenInNew as OpenInNewIcon,
  NightsStay as NightsStayIcon,
  Business as BusinessIcon,
  PersonAdd as PersonAddIcon,
  PersonOff as PersonOffIcon,
} from '@mui/icons-material';

import { Company, FolioItem, FOLIO_CATEGORY_LABELS } from '../../../utils/constants';

export interface CompanyGuestRow {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
}

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
  companyGuests?: CompanyGuestRow[];
  companyGuestsLoading?: boolean;
  roomGuestIds?: number[];
  onSelectCompanyGuest?: (guestId: number) => void;
  onRemoveGuestFromCompany?: (guestId: number, guestName: string) => void;
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
  companyGuests = [],
  companyGuestsLoading = false,
  roomGuestIds = [],
  onSelectCompanyGuest,
  onRemoveGuestFromCompany,
}) => {
  // Konaklama süresi hesapla
  const stayDays = useMemo(() => {
    if (!checkInDate) return 0;
    const cin = new Date(checkInDate);
    const now = new Date();
    const diff = Math.floor((now.getTime() - cin.getTime()) / 86400000);
    return Math.max(0, diff);
  }, [checkInDate]);

  // Planlanan gece sayısı
  const plannedNights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;
    const cin = new Date(checkInDate);
    const cout = new Date(checkOutDate);
    return Math.max(0, Math.ceil((cout.getTime() - cin.getTime()) / 86400000));
  }, [checkInDate, checkOutDate]);

  // Gece sayısı girildiğinde çıkış tarihini hesapla
  const handleNightsChange = (value: string) => {
    const n = parseInt(value, 10);
    if (!checkInDate || isNaN(n) || n < 1) return;
    const cin = new Date(checkInDate);
    cin.setDate(cin.getDate() + n);
    const yyyy = cin.getFullYear();
    const mm = String(cin.getMonth() + 1).padStart(2, '0');
    const dd = String(cin.getDate()).padStart(2, '0');
    onCheckOutDateChange(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          Konaklama Bilgileri
        </Typography>

        {/* Konaklama süresi */}
        {checkInDate && stayDays > 0 && (
          <Chip
            icon={<NightsStayIcon />}
            label={`${stayDays}. gün — ${stayDays} gecedir konaklıyor`}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ mb: 2 }}
          />
        )}

        <TextField
          label="Giriş Tarihi"
          type="date"
          fullWidth
          value={checkInDate}
          onChange={(e) => onCheckInDateChange(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            label="Çıkış Tarihi"
            type="date"
            fullWidth
            value={checkOutDate}
            onChange={(e) => onCheckOutDateChange(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Gece"
            type="number"
            value={plannedNights || ''}
            onChange={(e) => handleNightsChange(e.target.value)}
            slotProps={{ htmlInput: { min: 1 }, inputLabel: { shrink: true } }}
            sx={{ width: 90, flexShrink: 0 }}
          />
        </Box>

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

        {/* Firmaya Kayıtlı Misafirler — Firma seçildiğinde açılır */}
        {selectedCompanyId && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'action.hover',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <BusinessIcon fontSize="small" color="primary" />
              <Typography variant="subtitle2" fontWeight={600}>
                Firmaya Kayıtlı Misafirler
              </Typography>
              <Chip size="small" label={companyGuests.length} />
            </Stack>

            {companyGuestsLoading ? (
              <Typography variant="body2" color="text.secondary">Yükleniyor…</Typography>
            ) : companyGuests.length === 0 ? (
              <Alert severity="info" sx={{ py: 0.5 }}>
                Bu firmaya kayıtlı misafir yok.
              </Alert>
            ) : (
              <Stack spacing={0.5} sx={{ maxHeight: 220, overflowY: 'auto' }}>
                {companyGuests.map((g) => {
                  const alreadyInRoom = roomGuestIds.includes(g.id);
                  const fullName = `${g.firstName} ${g.lastName}`.trim();
                  return (
                    <Box
                      key={g.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 0.75,
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {fullName}
                        </Typography>
                        {g.phone && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {g.phone}
                          </Typography>
                        )}
                      </Box>
                      <Tooltip title={alreadyInRoom ? 'Zaten odada' : 'Odaya ekle'}>
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PersonAddIcon fontSize="small" />}
                            disabled={alreadyInRoom || !onSelectCompanyGuest}
                            onClick={() => onSelectCompanyGuest?.(g.id)}
                          >
                            Seç
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Firmadan çıkar">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onRemoveGuestFromCompany?.(g.id, fullName)}
                          disabled={!onRemoveGuestFromCompany}
                        >
                          <PersonOffIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        )}

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
