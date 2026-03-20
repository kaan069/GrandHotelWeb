/**
 * ReservationChannelSection Bileşeni
 *
 * Online rezervasyon kanalı yönetimi.
 * Master switch ile kanalı açıp kapatma ve oda tipi yapılandırması.
 */

import React, { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Button,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Public as PublicIcon } from '@mui/icons-material';

import { ChannelRoomConfig } from '../../utils/constants';
import {
  loadChannelSettings,
  saveChannelSettings,
  addChannelRoomConfig,
  updateChannelRoomConfig,
  deleteChannelRoomConfig,
} from '../../utils/hotelStorage';
import ChannelRoomTypeCard from './ChannelRoomTypeCard';
import ChannelRoomTypeDialog from './ChannelRoomTypeDialog';

const ReservationChannelSection: React.FC = () => {
  const [settings, setSettings] = useState(loadChannelSettings);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ChannelRoomConfig | undefined>(undefined);

  const handleToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = { ...settings, isActive: e.target.checked, updatedAt: new Date().toISOString() };
    setSettings(updated);
    saveChannelSettings(updated);
  }, [settings]);

  const handleAddClick = () => {
    setEditingConfig(undefined);
    setDialogOpen(true);
  };

  const handleEditClick = (config: ChannelRoomConfig) => {
    setEditingConfig(config);
    setDialogOpen(true);
  };

  const handleSave = (data: Omit<ChannelRoomConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingConfig) {
      updateChannelRoomConfig(editingConfig.id, data);
    } else {
      addChannelRoomConfig(data);
    }
    setSettings(loadChannelSettings());
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    deleteChannelRoomConfig(id);
    setSettings(loadChannelSettings());
  };

  const handleToggleReservations = (id: number, open: boolean) => {
    updateChannelRoomConfig(id, { reservationsOpen: open });
    setSettings(loadChannelSettings());
  };

  return (
    <>
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PublicIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Online Rezervasyon Kanalı
              </Typography>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.isActive}
                  onChange={handleToggle}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" fontWeight={500}>
                  {settings.isActive ? 'Aktif' : 'Pasif'}
                </Typography>
              }
            />
          </Box>

          {!settings.isActive ? (
            <Alert severity="info" sx={{ borderRadius: 1.5 }}>
              Online rezervasyon kanalı kapalı. Açtığınızda oteliniz online kanalda görünür olacak
              ve müşteriler doğrudan rezervasyon yapabilecek. Kanal ayarlarını yapılandırmak için
              anahtarı açın.
            </Alert>
          ) : (
            <>
              {/* Oda Tipi Ekle butonu */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Kanalda gösterilecek oda tipleri ({settings.roomConfigs.length})
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddClick}
                  sx={{ textTransform: 'none' }}
                >
                  Oda Tipi Ekle
                </Button>
              </Box>

              {/* Oda tipi kartları */}
              {settings.roomConfigs.length === 0 ? (
                <Alert severity="warning" sx={{ borderRadius: 1.5 }}>
                  Henüz oda tipi eklenmedi. Online kanalda görünmek için en az bir oda tipi ekleyin.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {settings.roomConfigs.map((config) => (
                    <ChannelRoomTypeCard
                      key={config.id}
                      config={config}
                      onEdit={handleEditClick}
                      onDelete={handleDelete}
                      onToggleReservations={handleToggleReservations}
                    />
                  ))}
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Oda Tipi Dialog */}
      <ChannelRoomTypeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initialData={editingConfig}
      />
    </>
  );
};

export default ReservationChannelSection;
