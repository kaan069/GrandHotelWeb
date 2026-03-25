import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  ButtonGroup,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

interface CustomerManagementSectionProps {
  customerMode: 'new' | 'registered';
  onCustomerModeChange: (mode: 'new' | 'registered') => void;
  onNewGuestClick: () => void;
  onSearchGuestClick: () => void;
}

const CustomerManagementSection: React.FC<CustomerManagementSectionProps> = ({
  customerMode,
  onCustomerModeChange,
  onNewGuestClick,
  onSearchGuestClick,
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
          Müşteri İşlemleri
        </Typography>

        <ButtonGroup size="small" fullWidth sx={{ mb: 1.5 }}>
          <Button
            variant={customerMode === 'new' ? 'contained' : 'outlined'}
            onClick={() => onCustomerModeChange('new')}
          >
            Yeni
          </Button>
          <Button
            variant={customerMode === 'registered' ? 'contained' : 'outlined'}
            onClick={() => onCustomerModeChange('registered')}
          >
            Kayıtlı
          </Button>
        </ButtonGroup>

        <Box sx={{ textAlign: 'center' }}>
          {customerMode === 'new' ? (
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={onNewGuestClick}
              size="small"
              fullWidth
            >
              Yeni Müşteri Ekle
            </Button>
          ) : (
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={onSearchGuestClick}
              size="small"
              fullWidth
            >
              Müşteri Ara
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CustomerManagementSection;
