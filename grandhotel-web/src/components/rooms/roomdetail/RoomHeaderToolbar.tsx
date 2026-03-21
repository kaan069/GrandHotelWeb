import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Tooltip,
  IconButton,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Info as InfoIcon,
  Hotel as HotelIcon,
  Receipt as ReceiptIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

import { BED_TYPE_LABELS } from '../../../utils/constants';
import { StatusBadge } from '../../common';

interface RoomHeaderToolbarProps {
  roomNumber: string;
  bedType: string;
  status: string;
  isCheckInDisabled: boolean;
  isOccupied: boolean;
  hasGuests: boolean;
  hasReservation?: boolean;
  allRoomNumbers: string[];
  onFolioAddOpen: () => void;
  onDetailOpen: () => void;
  onInvoiceOpen: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onCancel: () => void;
  onSaveReservation?: () => void;
  isSaveEnabled?: boolean;
  onRoomSwitch?: (roomNumber: string) => void;
}

const RoomHeaderToolbar: React.FC<RoomHeaderToolbarProps> = ({
  roomNumber,
  bedType,
  status,
  isCheckInDisabled,
  isOccupied,
  hasGuests,
  hasReservation = false,
  allRoomNumbers,
  onFolioAddOpen,
  onDetailOpen,
  onInvoiceOpen,
  onCheckIn,
  onCheckOut,
  onCancel,
  onSaveReservation,
  isSaveEnabled = false,
  onRoomSwitch,
}) => {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(roomNumber);

  const handleConfirm = () => {
    const trimmed = inputValue.trim();
    if (trimmed && trimmed !== roomNumber && onRoomSwitch) {
      if (allRoomNumbers.includes(trimmed)) {
        onRoomSwitch(trimmed);
      }
    }
    setEditing(false);
    setInputValue(roomNumber);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <HotelIcon color="primary" />
        {editing ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="h5" fontWeight={600}>Oda</Typography>
            <Autocomplete
              freeSolo
              options={allRoomNumbers.filter((n) => n !== roomNumber)}
              value={inputValue}
              onInputChange={(_, val) => setInputValue(val)}
              onChange={(_, val) => {
                if (val) {
                  setInputValue(val);
                  if (val !== roomNumber && onRoomSwitch && allRoomNumbers.includes(val)) {
                    onRoomSwitch(val);
                    setEditing(false);
                    setInputValue(roomNumber);
                  }
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  autoFocus
                  sx={{ width: 100 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirm();
                    if (e.key === 'Escape') { setEditing(false); setInputValue(roomNumber); }
                  }}
                />
              )}
              size="small"
              disableClearable
              sx={{ '& .MuiOutlinedInput-root': { py: 0 } }}
            />
            <IconButton size="small" color="primary" onClick={handleConfirm}>
              <CheckIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }} onClick={() => { setEditing(true); setInputValue(roomNumber); }}>
            <Typography variant="h5" fontWeight={600}>
              Oda {roomNumber}
            </Typography>
            <IconButton size="small" sx={{ opacity: 0.4, '&:hover': { opacity: 1 } }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        <Chip
          label={BED_TYPE_LABELS[bedType] || bedType}
          size="small"
          variant="outlined"
        />
        <StatusBadge status={status} type="room" size="small" />
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={onFolioAddOpen}>
          Folio Ekle
        </Button>
        <Button variant="outlined" size="small" startIcon={<InfoIcon />} onClick={onDetailOpen}>
          Detaylar
        </Button>
        <Button variant="outlined" size="small" color="warning" startIcon={<ReceiptIcon />} onClick={onInvoiceOpen}>
          Fatura Kes
        </Button>
        <Tooltip title={isCheckInDisabled && !hasGuests ? 'Önce misafir ekleyin' : isCheckInDisabled ? 'Ödeme yapılmadan check-in yapılamaz' : ''}>
          <span>
            <Button
              variant="contained"
              size="small"
              color="success"
              startIcon={<LoginIcon />}
              onClick={onCheckIn}
              disabled={isCheckInDisabled || isOccupied}
            >
              Check-in
            </Button>
          </span>
        </Tooltip>
        {onSaveReservation && !isOccupied && (
          <Button
            variant="outlined"
            size="small"
            color="primary"
            onClick={onSaveReservation}
            disabled={hasReservation ? !isSaveEnabled : !hasGuests}
          >
            Kaydet
          </Button>
        )}
        <Button
          variant="contained"
          size="small"
          color="secondary"
          startIcon={<LogoutIcon />}
          onClick={onCheckOut}
          disabled={!isOccupied}
        >
          Check-out
        </Button>
        <Button
          variant="outlined"
          size="small"
          color="error"
          startIcon={<CancelIcon />}
          onClick={onCancel}
          disabled={!hasGuests && !hasReservation}
        >
          İptal Et
        </Button>
      </Box>
    </Box>
  );
};

export default RoomHeaderToolbar;
