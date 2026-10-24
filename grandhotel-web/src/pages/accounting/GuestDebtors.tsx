/**
 * Şahıs Carileri — açık cari bakiyesi olan bireysel misafirler (muhasebe)
 * Satıra tıklayınca misafirin borç kutucukları (DebtCards) açılır: konaklama başına borç, tahsilat.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from '@mui/material';
import { accountingApi, GuestDebtorsResponse } from '../../api/services';
import DebtCards from '../../components/debtors/DebtCards';

const fmt = (v: string | number) =>
  Number(v).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

const GuestDebtors: React.FC = () => {
  const [data, setData] = useState<GuestDebtorsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<{ id: number; name: string } | null>(null);

  const load = useCallback(() => {
    accountingApi.guestDebtors()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>Şahıs Carileri</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Açık cari bakiyesi (borç − alacak) olan bireysel misafirler.
      </Typography>

      {data && (
        <Chip color="error" sx={{ mb: 2 }} label={`Toplam Borç: ${fmt(data.totalBalance)} — ${data.count} misafir`} />
      )}

      <Paper>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Misafir</TableCell>
                <TableCell>Telefon</TableCell>
                <TableCell>TC No</TableCell>
                <TableCell align="right">Borç</TableCell>
                <TableCell align="right">Alacak</TableCell>
                <TableCell align="right">Bakiye</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.items || []).map((g) => (
                <TableRow key={g.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelected({ id: g.id, name: g.name })}>
                  <TableCell>{g.name}</TableCell>
                  <TableCell>{g.phone || '—'}</TableCell>
                  <TableCell>{g.tcNo || '—'}</TableCell>
                  <TableCell align="right">{fmt(g.debit)}</TableCell>
                  <TableCell align="right">{fmt(g.credit)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>{fmt(g.balance)}</TableCell>
                </TableRow>
              ))}
              {(!data?.items || data.items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Borçlu şahıs cari yok.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="lg" fullWidth>
        <DialogTitle>{selected?.name} — Borçlar</DialogTitle>
        <DialogContent dividers>
          {selected && <DebtCards target={{ guest: selected.id }} onChanged={load} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GuestDebtors;
