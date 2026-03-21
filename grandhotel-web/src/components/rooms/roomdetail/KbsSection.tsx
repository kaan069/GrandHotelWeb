import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Send as SendIcon,
  Badge as BadgeIcon,
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
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchRecords = async () => {
    try {
      const data = await kbsApi.getRecords({ roomId });
      setRecords(data);
    } catch (err) {
      console.error('KBS kayıtları yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [roomId]);

  const handleSend = async () => {
    setSending(true);
    setSendResults(null);
    try {
      const response = await kbsApi.send(roomId);
      setSendResults(response.results);
      fetchRecords();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'KBS bildirimi başarısız');
    } finally {
      setSending(false);
    }
  };

  const activeRecords = records.filter((r) => r.status === 'checked_in');
  const allSent = isOccupied && activeRecords.length > 0;

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            <BadgeIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'text-bottom' }} />
            KBS Durumu
          </Typography>
          {isOccupied && (
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
          )}
        </Box>

        {/* Gönderim sonuçları */}
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
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 0.5 }}>
            Oda boş — KBS kaydı yok.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default KbsSection;
