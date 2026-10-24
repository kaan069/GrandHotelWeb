/**
 * DebtCards — Borç kutucukları (firma / acente / şahıs)
 *
 * Borçlunun açık borçları konaklama başına ayrı kart olarak gösterilir (backend
 * GET /account-transactions/open_debts/ → ledger.open_debts): oda, misafir, tarih / gece,
 * borç – ödenen – kalan, folio dökümü (kategori özeti + tüm kalemler) ve bu borca yapılmış
 * kısmi tahsilatlar.
 *
 * Tahsilat: kartlar seçilip "Seçilenleri Tahsil Et" ya da karttaki "Tahsilat". Tutar seçili
 * kartların kalanını aşamaz (kısmi olabilir); önce en eski konaklama kapanır. Kapanan kart
 * listeden düşer, kalanlar açık kalır (ör. ikisi bugün, üçüncüsü haftaya).
 * Avans (borçtan fazla tahsilat) için cari ekstredeki "Tahsilat Al" kullanılır.
 * Mobil karşılığı: GrandHotelMobil/src/components/cari/DebtCards.tsx
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  LinearProgress,
  Typography,
} from '@mui/material';
import {
  CheckCircleOutline as DoneIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Hotel as HotelIcon,
} from '@mui/icons-material';

import { accountTransactionsApi } from '../../api/services';
import type { CariDebtCard, CariOpenDebtsResponse } from '../../api/services';
import { FOLIO_CATEGORY_LABELS, FOLIO_PAYMENT_METHOD_LABELS } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { isFolioDeductionRow } from '../../utils/folio';
import { getApiErrorMessage } from '../../utils/apiError';
import useNotification from '../../hooks/useNotification';
import CariPaymentDialog, { CariPaymentValues } from './CariPaymentDialog';

interface Props {
  /** Tek hedef: { company } | { agency } | { guest } */
  target: { company?: number; agency?: number; guest?: number };
  title?: string;
  /** Tahsilattan sonra (ekstre / liste tazelensin) */
  onChanged?: () => void;
  /** Dışarıdan değişince yeniden yüklenir (ör. ekstrede tahsilat iptal edildi) */
  reloadToken?: number;
}

const num = (v: string | number | null | undefined) => parseFloat(String(v ?? 0)) || 0;

/** Folio özetinde gösterim sırası */
const CATEGORY_ORDER = [
  'room_charge', 'minibar', 'restaurant', 'service', 'discount', 'payment',
  'account_transfer_credit', 'account_transfer_debit',
];
/** Kart bağlamında daha anlaşılır etiketler */
const CARD_CATEGORY_LABELS: Record<string, string> = {
  payment: 'Otelde ödenen',
  account_transfer_debit: 'Cariye aktarılan',
};

const DebtCards: React.FC<Props> = ({ target, title = 'Açık Borçlar', onChanged, reloadToken }) => {
  const { showSuccess, showError } = useNotification();
  const [data, setData] = useState<CariOpenDebtsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  /** Tahsilat penceresindeki kartlar (null → kapalı) */
  const [payCards, setPayCards] = useState<CariDebtCard[] | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    accountTransactionsApi.getOpenDebts(target)
      .then((res) => {
        setData(res);
        // Kapanan kartlar seçimden düşer
        setSelected((prev) => prev.filter((k) => res.debts.some((d) => d.key === k)));
      })
      .catch((err) => showError(getApiErrorMessage(err, 'Açık borçlar yüklenemedi')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.company, target.agency, target.guest, showError]);

  useEffect(() => { load(); }, [load, reloadToken]);

  const debts = useMemo(() => data?.debts ?? [], [data]);
  const selectedCards = debts.filter((d) => selected.includes(d.key));
  const selectedTotal = selectedCards.reduce((s, d) => s + num(d.remaining), 0);
  const allSelected = debts.length > 0 && selected.length === debts.length;

  const toggleSelect = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  const toggleExpand = (key: string) =>
    setExpanded((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const payTotal = (payCards ?? []).reduce((s, d) => s + num(d.remaining), 0);
  const payRooms = (payCards ?? []).map((d) => (d.roomNumber ? `Oda ${d.roomNumber}` : 'Cari borç')).join(', ');

  const handlePay = async (values: CariPaymentValues) => {
    if (!payCards) return;
    try {
      await accountTransactionsApi.collect({
        companyId: target.company, agencyId: target.agency, guestId: target.guest,
        ...values,
        debitIds: payCards.flatMap((d) => d.debitIds),
      });
    } catch (err) {
      showError(getApiErrorMessage(err, 'Tahsilat kaydedilemedi'));
      throw err;
    }
    showSuccess(`${formatCurrency(values.amount)} tahsilat kaydedildi`);
    setPayCards(null);
    setSelected([]);
    load();
    onChanged?.();
  };

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const summary = data?.summary;
  const advance = num(summary?.unallocatedCredit);

  return (
    <Box>
      {/* Başlık + toplu tahsilat */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mr: 1 }}>{title}</Typography>
        {summary && (
          <Chip
            size="small"
            color={num(summary.openDebit) > 0 ? 'error' : 'success'}
            label={`${debts.length} konaklama · ${formatCurrency(num(summary.openDebit))}`}
          />
        )}
        {advance > 0 && (
          <Chip size="small" variant="outlined" color="success" label={`Avans: ${formatCurrency(advance)}`} />
        )}
        <Box sx={{ flex: 1 }} />
        {debts.length > 1 && (
          <Button size="small" onClick={() => setSelected(allSelected ? [] : debts.map((d) => d.key))}>
            {allSelected ? 'Seçimi Kaldır' : 'Tümünü Seç'}
          </Button>
        )}
        <Button
          size="small"
          variant="contained"
          disabled={selectedCards.length === 0}
          onClick={() => setPayCards(selectedCards)}
        >
          {selectedCards.length
            ? `Seçilenleri Tahsil Et (${selectedCards.length} · ${formatCurrency(selectedTotal)})`
            : 'Seçilenleri Tahsil Et'}
        </Button>
      </Box>

      {debts.length === 0 ? (
        <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
          <DoneIcon color="success" sx={{ fontSize: 36 }} />
          <Typography variant="body2">Açık borç yok</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {debts.map((d) => {
            const isSelected = selected.includes(d.key);
            const isOpen = expanded.includes(d.key);
            const amount = num(d.amount);
            const settled = num(d.settled);
            const categories = d.folio
              ? CATEGORY_ORDER.filter((c) => d.folio!.byCategory[c] !== undefined)
              : [];
            return (
              <Grid key={d.key} size={{ xs: 12, sm: 6, xl: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%', display: 'flex', flexDirection: 'column',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    borderWidth: isSelected ? 2 : 1,
                  }}
                >
                  <CardContent sx={{ flex: 1, pb: 1 }}>
                    {/* Oda + seçim */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Checkbox size="small" checked={isSelected} onChange={() => toggleSelect(d.key)} sx={{ ml: -1 }} />
                      <HotelIcon fontSize="small" color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {d.roomNumber ? `Oda ${d.roomNumber}` : 'Cari Borç'}
                      </Typography>
                      {settled > 0 && <Chip size="small" color="warning" variant="outlined" label="Kısmi ödendi" sx={{ ml: 'auto' }} />}
                    </Box>
                    {!!d.guestNames && <Typography variant="body2" sx={{ fontWeight: 500 }}>{d.guestNames}</Typography>}
                    <Typography variant="caption" color="text.secondary" component="div">
                      {d.checkIn
                        ? `${formatDate(d.checkIn)} → ${formatDate(d.checkOut)} · ${d.nights} gece`
                        : `${formatDate(d.firstDebitAt)} · ${d.descriptions.join(', ') || 'Cari borç'}`}
                    </Typography>

                    {/* Tutarlar */}
                    <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Kalan</Typography>
                      <Typography variant="h6" color="error.main" sx={{ fontWeight: 800 }}>
                        {formatCurrency(num(d.remaining))}
                      </Typography>
                    </Box>
                    {settled > 0 && (
                      <>
                        <LinearProgress
                          variant="determinate"
                          value={amount > 0 ? Math.min(100, (settled / amount) * 100) : 0}
                          color="success"
                          sx={{ height: 6, borderRadius: 3, my: 0.5 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Borç {formatCurrency(amount)} · Ödenen {formatCurrency(settled)}
                        </Typography>
                      </>
                    )}

                    {/* Folio özeti */}
                    {categories.length > 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <Divider sx={{ mb: 1 }} />
                        {categories.map((c) => (
                          <Box key={c} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">
                              {CARD_CATEGORY_LABELS[c] || FOLIO_CATEGORY_LABELS[c] || c}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {isFolioDeductionRow(c) ? '−' : ''}{formatCurrency(num(d.folio!.byCategory[c]))}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* Tüm folio kalemleri */}
                    {d.folio && d.folio.items.length > 0 && (
                      <>
                        <Button
                          size="small"
                          onClick={() => toggleExpand(d.key)}
                          endIcon={isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          sx={{ mt: 0.5, px: 0 }}
                        >
                          Folio detayı ({d.folio.items.length} kalem)
                        </Button>
                        <Collapse in={isOpen}>
                          <Box sx={{ maxHeight: 220, overflowY: 'auto', pr: 0.5 }}>
                            {d.folio.items.map((f) => (
                              <Box key={f.id} sx={{ display: 'flex', gap: 1, py: 0.25 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 70 }}>
                                  {formatDate(f.date)}
                                </Typography>
                                <Typography variant="caption" sx={{ flex: 1 }} noWrap title={f.description}>
                                  {f.description}
                                  {f.paymentMethod ? ` · ${FOLIO_PAYMENT_METHOD_LABELS[f.paymentMethod] || f.paymentMethod}` : ''}
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {isFolioDeductionRow(f.category) ? '−' : ''}{formatCurrency(num(f.amount))}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Collapse>
                      </>
                    )}

                    {/* Bu borca yapılan tahsilatlar */}
                    {d.payments.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>Tahsilatlar</Typography>
                        {d.payments.map((p, i) => (
                          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(p.date)} · {p.isTransfer ? 'Alacak mahsubu' : FOLIO_PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod || '—'}
                            </Typography>
                            <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                              {formatCurrency(num(p.amount))}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions sx={{ pt: 0, px: 2, pb: 1.5 }}>
                    <Button size="small" variant="outlined" fullWidth onClick={() => setPayCards([d])}>
                      Tahsilat
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <CariPaymentDialog
        open={!!payCards}
        title={payCards && payCards.length > 1 ? `Tahsilat — ${payCards.length} konaklama` : 'Borca Tahsilat'}
        hint={payCards
          ? `${payRooms} — kalan ${formatCurrency(payTotal)}. Kısmi tutar girilebilir; önce en eski konaklama kapanır.`
          : undefined}
        defaultAmount={payTotal}
        maxAmount={payCards ? payTotal : undefined}
        defaultDescription={payCards ? `Tahsilat — ${payRooms}` : ''}
        onClose={() => setPayCards(null)}
        onSubmit={handlePay}
      />
    </Box>
  );
};

export default DebtCards;
