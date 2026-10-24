/**
 * AccountTransactionTable — Cari Hesap Ekstresi (firma / acente / şahıs)
 *
 * Tek doğruluk kaynağı cari defterdir (backend apps/accounting/ledger.py):
 *   Borç   : folio bakiyesinin cariye aktarılması (check-out veya "Cariye Borçlu Aktarım")
 *   Tahsilat / Alacak : ödeme (yöntemiyle) veya fazla ödemenin cariye yazılması
 *   Bakiye = Σ borç − Σ alacak  (>0 bize borçlu, <0 avans)
 *
 * İşlemler:
 *   - "Tahsilat Al": tutar + yöntem; en eski açık borçtan başlayarak kapatır, fazlası avans kalır
 *   - Tahsilat satırında "İptal": muhasebe / yönetim (kapattığı borçlar tekrar açılır)
 * Belirli konaklamalara tahsilat borç kutucuklarından yapılır (DebtCards).
 * Tahsilat rezervasyon foliosuna yazılmaz (folio borcu cariye aktarıldığında kapanmıştır).
 * Mobil karşılığı: GrandHotelMobil/src/components/cari/CariStatement.tsx
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
} from '@mui/material';

import { accountTransactionsApi } from '../../api/services';
import type { ApiAccountTransaction, AccountTransactionFilter } from '../../api/services';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { FOLIO_PAYMENT_METHOD_LABELS, ROLES } from '../../utils/constants';
import usePermission from '../../hooks/usePermission';
import useNotification from '../../hooks/useNotification';
import { getApiErrorMessage } from '../../utils/apiError';
import CariPaymentDialog, { CariPaymentValues } from './CariPaymentDialog';

export interface CariSummary {
  balance: number;
  openDebit: number;
  unallocatedCredit: number;
}

interface Props {
  /** Tek hedef: { company } | { agency } | { guest } */
  filter: AccountTransactionFilter;
  title?: string;
  onChanged?: () => void;
  /** Özet değişince (detay ekranındaki "Cari Bakiye" için) */
  onSummary?: (summary: CariSummary) => void;
  /** Dışarıdan değişince yeniden yüklenir (ör. borç kutucuklarından tahsilat) */
  reloadToken?: number;
}

const num = (v: string | number | null | undefined) => parseFloat(String(v ?? 0)) || 0;

const AccountTransactionTable: React.FC<Props> = ({
  filter, title = 'Cari Hesap Ekstresi', onChanged, onSummary, reloadToken,
}) => {
  const { canAccess } = usePermission();
  const { showSuccess, showError } = useNotification();
  const canCancelPayment = canAccess([ROLES.PATRON, ROLES.MANAGER, ROLES.ACCOUNTANT, ROLES.ACCOUNTING_MANAGER]);

  const [items, setItems] = useState<ApiAccountTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectOpen, setCollectOpen] = useState(false);

  const fetch = useCallback(() => {
    setLoading(true);
    accountTransactionsApi.getAll(filter)
      .then(setItems)
      .catch((err) => showError(getApiErrorMessage(err, 'Cari hareketler yüklenemedi')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.company, filter.agency, filter.guest]);

  useEffect(() => { fetch(); }, [fetch, reloadToken]);

  /* Kronolojik yürüyen bakiye; ekranda en yeni üstte */
  const rows = useMemo(() => {
    const asc = [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id);
    let running = 0;
    const withRunning = asc.map((tx) => {
      running += tx.type === 'debit' ? num(tx.amount) : -num(tx.amount);
      return { tx, running };
    });
    return withRunning.reverse();
  }, [items]);

  const summary: CariSummary = useMemo(() => ({
    balance: rows.length ? rows[0].running : 0,
    openDebit: items.filter((i) => i.type === 'debit' && i.status === 'open').reduce((s, i) => s + num(i.remaining), 0),
    unallocatedCredit: items.filter((i) => i.type === 'credit' && i.status === 'open').reduce((s, i) => s + num(i.remaining), 0),
  }), [rows, items]);

  useEffect(() => { onSummary?.(summary); }, [summary, onSummary]);

  const handleSave = async (values: CariPaymentValues) => {
    try {
      await accountTransactionsApi.collect({
        companyId: filter.company, agencyId: filter.agency, guestId: filter.guest, ...values,
      });
    } catch (err) {
      showError(getApiErrorMessage(err, 'Tahsilat kaydedilemedi'));
      throw err;
    }
    showSuccess('Tahsilat kaydedildi');
    setCollectOpen(false);
    fetch();
    onChanged?.();
  };

  const handleCancelPayment = async (tx: ApiAccountTransaction) => {
    if (!window.confirm(`${formatCurrency(num(tx.amount))} tahsilat iptal edilsin mi? Kapattığı borçlar tekrar açılır.`)) return;
    try {
      await accountTransactionsApi.cancelPayment(tx.id);
      showSuccess('Tahsilat iptal edildi');
      fetch();
      onChanged?.();
    } catch (err) {
      showError(getApiErrorMessage(err, 'Tahsilat iptal edilemedi'));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip
            size="small"
            label={`Bakiye: ${formatCurrency(summary.balance)}`}
            color={summary.balance > 0 ? 'error' : summary.balance < 0 ? 'success' : 'default'}
          />
          {summary.unallocatedCredit > 0 && (
            <Chip size="small" variant="outlined" color="success" label={`Avans: ${formatCurrency(summary.unallocatedCredit)}`} />
          )}
          <Button size="small" variant="contained" onClick={() => setCollectOpen(true)}>Tahsilat Al</Button>
        </Box>
      </Box>

      {rows.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="body2">Cari hareket yok</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tarih</TableCell>
                <TableCell>Tür</TableCell>
                <TableCell>Açıklama</TableCell>
                <TableCell>Kaynak</TableCell>
                <TableCell align="right">Tutar</TableCell>
                <TableCell align="right">Kalan</TableCell>
                <TableCell align="right">Bakiye</TableCell>
                <TableCell align="center">İşlem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(({ tx, running }) => {
                const isCredit = tx.type === 'credit';
                const isPayment = isCredit && !tx.sourceFolioItemId;
                const open = tx.status === 'open';
                return (
                  <TableRow key={tx.id}>
                    <TableCell>{formatDate(tx.createdAt)}</TableCell>
                    <TableCell>
                      <Chip
                        label={isPayment ? 'Tahsilat' : isCredit ? 'Alacak' : 'Borç'}
                        size="small"
                        color={isCredit ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {tx.description || '-'}
                      {tx.paymentMethod && (
                        <Chip label={FOLIO_PAYMENT_METHOD_LABELS[tx.paymentMethod] || tx.paymentMethod} size="small" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      {tx.roomNumber ? (
                        <Typography variant="caption">
                          Oda {tx.roomNumber}{tx.guestName ? ` · ${tx.guestName}` : ''}
                        </Typography>
                      ) : '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: isCredit ? 'success.main' : 'error.main' }}>
                      {isCredit ? '−' : '+'}{formatCurrency(num(tx.amount))}
                    </TableCell>
                    <TableCell align="right">
                      {open ? formatCurrency(num(tx.remaining)) : <Chip label="Kapandı" size="small" color="success" variant="outlined" />}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(running)}</TableCell>
                    <TableCell align="center">
                      {isPayment && canCancelPayment && (
                        <Button size="small" color="error" onClick={() => handleCancelPayment(tx)}>İptal</Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CariPaymentDialog
        open={collectOpen}
        title="Tahsilat Al"
        hint="En eski açık borçtan başlayarak kapatılır; borçtan fazlası avans olarak kalır."
        defaultAmount={summary.balance}
        defaultDescription="Cari tahsilat"
        onClose={() => setCollectOpen(false)}
        onSubmit={handleSave}
      />
    </Box>
  );
};

export default AccountTransactionTable;
