import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Login as CheckInIcon,
  Logout as CheckOutIcon,
} from '@mui/icons-material';

interface CheckInOutItem {
  id: number;
  guest: string;
  room: string;
  time: string;
}

interface CheckInOutListsProps {
  checkIns: CheckInOutItem[];
  checkOuts: CheckInOutItem[];
}

const CheckInOutLists: React.FC<CheckInOutListsProps> = ({ checkIns, checkOuts }) => {
  return (
    <Grid container spacing={2.5}>
      {/* Bugünkü Check-in'ler */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckInIcon color="info" fontSize="small" />
                Bugünkü Girişler
              </Typography>
              <Chip label={checkIns.length} color="info" size="small" />
            </Box>
            <List disablePadding>
              {checkIns.map((item) => (
                <ListItem
                  key={item.id}
                  disableGutters
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <ListItemText
                    primary={item.guest}
                    secondary={`Oda ${item.room}`}
                    primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
                    secondaryTypographyProps={{ fontSize: '0.8125rem' }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {item.time}
                  </Typography>
                </ListItem>
              ))}
              {checkIns.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  Bugün giriş yapacak misafir bulunmuyor
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Bugünkü Check-out'lar */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckOutIcon color="warning" fontSize="small" />
                Bugünkü Çıkışlar
              </Typography>
              <Chip label={checkOuts.length} color="warning" size="small" />
            </Box>
            <List disablePadding>
              {checkOuts.map((item) => (
                <ListItem
                  key={item.id}
                  disableGutters
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <ListItemText
                    primary={item.guest}
                    secondary={`Oda ${item.room}`}
                    primaryTypographyProps={{ fontWeight: 500, fontSize: '0.875rem' }}
                    secondaryTypographyProps={{ fontSize: '0.8125rem' }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {item.time}
                  </Typography>
                </ListItem>
              ))}
              {checkOuts.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  Bugün çıkış yapacak misafir bulunmuyor
                </Typography>
              )}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default CheckInOutLists;
