import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  RadioGroup,
  Radio,
  FormControlLabel,
  Divider,
  Box,
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
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Müşteri İşlemleri
        </Typography>

        <RadioGroup
          row
          value={customerMode}
          onChange={(e) => onCustomerModeChange(e.target.value as 'new' | 'registered')}
          sx={{ mb: 2 }}
        >
          <FormControlLabel value="new" control={<Radio />} label="Yeni Müşteri" />
          <FormControlLabel value="registered" control={<Radio />} label="Kayıtlı Müşteri" />
        </RadioGroup>

        <Divider sx={{ mb: 2 }} />

        {customerMode === 'new' ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Yeni bir müşteri kaydı oluşturup odaya ekleyin.
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={onNewGuestClick}
              size="large"
            >
              Yeni Müşteri Ekle
            </Button>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Sistemde kayıtlı bir müşteriyi bu odaya atamak için arama yapın.
            </Typography>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={onSearchGuestClick}
              size="large"
            >
              Müşteri Ara
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerManagementSection;
