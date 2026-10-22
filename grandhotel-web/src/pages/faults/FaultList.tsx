/**
 * FaultList - Arıza Yönetimi
 *
 * Arıza listesi, arıza bildirme ve teknik ekip için durum yönetimi.
 * Mobildeki Arıza Bildir / Arıza Listesi ekranlarının web karşılığı (aynı API).
 *
 * Akış: open (Açık) → in_progress (Devam Ediyor) → resolved (Çözüldü)
 *   - Herkes arıza bildirebilir (bildiren backend'de token'dan belirlenir)
 *   - Üstlenme / çözme: teknik ekip + yönetici (FAULT_HANDLER_ROLES, backend de kontrol eder)
 *
 * API: faultsApi (GET/POST /api/faults/, PATCH /status/, POST /resolution-photos/)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  PhotoCamera as PhotoCameraIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

import { PageHeader, DataTable } from '../../components/common';
import { faultsApi, roomsApi, ApiFault } from '../../api/services';
import {
  FAULT_STATUS,
  FAULT_STATUS_LABELS,
  FAULT_STATUS_COLORS,
  FAULT_CATEGORY_LABELS,
  FAULT_HANDLER_ROLES,
} from '../../utils/constants';
import useAuth from '../../hooks/useAuth';
import useNotification from '../../hooks/useNotification';
import { getApiErrorMessage } from '../../utils/apiError';

type FaultRow = ApiFault & { [key: string]: unknown };

const STATUS_FILTERS = [
  { value: `${FAULT_STATUS.OPEN},${FAULT_STATUS.IN_PROGRESS}`, label: 'Aktif' },
  { value: FAULT_STATUS.OPEN, label: 'Açık' },
  { value: FAULT_STATUS.IN_PROGRESS, label: 'Devam Ediyor' },
  { value: FAULT_STATUS.RESOLVED, label: 'Çözüldü' },
  { value: '', label: 'Tümü' },
];

const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '-';

const columns: GridColDef[] = [
  { field: 'roomNumber', headerName: 'Oda / Alan', width: 110 },
  {
    field: 'category',
    headerName: 'Kategori',
    width: 130,
    valueGetter: (value: string) => FAULT_CATEGORY_LABELS[value] || value,
  },
  { field: 'description', headerName: 'Açıklama', flex: 1, minWidth: 220 },
  { field: 'reportedBy', headerName: 'Bildiren', width: 160 },
  {
    field: 'status',
    headerName: 'Durum',
    width: 140,
    renderCell: (params: GridRenderCellParams) => (
      <Chip
        label={FAULT_STATUS_LABELS[params.value] || params.value}
        size="small"
        color={FAULT_STATUS_COLORS[params.value] || 'default'}
      />
    ),
  },
  {
    field: 'createdAt',
    headerName: 'Bildirim',
    width: 150,
    valueGetter: (value: string) => formatDateTime(value),
  },
];

/** Fotoğraf küçük resimleri — tıklayınca tam boy yeni sekmede açılır */
const PhotoGrid: React.FC<{ urls: string[] }> = ({ urls }) => (
  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
    {urls.map((url) => (
      <Box
        key={url}
        component="a"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ width: 96, height: 96, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}
      >
        <Box component="img" src={url} alt="Arıza fotoğrafı" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </Box>
    ))}
  </Box>
);

const FaultList: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const canHandle = (user?.roles || []).some((r) => FAULT_HANDLER_ROLES.includes(r));

  const [faults, setFaults] = useState<FaultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTERS[0].value);
  const [selected, setSelected] = useState<ApiFault | null>(null);
  const [saving, setSaving] = useState(false);
  const [resolutionFiles, setResolutionFiles] = useState<File[]>([]);

  // Arıza bildir diyaloğu
  const [createOpen, setCreateOpen] = useState(false);
  const [roomNumbers, setRoomNumbers] = useState<string[]>([]);
  const [form, setForm] = useState({ roomNumber: '', category: '', description: '' });
  const [formPhotos, setFormPhotos] = useState<File[]>([]);

  const fetchFaults = useCallback(async () => {
    setLoading(true);
    try {
      const data = await faultsApi.getAll(statusFilter ? { status: statusFilter } : undefined);
      setFaults(data as FaultRow[]);
    } catch (err) {
      showError(getApiErrorMessage(err, 'Arızalar yüklenemedi'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showError]);

  useEffect(() => { fetchFaults(); }, [fetchFaults]);

  const openCreate = () => {
    setForm({ roomNumber: '', category: '', description: '' });
    setFormPhotos([]);
    setCreateOpen(true);
    if (roomNumbers.length === 0) {
      roomsApi.getAll()
        .then((rooms) => setRoomNumbers(rooms.map((r) => r.roomNumber).sort((a, b) => a.localeCompare(b, 'tr', { numeric: true }))))
        .catch(() => setRoomNumbers([]));
    }
  };

  const formValid = form.roomNumber.trim() && form.category && form.description.trim();

  const handleCreate = async () => {
    if (!formValid) return;
    setSaving(true);
    try {
      await faultsApi.create({
        roomNumber: form.roomNumber.trim(),
        category: form.category,
        description: form.description.trim(),
        photos: formPhotos,
      });
      showSuccess('Arıza bildirildi');
      setCreateOpen(false);
      fetchFaults();
    } catch (err) {
      showError(getApiErrorMessage(err, 'Arıza bildirilemedi'));
    } finally {
      setSaving(false);
    }
  };

  const openDetail = (row: { id: string | number }) => {
    const fault = faults.find((f) => f.id === Number(row.id));
    if (fault) {
      setSelected(fault);
      setResolutionFiles([]);
    }
  };

  /** Durum değiştir; çözülürken seçilen kanıt fotoğrafları önce yüklenir */
  const changeStatus = async (status: string) => {
    if (!selected) return;
    setSaving(true);
    try {
      if (status === FAULT_STATUS.RESOLVED && resolutionFiles.length > 0) {
        await faultsApi.uploadResolutionPhotos(selected.id, resolutionFiles);
      }
      const updated = await faultsApi.updateStatus(selected.id, status);
      setSelected(updated);
      setResolutionFiles([]);
      showSuccess(status === FAULT_STATUS.RESOLVED ? 'Arıza çözüldü olarak kapatıldı' : 'Arıza üstlenildi');
      fetchFaults();
    } catch (err) {
      showError(getApiErrorMessage(err, 'Durum güncellenemedi'));
    } finally {
      setSaving(false);
    }
  };

  const activeCount = useMemo(
    () => faults.filter((f) => f.status !== FAULT_STATUS.RESOLVED).length,
    [faults],
  );

  return (
    <div>
      <PageHeader
        title="Arızalar"
        subtitle={statusFilter ? `${faults.length} kayıt` : `${faults.length} kayıt · ${activeCount} aktif`}
      />

      <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.label}
            label={f.label}
            variant={statusFilter === f.value ? 'filled' : 'outlined'}
            color={statusFilter === f.value ? 'primary' : 'default'}
            onClick={() => setStatusFilter(f.value)}
            size="small"
          />
        ))}
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ ml: 'auto' }}>
          Arıza Bildir
        </Button>
      </Box>

      <DataTable
        rows={faults}
        columns={columns}
        loading={loading}
        onRowClick={openDetail}
        searchable
        searchPlaceholder="Oda, açıklama veya bildiren ara..."
      />

      {/* ─── Arıza bildir ─── */}
      <Dialog open={createOpen} onClose={() => !saving && setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BuildIcon color="primary" /> Arıza Bildir
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Autocomplete
            freeSolo
            options={roomNumbers}
            inputValue={form.roomNumber}
            onInputChange={(_, value) => setForm((p) => ({ ...p, roomNumber: value.slice(0, 10) }))}
            renderInput={(params) => (
              <TextField {...params} label="Oda / Alan" required helperText="Listeden oda seçin ya da alan yazın (ör. Lobi)" />
            )}
          />
          <TextField
            select
            label="Kategori"
            required
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
          >
            {Object.entries(FAULT_CATEGORY_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>{label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Açıklama"
            required
            multiline
            minRows={3}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <Box>
            <Button component="label" variant="outlined" startIcon={<PhotoCameraIcon />}>
              Fotoğraf Ekle
              <input
                hidden
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFormPhotos(Array.from(e.target.files || []))}
              />
            </Button>
            {formPhotos.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1.5 }}>
                {formPhotos.length} fotoğraf seçildi
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} color="inherit" disabled={saving}>İptal</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!formValid || saving}>Bildir</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Arıza detayı ─── */}
      <Dialog open={!!selected} onClose={() => !saving && setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BuildIcon color="primary" />
              Oda {selected.roomNumber} — {FAULT_CATEGORY_LABELS[selected.category] || selected.category}
              <Chip
                label={FAULT_STATUS_LABELS[selected.status || ''] || selected.status}
                color={FAULT_STATUS_COLORS[selected.status || ''] || 'default'}
                size="small"
                sx={{ ml: 'auto' }}
              />
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{selected.description}</Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Bildiren</Typography>
                  <Typography variant="body2">{selected.reportedBy || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Bildirim</Typography>
                  <Typography variant="body2">{formatDateTime(selected.createdAt)}</Typography>
                </Grid>
                {selected.status === FAULT_STATUS.RESOLVED && (
                  <>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Çözen</Typography>
                      <Typography variant="body2">{selected.resolvedBy || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Çözüm</Typography>
                      <Typography variant="body2">{formatDateTime(selected.resolvedAt)}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>

              {selected.photos.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Arıza Fotoğrafları</Typography>
                  <PhotoGrid urls={selected.photos} />
                </>
              )}
              {selected.resolutionPhotos.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Çözüm Fotoğrafları</Typography>
                  <PhotoGrid urls={selected.resolutionPhotos} />
                </>
              )}

              {canHandle && selected.status !== FAULT_STATUS.RESOLVED && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Button component="label" size="small" startIcon={<PhotoCameraIcon />}>
                    Çözüm fotoğrafı ekle (isteğe bağlı)
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setResolutionFiles(Array.from(e.target.files || []))}
                    />
                  </Button>
                  {resolutionFiles.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {resolutionFiles.length} fotoğraf seçildi
                    </Typography>
                  )}
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelected(null)} color="inherit" disabled={saving}>Kapat</Button>
              {canHandle && selected.status === FAULT_STATUS.OPEN && (
                <Button
                  onClick={() => changeStatus(FAULT_STATUS.IN_PROGRESS)}
                  startIcon={<PlayArrowIcon />}
                  variant="outlined"
                  disabled={saving}
                >
                  Üstlen
                </Button>
              )}
              {canHandle && selected.status !== FAULT_STATUS.RESOLVED && (
                <Button
                  onClick={() => changeStatus(FAULT_STATUS.RESOLVED)}
                  startIcon={<CheckCircleIcon />}
                  variant="contained"
                  color="success"
                  disabled={saving}
                >
                  Çözüldü
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
};

export default FaultList;
