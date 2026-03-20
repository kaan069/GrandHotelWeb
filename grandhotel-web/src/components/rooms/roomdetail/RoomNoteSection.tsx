import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
} from '@mui/material';
import { StickyNote2 as NoteIcon } from '@mui/icons-material';

interface RoomNoteSectionProps {
  note: string;
  onNoteChange: (value: string) => void;
  onSave: () => void;
}

const RoomNoteSection: React.FC<RoomNoteSectionProps> = ({ note, onNoteChange, onSave }) => {
  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <NoteIcon fontSize="small" color="action" />
          Oda Notu
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            multiline
            rows={2}
            placeholder="Bu oda hakkında not ekleyin..."
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
          />
          <Button
            variant="contained"
            size="small"
            onClick={onSave}
            sx={{ alignSelf: 'flex-end', minWidth: 80 }}
          >
            Kaydet
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RoomNoteSection;
