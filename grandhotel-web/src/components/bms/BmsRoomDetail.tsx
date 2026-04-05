/**
 * BMS Oda Detay Bileşeni
 *
 * RoomDetailContent'in BMS versiyonu.
 * Folio/misafir/şirket yerine klima, ışık, enerji ve cihaz durumları gösterir.
 */

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Grid,
  IconButton,
  Card,
  CardContent,
  CardHeader,
  Switch,
} from '@mui/material';
import {
  Blinds as CurtainIcon,
} from '@mui/icons-material';

import { ROOM_STATUS_LABELS, ROOM_STATUS_COLORS, RoomGuest } from '../../utils/constants';
import type { ApiRoomMinibarItem } from '../../api/services';
import HvacControlPanel from './HvacControlPanel';
import LightingPanel from './LightingPanel';
import EnergyPanel from './EnergyPanel';
import DeviceStatusList from './DeviceStatusList';

interface Room {
  id: number;
  roomNumber: string;
  bedType: string;
  floor: number;
  capacity: number;
  view: string;
  price: number;
  status: string;
  guestName?: string;
  guests?: RoomGuest[];
  notes?: string;
  reservationId?: number | null;
  reservationCheckIn?: string | null;
  reservationCheckOut?: string | null;
  reservationStatus?: string | null;
  beds?: { type: string }[];
  minibar?: ApiRoomMinibarItem[];
}

interface BmsRoomDetailProps {
  room: Room;
  onClose?: () => void;
}

const BmsRoomDetail: React.FC<BmsRoomDetailProps> = ({ room, onClose }) => {
  const [curtainOpen, setCurtainOpen] = React.useState(true);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Oda {room.roomNumber}
        </Typography>
        <Chip
          label={ROOM_STATUS_LABELS[room.status] || room.status}
          color={ROOM_STATUS_COLORS[room.status] || 'default'}
          size="small"
        />
        {room.guestName && (
          <Typography variant="body2" color="text.secondary">
            Misafir: {room.guestName}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          Kat {room.floor}
        </Typography>
      </Box>

      {/* İki sütunlu layout */}
      <Grid container spacing={2.5}>
        {/* Sol panel — Kontrol panelleri */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2}>
            {/* Klima */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <HvacControlPanel roomNumber={room.roomNumber} />
            </Grid>

            {/* Aydınlatma */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <LightingPanel roomNumber={room.roomNumber} />
            </Grid>

            {/* Perde Kontrolü */}
            <Grid size={12}>
              <Card>
                <CardHeader
                  title="Perde / Stor"
                  titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                  action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {curtainOpen ? 'Açık' : 'Kapalı'}
                      </Typography>
                      <Switch
                        checked={curtainOpen}
                        onChange={(_, checked) => setCurtainOpen(checked)}
                        size="small"
                      />
                    </Box>
                  }
                  sx={{ pb: 0 }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CurtainIcon sx={{ fontSize: 40, color: curtainOpen ? 'primary.main' : 'text.disabled' }} />
                    <Box>
                      <Typography variant="body2">
                        {curtainOpen ? 'Perdeler açık — gün ışığı alınıyor' : 'Perdeler kapalı'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Motorlu perde sistemi
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Sağ panel — Enerji ve cihaz durumları */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <EnergyPanel roomNumber={room.roomNumber} />
            </Grid>
            <Grid size={12}>
              <DeviceStatusList roomNumber={room.roomNumber} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BmsRoomDetail;
