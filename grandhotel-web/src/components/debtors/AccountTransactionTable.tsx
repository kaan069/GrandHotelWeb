/**
 * AccountTransactionTable
 *
 * Firma/acente/guest detay sayfalarında "Cari Hesap Hareketleri" paneli.
 * Açık kayıtlar listelenir; her biri için "Kapat" (settle) butonu vardır.
 */

import React, { useEffect, useState, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';

import { accountTransactionsApi } from '../../api/services';
import type { ApiAccountTransaction, AccountTransactionFilter } from '../../api/services';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface Props {
  filter: AccountTransactionFilter;
  title?: string;
  onChanged?: () => void;
}

const AccountTransactionTable: React.FC<Props> = ({ filter, title = 'Cari Hesap Hareketleri', onChanged }) => {
  const [items, setItems] = useState<ApiAccountTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [settleTarget, setSettleTarget] = useState<ApiAccountTransaction | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleDescription, setSettleDescription] = useState('');
  const [settleLoading, setSettleLoading] = useState(false);

  const fetch = useCallback(() => {
    setLoading(true);
    accountTransactionsApi.getAll(filter)
      .then(setItems)
      .catch((err) => console.error('Cari hareketler yüklenemedi:', err))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const openCount = items.filter((i) => i.status === 'open').length;
  const debitTotal = items
    .filter((i) => i.status === 'open' && i.type === 'debit')
    .reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const creditTotal = items
    .filter((i) => i.status === 'open' && i.type === 'credit')
    .reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const netBalance = debitTotal - creditTotal;

  const handleOpenSettle = (tx: ApiAccountTransaction) => {
    setSettleTarget(tx);
    setSettleAmount(tx.amount);
    setSettleDescription(`Cari hesap ödemesi — ${tx.description || 'kayıt #' + tx.id}`);
  };

  const handleSettle = async () => {
    if (!settleTarget) return;
    const amt = parseFloat(settleAmount);
    if (!amt || amt <= 0) return;
    setSettleLoading(true);
    try {
      await accountTransactionsApi.settle(settleTarget.id, {
        amount: amt,
        description: settleDescription,
      });
      setSettleTarget(null);
      fetch();
      onChanged?.();
    } catch (err) {
      console.error('Kapatma hatası:', err);
    } finally {
      setSettleLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">{title} · Kayıt yok</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            size="small"
            label={`Açık: ${openCount}`}
            color={openCount > 0 ? 'warning' : 'default'}
            variant="outlined"
          />
          <Chip
            size="small"
            label={`Net: ${formatCurrency(netBalance)}`}
            color={netBalance > 0 ? 'error' : netBalance < 0 ? 'success' : 'default'}
            variant="outlined"
          />
        </Box>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tarih</TableCell>
              <TableCell>Tür</TableCell>
              <TableCell>Açıklama</TableCell>
              <TableCell>Kaynak</TableCell>
              <TableCell align="right">Tutar</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell align="center">İşlem</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((tx) => {
              const isCredit = tx.type === 'credit';
              const isSettled = tx.status === 'settled';
              return (
                <TableRow key={tx.id}>
                  <TableCell>{formatDate(tx.createdAt)}</TableCell>
                  <TableCell>
                    <Chip
                      label={isCredit ? 'Alacaklı' : 'Borçlu'}
                      size="small"
                      color={isCredit ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{tx.description || '-'}</TableCell>
                  <TableCell>
                    {tx.roomNumber ? (
                      <Typography variant="caption">
                        Oda {tx.roomNumber}{tx.guestName ? ` · ${tx.guestName}` : ''}
                      </Typography>
                    ) : '-'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: isCredit ? 'success.main' : 'error.main' }}>
                    {isCredit ? '−' : '+'}{formatCurrency(parseFloat(tx.amount) || 0)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={isSettled ? 'Kapandı' : 'Açık'}
                      size="small"
                      color={isSettled ? 'success' : 'warning'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {!isSettled && (
                      <Button size="small" variant="outlined" onClick={() => handleOpenSettle(tx)}>
                        Kapat
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Kapatma Dialog'u */}
      <Dialog open={!!settleTarget} onClose={() => setSettleTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Cari Hareketi Kapat</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Tutar (₺)"
            type="number"
            value={settleAmount}
            onChange={(e) => setSettleAmount(e.target.value)}
            fullWidth
            inputProps={{ min: 0, step: 0.01 }}
          />
          <TextField
            label="Açıklama"
            value={settleDescription}
            onChange={(e) => setSettleDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettleTarget(null)} disabled={settleLoading}>Vazgeç</Button>
          <Button onClick={handleSettle} variant="contained" disabled={settleLoading}>
            {settleLoading ? <CircularProgress size={20} /> : 'Ödemeyi Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountTransactionTable;
