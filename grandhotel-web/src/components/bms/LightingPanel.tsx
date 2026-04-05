/**
 * Aydınlatma Paneli
 *
 * Oda ışıkları listesi, açma/kapama toggle, parlaklık slider.
 * İlk aşamada mock verilerle çalışır.
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Switch,
  Slider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  LightMode as LightIcon,
} from '@mui/icons-material';

interface Light {
  id: number;
  name: string;
  on: boolean;
  brightness: number;
}

interface LightingPanelProps {
  roomNumber: string;
}

const LightingPanel: React.FC<LightingPanelProps> = ({ roomNumber }) => {
  /* Mock ışık verileri */
  const [lights, setLights] = useState<Light[]>([
    { id: 1, name: 'Ana Tavan Lambası', on: true, brightness: 80 },
    { id: 2, name: 'Yatak Başı (Sol)', on: false, brightness: 50 },
    { id: 3, name: 'Yatak Başı (Sağ)', on: false, brightness: 50 },
    { id: 4, name: 'Banyo', on: true, brightness: 100 },
  ]);

  const toggleLight = (id: number) => {
    setLights((prev) =>
      prev.map((l) => l.id === id ? { ...l, on: !l.on } : l)
    );
  };

  const setBrightness = (id: number, brightness: number) => {
    setLights((prev) =>
      prev.map((l) => l.id === id ? { ...l, brightness } : l)
    );
  };

  const allOff = lights.every((l) => !l.on);

  const handleAllToggle = () => {
    const newState = allOff;
    setLights((prev) => prev.map((l) => ({ ...l, on: newState })));
  };

  return (
    <Card>
      <CardHeader
        title="Ayd��nlatma"
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {allOff ? 'Tümü Kapalı' : 'Tümü Aç/Kapa'}
            </Typography>
            <Switch
              checked={!allOff}
              onChange={handleAllToggle}
              size="small"
            />
          </Box>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 1 }}>
        <List disablePadding>
          {lights.map((light, index) => (
            <React.Fragment key={light.id}>
              {index > 0 && <Divider />}
              <ListItem sx={{ px: 0, py: 1 }}>
                <LightIcon
                  sx={{
                    mr: 1.5,
                    fontSize: 20,
                    color: light.on ? '#FFC107' : 'text.disabled',
                  }}
                />
                <ListItemText
                  primary={light.name}
                  secondary={light.on ? `Parlaklık: %${light.brightness}` : 'Kapalı'}
                  primaryTypographyProps={{ fontSize: '0.875rem' }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={light.on}
                    onChange={() => toggleLight(light.id)}
                    size="small"
                  />
                </ListItemSecondaryAction>
              </ListItem>
              {light.on && (
                <Box sx={{ px: 4, pb: 1 }}>
                  <Slider
                    value={light.brightness}
                    onChange={(_, value) => setBrightness(light.id, value as number)}
                    min={10}
                    max={100}
                    step={10}
                    size="small"
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => `%${v}`}
                  />
                </Box>
              )}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default LightingPanel;
