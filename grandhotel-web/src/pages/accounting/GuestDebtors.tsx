import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Chip,
} from '@mui/material';
import { accountingApi, GuestDebtorsResponse } from '../../api/services';

const fmt = (v: string | number) =>
  Number(v).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

const GuestDebtors: React.FC = () => {
  const [data, setData] = useState<GuestDebtorsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountingApi.guestDebtors()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

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
                <TableRow key={g.id} hover>
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
    </Box>
  );
};

export default GuestDebtors;
