/**
 * Klima Kontrol Paneli
 *
 * Mevcut/hedef sıcaklık, mod seçimi, hata kodu gösterimi.
 * İlk aşamada mock verilerle çalışır.
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Slider,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  IconButton,
  Switch,
} from '@mui/material';
import {
  AcUnit as CoolIcon,
  Whatshot as HeatIcon,
  Air as FanIcon,
  AutoMode as AutoIcon,
  PowerSettingsNew as PowerIcon,
} from '@mui/icons-material';

interface HvacControlPanelProps {
  roomNumber: string;
}

const HvacControlPanel: React.FC<HvacControlPanelProps> = ({ roomNumber }) => {
  const [isOn, setIsOn] = useState(true);
  const [mode, setMode] = useState<string>('cool');
  const [targetTemp, setTargetTemp] = useState<number>(22);
  const currentTemp = 24.5; // Mock
  const errorCode = null; // Mock — null ise hata yok

  return (
    <Card>
      <CardHeader
        title="Klima / HVAC"
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {errorCode && (
              <Chip label={`Hata: ${errorCode}`} color="error" size="small" />
            )}
            <Switch
              checked={isOn}
              onChange={(_, checked) => setIsOn(checked)}
              size="small"
            />
          </Box>
        }
        sx={{ pb: 0 }}
      />
      <CardContent>
        {isOn ? (
          <>
            {/* Sıcaklık göstergesi */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Mevcut</Typography>
                <Typography variant="h3" fontWeight={700} color="primary">
                  {currentTemp}°C
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary">Hedef</Typography>
                <Typography variant="h3" fontWeight={700} color="text.primary">
                  {targetTemp}°C
                </Typography>
              </Box>
            </Box>

            {/* Sıcaklık slider */}
            <Box sx={{ px: 1 }}>
              <Slider
                value={targetTemp}
                onChange={(_, value) => setTargetTemp(value as number)}
                min={16}
                max={30}
                step={0.5}
                marks={[
                  { value: 16, label: '16°' },
                  { value: 22, label: '22°' },
                  { value: 30, label: '30°' },
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v}°C`}
              />
            </Box>

            {/* Mod seçimi */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Mod
              </Typography>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_, newMode) => newMode && setMode(newMode)}
                size="small"
                fullWidth
                sx={{ mt: 0.5 }}
              >
                <ToggleButton value="cool">
                  <CoolIcon sx={{ mr: 0.5, fontSize: 18 }} /> Soğutma
                </ToggleButton>
                <ToggleButton value="heat">
                  <HeatIcon sx={{ mr: 0.5, fontSize: 18 }} /> Isıtma
                </ToggleButton>
                <ToggleButton value="fan">
                  <FanIcon sx={{ mr: 0.5, fontSize: 18 }} /> Fan
                </ToggleButton>
                <ToggleButton value="auto">
                  <AutoIcon sx={{ mr: 0.5, fontSize: 18 }} /> Oto
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <PowerIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
            <Typography color="text.secondary" sx={{ mt: 1 }}>Klima kapalı</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default HvacControlPanel;
