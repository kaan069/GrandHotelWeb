import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { auditApi } from '../../../api/services';
import type { ApiAuditLog } from '../../../api/services';

interface AuditLogSectionProps {
  roomId: number;
}

const ACTION_LABELS: Record<string, string> = {
  guest_removed: 'Misafir Çıkarıldı',
  folio_deleted: 'Folio Silindi',
  checkout_reversed: 'Checkout İptal',
  checkin_reversed: 'Checkin İptal',
  guest_checkout: 'Misafir Checkout',
};

const ACTION_COLORS: Record<string, 'warning' | 'error' | 'info' | 'default'> = {
  guest_removed: 'warning',
  folio_deleted: 'error',
  checkout_reversed: 'info',
  checkin_reversed: 'info',
  guest_checkout: 'default',
};

const AuditLogSection: React.FC<AuditLogSectionProps> = ({ roomId }) => {
  const [logs, setLogs] = useState<ApiAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fetched, setFetched] = useState(false);

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !fetched) {
      setLoading(true);
      auditApi.getByRoom(roomId)
        .then(setLogs)
        .catch((err) => console.error('Denetim logları yüklenemedi:', err))
        .finally(() => { setLoading(false); setFetched(true); });
    }
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent sx={{ pb: expanded ? undefined : '16px !important' }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={handleToggle}
        >
          <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
            <HistoryIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'text-bottom' }} />
            Silinen İşlemler
          </Typography>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 1.5 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : logs.length > 0 ? (
              <TableContainer sx={{ maxHeight: 250 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>İşlem</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Açıklama</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Yapan</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Tarih</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Chip
                            label={ACTION_LABELS[log.action] || log.action}
                            size="small"
                            color={ACTION_COLORS[log.action] || 'default'}
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{log.description}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{log.performedBy || '—'}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          {new Date(log.createdAt).toLocaleString('tr-TR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : fetched ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                Kayıtlı işlem bulunmuyor.
              </Typography>
            ) : null}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default AuditLogSection;
