import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
} from '@mui/material';

interface QuickReservationSectionProps {
  quickRes: { firstName: string; lastName: string; phone: string };
  onQuickResChange: (field: 'firstName' | 'lastName' | 'phone', value: string) => void;
  onSubmit: () => void;
}

const QuickReservationSection: React.FC<QuickReservationSectionProps> = ({
  quickRes,
  onQuickResChange,
  onSubmit,
}) => {
  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Hızlı Rezervasyon
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Ad"
              fullWidth
              size="small"
              value={quickRes.firstName}
              onChange={(e) => onQuickResChange('firstName', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Soyad"
              fullWidth
              size="small"
              value={quickRes.lastName}
              onChange={(e) => onQuickResChange('lastName', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Telefon"
              fullWidth
              size="small"
              value={quickRes.phone}
              onChange={(e) => onQuickResChange('phone', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Button
              variant="contained"
              color="success"
              fullWidth
              onClick={onSubmit}
              disabled={!quickRes.firstName.trim() || !quickRes.lastName.trim() || !quickRes.phone.trim()}
            >
              Rezerve Et
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default QuickReservationSection;
