/**
 * NightAuditReport - Gün Sonu Raporları
 *
 * Kaydedilmiş gün sonu (night audit) raporlarını tarih aralığına göre listeler.
 * Her rapor: ücret yazılan odalar, toplam tutar, no-show'lar, doluluk anlık görüntüsü.
 * API: kazancApi.nightAuditReports() → GET /api/kazanc/night-audit-reports/
 *
 * Not: Mesai devir kayıtları ayrı sayfada (/shift-handover) listelenir.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Divider,
  Alert,
} from '@mui/material';
import {
  NightsStay as NightsStayIcon,
  AttachMoney as TotalIcon,
  MeetingRoom as RoomIcon,
  EventBusy as NoShowIcon,
  Hotel as OccupiedIcon,
  DoorFront as AvailableIcon,
  Percent as RateIcon,
} from '@mui/icons-material';

import { PageHeader, StatCard } from '../../components/common';
import { kazancApi, NightAuditReportItem } from '../../api/services';

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
};

const formatTime = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const formatCurrency = (amount: number): string => {
  return `${Number(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
};

const NightAuditReport: React.FC = () => {
  const [reports, setReports] = useState<NightAuditReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<NightAuditReportItem | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await kazancApi.nightAuditReports({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setReports(data);
    } catch {
      setReports([]);
      setLoadError('Gün sonu raporları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Seçili aralığın özeti
  const totalCharged = reports.reduce((sum, r) => sum + Number(r.totalCharged), 0);
  const totalRoomsCharged = reports.reduce((sum, r) => sum + r.roomsCharged, 0);
  const totalNoShow = reports.reduce((sum, r) => sum + r.noShowCount, 0);

  return (
    <div>
      <PageHeader
        title="Gün Sonu Raporları"
        subtitle="Her gün sonunda yansıtılan oda ücretleri, no-show'lar ve doluluk"
      />

      {/* Filtre */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, flexWrap: 'wrap', '&:last-child': { pb: 2 } }}>
          <NightsStayIcon color="primary" />
          <TextField
            label="Başlangıç"
            type="date"
            size="small"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 180 }}
          />
          <TextField
            label="Bitiş"
            type="date"
            size="small"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 180 }}
          />
          {(dateFrom || dateTo) && (
            <Button size="small" onClick={() => { setDateFrom(''); setDateTo(''); }}>
              Temizle
            </Button>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
            {reports.length} gün sonu
          </Typography>
        </CardContent>
      </Card>

      {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}

      {/* Özet istatistikler */}
      {reports.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard title="Gün Sonu" value={reports.length} icon={<NightsStayIcon />} color="primary" />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard title="Yansıtılan Tutar" value={formatCurrency(totalCharged)} icon={<TotalIcon />} color="success" />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard title="Ücret Yazılan Oda" value={totalRoomsCharged} icon={<RoomIcon />} color="info" />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard title="No-Show" value={totalNoShow} icon={<NoShowIcon />} color="warning" />
          </Grid>
        </Grid>
      )}

      {/* Kayıtlar */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <NightsStayIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              {dateFrom || dateTo ? 'Bu aralıkta gün sonu kaydı bulunamadı.' : 'Henüz gün sonu kaydı bulunmuyor.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tarih</TableCell>
                <TableCell>Saat</TableCell>
                <TableCell>İşlemi Yapan</TableCell>
                <TableCell align="right">Oda</TableCell>
                <TableCell align="right">Tutar</TableCell>
                <TableCell align="right">No-Show</TableCell>
                <TableCell align="right">Doluluk</TableCell>
                <TableCell align="center">Detay</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow
                  key={report.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setSelected(report)}
                >
                  <TableCell sx={{ fontWeight: 600 }}>{formatDate(report.date)}</TableCell>
                  <TableCell>{formatTime(report.processedAt)}</TableCell>
                  <TableCell>
                    {report.automatic ? <Chip label="Otomatik" size="small" color="info" variant="outlined" /> : report.processedBy || '-'}
                  </TableCell>
                  <TableCell align="right">{report.roomsCharged}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(report.totalCharged)}</TableCell>
                  <TableCell align="right">
                    {report.noShowCount > 0 ? `${report.noShowCount} (${report.noShowCancelled} iptal)` : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {report.occupancySnapshot?.rate !== undefined ? `%${report.occupancySnapshot.rate}` : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small">Görüntüle</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Detay Dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
        {selected && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NightsStayIcon color="primary" />
              Gün Sonu Detayı — {formatDate(selected.date)}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selected.automatic ? 'Otomatik gün sonu' : `İşlemi yapan: ${selected.processedBy || '-'}`}
                {' · '}{formatTime(selected.processedAt)}
              </Typography>

              {/* Doluluk anlık görüntüsü */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 4 }}>
                  <StatCard title="Dolu Oda" value={selected.occupancySnapshot?.occupied ?? '-'} icon={<OccupiedIcon />} color="warning" />
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <StatCard title="Boş Oda" value={selected.occupancySnapshot?.available ?? '-'} icon={<AvailableIcon />} color="success" />
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <StatCard
                    title="Doluluk"
                    value={selected.occupancySnapshot?.rate !== undefined ? `%${selected.occupancySnapshot.rate}` : '-'}
                    icon={<RateIcon />}
                    color="info"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ mb: 1 }}>
                Yansıtılan Oda Ücretleri ({selected.roomsCharged} oda · {formatCurrency(selected.totalCharged)})
              </Typography>
              {selected.details.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Bu gün sonunda ücret yazılan oda yok.</Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Oda</TableCell>
                        <TableCell>Misafir</TableCell>
                        <TableCell>Firma</TableCell>
                        <TableCell align="right">Gece</TableCell>
                        <TableCell align="right">Tutar</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selected.details.map((d, i) => (
                        <TableRow key={`${d.roomNumber}-${i}`}>
                          <TableCell sx={{ fontWeight: 600 }}>{d.roomNumber}</TableCell>
                          <TableCell>
                            {d.guestName}
                            {d.note && <Typography variant="caption" display="block" color="text.secondary">{d.note}</Typography>}
                          </TableCell>
                          <TableCell>{d.companyName || '-'}</TableCell>
                          <TableCell align="right">{d.nights ?? '-'}</TableCell>
                          <TableCell align="right">{formatCurrency(d.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {selected.noShowDetails.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>No-Show ({selected.noShowCount})</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Oda</TableCell>
                          <TableCell>Misafir</TableCell>
                          <TableCell align="center">Durum</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selected.noShowDetails.map((n) => (
                          <TableRow key={n.reservationId}>
                            <TableCell sx={{ fontWeight: 600 }}>{n.roomNumber}</TableCell>
                            <TableCell>{n.guestName}</TableCell>
                            <TableCell align="center">
                              <Chip
                                label={n.cancelled ? 'İptal edildi' : 'Bekliyor'}
                                size="small"
                                color={n.cancelled ? 'default' : 'warning'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelected(null)} color="inherit">Kapat</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
};

export default NightAuditReport;
