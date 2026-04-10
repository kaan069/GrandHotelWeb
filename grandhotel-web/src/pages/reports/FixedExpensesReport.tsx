/**
 * FixedExpensesReport - Sabit Giderler Raporu
 *
 * Aylık tekrarlayan giderlerin özet ve detayını gösterir.
 * Şu an sadece eleman maaşları hesaplanır; ileride kira, fatura vb. eklenecek.
 *
 * API: staffApi.getAll() — aktif elemanların maaşları toplanır.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Payments as PaymentsIcon,
  TrendingDown as ExpenseIcon,
} from '@mui/icons-material';
import { staffApi } from '../../api/services';
import type { ApiEmployee } from '../../api/services';
import { formatCurrency } from '../../utils/formatters';
import { ROLE_LABELS } from '../../utils/constants';

const FixedExpensesReport: React.FC = () => {
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    staffApi.getAll()
      .then((data) => setEmployees(data.filter((e) => e.status === 'active')))
      .catch((err) => console.error('Eleman listesi yüklenemedi:', err))
      .finally(() => setLoading(false));
  }, []);

  const totalSalaries = employees.reduce(
    (sum, e) => sum + Number(e.salary || 0),
    0,
  );
  const employeesWithSalary = employees.filter((e) => e.salary && Number(e.salary) > 0).length;
  const employeesWithoutSalary = employees.length - employeesWithSalary;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Sabit Giderler</Typography>
        <Typography variant="body2" color="text.secondary">
          Aylık tekrarlayan giderlerin özeti
        </Typography>
      </Box>

      {/* Özet Kartlar */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #C62828' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ExpenseIcon sx={{ color: '#C62828' }} />
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                  Toplam Aylık Sabit Gider
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#C62828' }}>
                {formatCurrency(totalSalaries)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #1565C0' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PaymentsIcon sx={{ color: '#1565C0' }} />
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                  Eleman Giderleri
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1565C0' }}>
                {formatCurrency(totalSalaries)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {employeesWithSalary} elemanın maaşı dahil
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%', borderLeft: '4px solid #2E7D32' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PeopleIcon sx={{ color: '#2E7D32' }} />
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                  Aktif Eleman Sayısı
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                {employees.length}
              </Typography>
              {employeesWithoutSalary > 0 && (
                <Typography variant="caption" color="warning.main">
                  {employeesWithoutSalary} elemanın maaşı tanımlı değil
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {employeesWithoutSalary > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {employeesWithoutSalary} elemanın aylık maaşı tanımlanmamış. Eleman Yönetimi sayfasından maaş bilgilerini ekleyebilirsiniz.
        </Alert>
      )}

      {/* Eleman Maaş Tablosu */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Eleman Maaş Detayı
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 600 }}>Personel No</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Ad Soyad</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Görev</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Aylık Maaş</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Aktif eleman yok
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp.id} hover>
                  <TableCell>
                    <Chip label={`#${emp.staffNumber}`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{emp.fullName}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {(emp.roles || []).map((role) => (
                        <Chip key={role} label={ROLE_LABELS[role] || role} size="small" color="primary" variant="outlined" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    {emp.salary && Number(emp.salary) > 0 ? (
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(Number(emp.salary))}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.disabled">Tanımsız</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {employees.length > 0 && (
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafafa' }}>
                <TableCell colSpan={3} sx={{ fontWeight: 700 }}>
                  Toplam Eleman Gideri
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem', color: '#C62828' }}>
                  {formatCurrency(totalSalaries)}
                </TableCell>
              </TableRow>
            </TableHead>
          )}
        </Table>
      </TableContainer>

      <Alert severity="info">
        İleride kira, faturalar (elektrik, su, doğalgaz, internet), vergiler gibi diğer sabit giderler de bu raporda görünecek.
      </Alert>
    </Box>
  );
};

export default FixedExpensesReport;
