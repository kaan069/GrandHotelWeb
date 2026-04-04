import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Collapse,
  IconButton,
  Snackbar,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Send as SendIcon,
  Badge as BadgeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { kbsApi } from '../../../api/services';
import type { ApiKbsRecord, ApiKbsResult } from '../../../api/services';

interface KbsSectionProps {
  roomId: number;
  isOccupied: boolean;
}

const KbsSection: React.FC<KbsSectionProps> = ({ roomId, isOccupied }) => {
  const [records, setRecords] = useState<ApiKbsRecord[]>([]);
  const [sendResults, setSendResults] = useState<ApiKbsResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await kbsApi.getRecords({ roomId });
      setRecords(data);
    } catch (err) {
      console.error('KBS kayıtları yüklenemedi:', err);
    } finally {
      setLoading(false);
      setFetched(true);
    }
  };

  const handleToggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !fetched) {
      fetchRecords();
    }
  };

  const handleSend = async () => {
    setSending(true);
    setSendResults(null);
    try {
      const response = await kbsApi.send(roomId);
      setSendResults(response.results);
      fetchRecords();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setSnackbar({ open: true, message: axiosErr?.response?.data?.error || 'KBS bildirimi başarısız', severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  const activeRecords = records.filter((r) => r.status === 'checked_in');
  const allSent = isOccupied && activeRecords.length > 0;

  return (
    <>
    <Card sx={{ mt: 2 }}>
      <CardContent sx={{ pb: expanded ? undefined : '16px !important' }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={handleToggle}
        >
          <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
            <BadgeIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'text-bottom' }} />
            KBS Durumu
          </Typography>
          <IconButton size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 1.5 }}>
            {isOccupied && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button
                  size="small"
                  variant={allSent ? 'outlined' : 'contained'}
                  color={allSent ? 'success' : 'primary'}
                  startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
                  onClick={handleSend}
                  disabled={sending}
                >
                  {allSent ? 'Tekrar Gönder' : 'KBS Gönder'}
                </Button>
              </Box>
            )}

            {sendResults && (
              <Alert
                severity={sendResults.every((r) => r.status === 'checked_in') ? 'success' : 'warning'}
                sx={{ mb: 1.5 }}
                onClose={() => setSendResults(null)}
              >
                {sendResults.map((r, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {r.status === 'checked_in' ? (
                      <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    ) : (
                      <ErrorIcon sx={{ fontSize: 16, color: 'error.main' }} />
                    )}
                    <Typography variant="body2">
                      {r.guestName}: {r.message}
                    </Typography>
                  </Box>
                ))}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : activeRecords.length > 0 ? (
              <List dense disablePadding>
                {activeRecords.map((record) => (
                  <ListItem key={record.id} disableGutters sx={{ py: 0.25 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckIcon sx={{ fontSize: 18, color: 'success.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={record.guestName}
                      secondary={`Ref: ${record.kbsReference}`}
                      primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}
                      secondaryTypographyProps={{ fontSize: '0.7rem' }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : isOccupied ? (
              <Typography variant="body2" color="warning.main" sx={{ py: 0.5 }}>
                KBS bildirimi yapılmamış.
              </Typography>
            ) : fetched ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 0.5 }}>
                Oda boş — KBS kaydı yok.
              </Typography>
            ) : null}
          </Box>
        </Collapse>
      </CardContent>
    </Card>

    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled">
        {snackbar.message}
      </Alert>
    </Snackbar>
    </>
  );
};

export default KbsSection;
