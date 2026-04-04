/**
 * ModuleManagement - Modül Yönetimi Bileşeni
 *
 * Otel'in aktif modüllerini gösterir ve admin'in modülleri açıp kapatmasını sağlar.
 * Bağımlılık kontrolü yapar (ör. restoran → eleman yönetimi gerektirir).
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import {
  Extension as ModuleIcon,
  Save as SaveIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { hotelApi } from '../../api/services';
import { MODULE_DEFINITIONS } from '../../utils/constants';
import useAuth from '../../hooks/useAuth';

interface ModuleState {
  id: string;
  label: string;
  description: string;
  alwaysOn: boolean;
  dependsOn: string[];
  enabled: boolean;
}

const ModuleManagement: React.FC = () => {
  const { updateUser, user } = useAuth();
  const [modules, setModules] = useState<ModuleState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'warning' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const data = await hotelApi.getModules();
      setModules(data);
    } catch {
      // API henüz hazır değilse client-side tanımlardan oluştur
      const fallback = MODULE_DEFINITIONS.map((m) => ({
        ...m,
        enabled: user?.enabledModules?.includes(m.id) ?? m.alwaysOn,
      }));
      setModules(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (moduleId: string) => {
    setModules((prev) => {
      const updated = prev.map((m) => ({ ...m }));
      const target = updated.find((m) => m.id === moduleId);
      if (!target || target.alwaysOn) return prev;

      const newEnabled = !target.enabled;
      target.enabled = newEnabled;

      if (newEnabled) {
        // Bağımlılıkları otomatik aç
        const toEnable = [...target.dependsOn];
        while (toEnable.length > 0) {
          const depId = toEnable.pop()!;
          const dep = updated.find((m) => m.id === depId);
          if (dep && !dep.enabled) {
            dep.enabled = true;
            setSnackbar({
              open: true,
              message: `"${target.label}" modülü "${dep.label}" modülünü gerektirdiğinden otomatik etkinleştirildi`,
              severity: 'warning',
            });
            toEnable.push(...dep.dependsOn);
          }
        }
      } else {
        // Bağımlı modülleri otomatik kapat
        const toDisable = updated.filter((m) => m.enabled && m.dependsOn.includes(moduleId));
        toDisable.forEach((dep) => {
          dep.enabled = false;
          setSnackbar({
            open: true,
            message: `"${dep.label}" modülü "${target.label}" modülüne bağımlı olduğundan kapatıldı`,
            severity: 'warning',
          });
        });
      }

      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const enabledModules = modules.filter((m) => m.enabled).map((m) => m.id);
      await hotelApi.updateModules({ enabledModules });

      // AuthContext'teki kullanıcı bilgisini güncelle
      updateUser({ enabledModules });

      setSnackbar({ open: true, message: 'Modüller başarıyla güncellendi. Değişiklikler yeni girişlerde tam olarak yansıyacaktır.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Modüller güncellenirken hata oluştu', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    const currentEnabled = (user?.enabledModules || ['base']).sort().join(',');
    const newEnabled = modules.filter((m) => m.enabled).map((m) => m.id).sort().join(',');
    return currentEnabled !== newEnabled;
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ModuleIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>Modül Yönetimi</Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Otel'inizde kullanmak istediğiniz modülleri açıp kapatabilirsiniz. Kapatılan modüllerin verileri silinmez, sadece erişim kapanır.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {modules.map((mod) => (
            <Box
              key={mod.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                border: '1px solid',
                borderColor: mod.enabled ? 'primary.light' : 'divider',
                borderRadius: 2,
                bgcolor: mod.enabled ? 'primary.50' : 'transparent',
                opacity: mod.alwaysOn ? 0.7 : 1,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>{mod.label}</Typography>
                  {mod.alwaysOn && (
                    <Chip label="Her Zaman Aktif" size="small" color="primary" variant="outlined" />
                  )}
                  {mod.dependsOn.length > 0 && (
                    <Chip
                      icon={<WarningIcon sx={{ fontSize: 14 }} />}
                      label={`${mod.dependsOn.map((d) => modules.find((m) => m.id === d)?.label || d).join(', ')} gerektirir`}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">{mod.description}</Typography>
              </Box>
              <Switch
                checked={mod.enabled}
                onChange={() => handleToggle(mod.id)}
                disabled={mod.alwaysOn}
                color="primary"
              />
            </Box>
          ))}
        </Box>

        {hasChanges() && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </Box>
        )}
      </CardContent>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
      />
    </Card>
  );
};

export default ModuleManagement;
