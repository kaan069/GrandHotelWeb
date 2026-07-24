import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, CircularProgress,
  IconButton, Chip, Stack, FormControlLabel, Checkbox,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import {
  accountingApi, ApiExpense, IncomeExpenseSummary, EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS,
} from '../../api/services';

const fmt = (v: string | number) =>
  Number(v).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthStartStr = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const emptyForm = () => ({
  category: 'other', amount: '', date: todayStr(), description: '', vendor: '',
  paymentMethod: 'cash', isRecurring: false,
});

const IncomeExpense: React.FC = () => {
  const [dateFrom, setDateFrom] = useState(monthStartStr());
  const [dateTo, setDateTo] = useState(todayStr());
  const [summary, setSummary] = useState<IncomeExpenseSummary | null>(null);
  const [expenses, setExpenses] = useState<ApiExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, e] = await Promise.all([
        accountingApi.incomeExpense({ dateFrom, dateTo }),
        accountingApi.listExpenses({ dateFrom, dateTo }),
      ]);
      setSummary(s);
      setExpenses(e);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.amount || Number(form.amount) <= 0) return;
    setSaving(true);
    try {
      await accountingApi.createExpense({ ...form, amount: Number(form.amount) });
      setAddOpen(false);
      setForm(emptyForm());
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bu gideri silmek istiyor musunuz?')) return;
    await accountingApi.deleteExpense(id);
    load();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4" fontWeight={800}>Gelir-Gider</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>Gider Ekle</Button>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <TextField label="Başlangıç" type="date" size="small" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField label="Bitiş" type="date" size="small" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}><Card><CardContent><Typography variant="body2" color="text.secondary">Gelir</Typography><Typography variant="h5" fontWeight={800} color="success.main">{fmt(summary?.income || '0')}</Typography></CardContent></Card></Grid>
        <Grid size={{ xs: 12, md: 4 }}><Card><CardContent><Typography variant="body2" color="text.secondary">Gider</Typography><Typography variant="h5" fontWeight={800} color="error.main">{fmt(summary?.expense || '0')}</Typography></CardContent></Card></Grid>
        <Grid size={{ xs: 12, md: 4 }}><Card><CardContent><Typography variant="body2" color="text.secondary">Net</Typography><Typography variant="h5" fontWeight={800}>{fmt(summary?.net || '0')}</Typography></CardContent></Card></Grid>
      </Grid>

      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Giderler</Typography>
      <Paper>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tarih</TableCell>
                <TableCell>Kategori</TableCell>
                <TableCell>Açıklama</TableCell>
                <TableCell>Tedarikçi</TableCell>
                <TableCell>Ödeme</TableCell>
                <TableCell align="right">Tutar</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((x) => (
                <TableRow key={x.id} hover>
                  <TableCell>{x.date}</TableCell>
                  <TableCell>
                    <Chip size="small" label={x.categoryLabel} />
                    {x.isRecurring && <Chip size="small" color="info" variant="outlined" label="Sabit" sx={{ ml: 0.5 }} />}
                  </TableCell>
                  <TableCell>{x.description || '—'}</TableCell>
                  <TableCell>{x.vendor || '—'}</TableCell>
                  <TableCell>{x.paymentMethodLabel || '—'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>{fmt(x.amount)}</TableCell>
                  <TableCell align="right"><IconButton size="small" color="error" onClick={() => handleDelete(x.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                </TableRow>
              ))}
              {expenses.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>Bu aralıkta gider yok.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Gider Ekle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select fullWidth label="Kategori" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {EXPENSE_CATEGORIES.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth type="number" label="Tutar (₺)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth type="date" label="Tarih" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select fullWidth label="Ödeme Yöntemi" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                {EXPENSE_PAYMENT_METHODS.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Açıklama" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Tedarikçi / Ödenen" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={<Checkbox checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} />}
                label="Sabit / tekrar eden gider (kira, maaş vb.)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleAdd} disabled={saving || !form.amount}>Kaydet</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IncomeExpense;
