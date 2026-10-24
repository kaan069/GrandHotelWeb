/**
 * FolioBalanceSummary — folio hesap özeti: Harcama / Ödenen / Borç durumu
 *
 * Konaklayan müşterinin borcu her harcamayla (gün sonu oda ücreti, kafe, minibar…) artar;
 * ödeme alındıkça azalır. Kural (backend Reservation.refresh_totals ile aynı, utils/folio.ts):
 *   bakiye > 0 → kırmızı "Borçlu: X ₺"
 *   bakiye = 0 → yeşil "Ödendi"
 *   bakiye < 0 → turuncu "Fazla ödeme — iade: X ₺"
 * Oda detayındaki "Folio Özeti" ve "Folio Aç" penceresi kullanır.
 * Mobil karşılığı: GrandHotelMobil/src/components/rooms/FolioBalanceSummary.tsx
 */

import React from 'react';
import { Box, Typography, alpha } from '@mui/material';

import { calcFolioTotals, FolioItemLike } from '../../utils/folio';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  folios: FolioItemLike[];
  /** Ek bilgi (ör. "3 gece konaklama") — harcama satırının yanında */
  note?: string;
}

/** Bakiye → durum etiketi + tema rengi (oda kartı ve listelerde de aynı kural) */
type Tone = 'error' | 'success' | 'warning';

export const folioBalanceStatus = (balance: number): { label: string; tone: Tone; color: `${Tone}.main` } => {
  if (balance > 0.004) return { label: `Borçlu: ${formatCurrency(balance)}`, tone: 'error', color: 'error.main' };
  if (balance < -0.004) return { label: `Fazla ödeme — iade: ${formatCurrency(-balance)}`, tone: 'warning', color: 'warning.main' };
  return { label: 'Ödendi', tone: 'success', color: 'success.main' };
};

const Row: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, color }}>{value}</Typography>
  </Box>
);

const FolioBalanceSummary: React.FC<Props> = ({ folios, note }) => {
  const totals = calcFolioTotals(folios);
  const status = folioBalanceStatus(totals.balance);
  return (
    <Box>
      <Row label={note ? `Harcama (${note})` : 'Harcama'} value={formatCurrency(totals.total)} />
      <Row label="Ödenen" value={formatCurrency(totals.payments - totals.creditTransfers)} color="success.main" />
      <Box
        sx={{
          mt: 1, px: 1.5, py: 1, borderRadius: 1.5,
          bgcolor: (t) => alpha(t.palette[status.tone].main, 0.08),
          border: '1px solid',
          borderColor: status.color,
          textAlign: 'center',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: status.color }}>
          {status.label}
        </Typography>
      </Box>
    </Box>
  );
};

export default FolioBalanceSummary;
