/**
 * Cihaz Durumları Listesi
 *
 * Odadaki tüm BMS cihazlarının online/offline/error durumu.
 * İlk aşamada mock verilerle çalışır.
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  ThermostatAuto as HvacIcon,
  LightMode as LightIcon,
  Blinds as CurtainIcon,
  ElectricalServices as MeterIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';

interface DeviceStatusListProps {
  roomNumber: string;
}

interface MockDevice {
  id: number;
  name: string;
  type: 'light' | 'hvac' | 'curtain' | 'power_meter';
  status: 'online' | 'offline' | 'error';
}

const typeIcon: Record<string, React.ElementType> = {
  light: LightIcon,
  hvac: HvacIcon,
  curtain: CurtainIcon,
  power_meter: MeterIcon,
};

const statusColor: Record<string, string> = {
  online: '#4CAF50',
  offline: '#9E9E9E',
  error: '#F44336',
};

const statusLabel: Record<string, string> = {
  online: 'Online',
  offline: 'Offline',
  error: 'Hata',
};

const DeviceStatusList: React.FC<DeviceStatusListProps> = ({ roomNumber }) => {
  /* Mock cihaz verileri */
  const devices: MockDevice[] = [
    { id: 1, name: 'Klima Ünitesi', type: 'hvac', status: 'online' },
    { id: 2, name: 'Ana Tavan Lambası', type: 'light', status: 'online' },
    { id: 3, name: 'Yatak Başı (Sol)', type: 'light', status: 'online' },
    { id: 4, name: 'Yatak Başı (Sağ)', type: 'light', status: 'offline' },
    { id: 5, name: 'Banyo Lambası', type: 'light', status: 'online' },
    { id: 6, name: 'Perde Motoru', type: 'curtain', status: 'online' },
    { id: 7, name: 'Enerji Sayacı', type: 'power_meter', status: 'online' },
  ];

  const onlineCount = devices.filter((d) => d.status === 'online').length;

  return (
    <Card>
      <CardHeader
        title="Cihaz Durumları"
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        action={
          <Chip
            label={`${onlineCount}/${devices.length} Online`}
            color="success"
            size="small"
            variant="outlined"
          />
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 1 }}>
        <List disablePadding dense>
          {devices.map((device) => {
            const Icon = typeIcon[device.type] || MeterIcon;
            return (
              <ListItem key={device.id} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Icon sx={{ fontSize: 20, color: 'text.secondary' }} />
                </ListItemIcon>
                <ListItemText
                  primary={device.name}
                  primaryTypographyProps={{ fontSize: '0.8125rem' }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CircleIcon sx={{ fontSize: 8, color: statusColor[device.status] }} />
                  <Typography variant="caption" sx={{ color: statusColor[device.status] }}>
                    {statusLabel[device.status]}
                  </Typography>
                </Box>
              </ListItem>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
};

export default DeviceStatusList;
