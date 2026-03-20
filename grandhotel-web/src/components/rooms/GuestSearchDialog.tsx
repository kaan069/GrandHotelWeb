/**
 * GuestSearchDialog - Kayıtlı Müşteri Arama Popup'ı
 *
 * Kayıtlı müşteriler arasında arama yapılır.
 * Seçilen müşteri onaylandıktan sonra odaya atanır.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  InputAdornment,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Search as SearchIcon, Person as PersonIcon } from '@mui/icons-material';

import { Guest } from '../../utils/constants';
import { guestsApi } from '../../api/services';

interface GuestSearchDialogProps {
  open: boolean;
  roomNumber: string | number;
  onClose: () => void;
  onSelect: (guest: Guest) => void;
}

const GuestSearchDialog: React.FC<GuestSearchDialogProps> = ({
  open,
  roomNumber,
  onClose,
  onSelect,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mapApiGuests = (apiGuests: Awaited<ReturnType<typeof guestsApi.getAll>>): Guest[] =>
    apiGuests.map((g) => ({
      id: g.id,
      tcNo: g.tcNo,
      firstName: g.firstName,
      lastName: g.lastName,
      phone: g.phone,
      email: g.email ?? undefined,
      companyId: g.companyId ?? undefined,
      isBlocked: g.isBlocked,
      createdAt: g.createdAt ?? '',
    }));

  const fetchGuests = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const data = q.trim() ? await guestsApi.search(q) : await guestsApi.getAll();
      setResults(mapApiGuests(data));
    } catch (err) {
      console.error('Misafir arama hatası:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedGuest(null);
      setShowConfirm(false);
      fetchGuests('');
    }
  }, [open, fetchGuests]);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchGuests(value);
    }, 300);
  };

  const handleGuestClick = (guest: Guest) => {
    setSelectedGuest(guest);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (selectedGuest) {
      onSelect(selectedGuest);
      onClose();
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
    setSelectedGuest(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon color="primary" />
        Kayıtlı Müşteri Ara
      </DialogTitle>

      <DialogContent>
        {!showConfirm ? (
          <>
            <TextField
              autoFocus
              fullWidth
              placeholder="Ad, soyad veya TC kimlik no ile arayın..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              sx={{ mb: 2, mt: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {loading ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CircularProgress size={28} />
              </Box>
            ) : results.length > 0 ? (
              <List disablePadding sx={{ maxHeight: 300, overflow: 'auto' }}>
                {results.map((guest, index) => (
                  <React.Fragment key={guest.id}>
                    <ListItemButton
                      onClick={() => !guest.isBlocked && handleGuestClick(guest)}
                      disabled={guest.isBlocked}
                      sx={guest.isBlocked ? { opacity: 0.6 } : {}}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {`${guest.firstName} ${guest.lastName}`}
                            {guest.isBlocked && (
                              <Chip label="Engelli" size="small" color="error" sx={{ height: 18, fontSize: '0.65rem' }} />
                            )}
                          </Box>
                        }
                        secondary={`TC: ${guest.tcNo} | Tel: ${guest.phone}`}
                        primaryTypographyProps={{ fontWeight: 500 }}
                        secondaryTypographyProps={{ fontSize: '0.8125rem' }}
                      />
                    </ListItemButton>
                    {index < results.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : !loading ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                Arama kriterlerine uygun müşteri bulunamadı.
              </Typography>
            ) : null}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {selectedGuest?.firstName} {selectedGuest?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              TC: {selectedGuest?.tcNo} | Tel: {selectedGuest?.phone}
            </Typography>
            <Typography variant="body1">
              Bu müşteriyi <strong>Oda {roomNumber}</strong>'ya aktarmak ister misiniz?
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {!showConfirm ? (
          <Button onClick={onClose} color="inherit">Kapat</Button>
        ) : (
          <>
            <Button onClick={handleCancelConfirm} color="inherit">Geri</Button>
            <Button onClick={handleConfirm} variant="contained" color="primary">
              Evet, Aktarım Yap
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GuestSearchDialog;
