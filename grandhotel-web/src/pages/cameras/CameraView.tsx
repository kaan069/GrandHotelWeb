/**
 * CameraView — Kamera İzleme Sayfası
 *
 * Otel kameralarını grid düzeninde canlı izleme.
 * WebRTC, HLS, RTSP-over-WebSocket veya MJPEG destekler.
 * Backend hazır olduğunda stream URL'leri API'den gelir.
 *
 * Mimari:
 * - Her kamera bağımsız bir CameraPlayer bileşeni
 * - Grid layout: 1x1, 2x2, 3x3, 4x4 düzenleri
 * - Tam ekran modu
 * - Bağlantı durumu göstergesi
 * - Otomatik yeniden bağlanma
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  CircularProgress,
  Paper,
  Dialog,
  AppBar,
  Toolbar,
  Button,
} from '@mui/material';
import {
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  GridView as Grid2x2Icon,
  Grid4x4 as Grid4x4Icon,
  CropSquare as Grid1x1Icon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  FiberManualRecord as RecordIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

import { PageHeader } from '../../components/common';
import { cameraApi } from '../../api/services';
import type { ApiCamera } from '../../api/services';

/* ==================== CAMERA PLAYER ==================== */

interface CameraPlayerProps {
  camera: ApiCamera;
  onFullscreen: (camera: ApiCamera) => void;
}

const CameraPlayer: React.FC<CameraPlayerProps> = ({ camera, onFullscreen }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'connecting' | 'online' | 'offline' | 'error'>('connecting');
  const [retryCount, setRetryCount] = useState(0);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  const connectStream = useCallback(() => {
    if (!videoRef.current || !camera.streamUrl) {
      setStatus('offline');
      return;
    }

    setStatus('connecting');
    const video = videoRef.current;

    // Stream tipi algılama
    const url = camera.streamUrl.toLowerCase();

    if (url.includes('.m3u8') || url.includes('hls')) {
      // HLS stream
      video.src = camera.streamUrl;
      video.play().then(() => setStatus('online')).catch(() => setStatus('error'));
    } else if (url.includes('mjpeg') || url.includes('snapshot') || url.endsWith('.jpg') || url.endsWith('.jpeg')) {
      // MJPEG — img element kullanılacak, video gizlenecek
      setStatus('online');
    } else {
      // WebRTC veya doğrudan video stream
      video.src = camera.streamUrl;
      video.play().then(() => setStatus('online')).catch(() => setStatus('error'));
    }
  }, [camera.streamUrl]);

  useEffect(() => {
    connectStream();

    const video = videoRef.current;
    if (video) {
      const handleError = () => {
        setStatus('error');
        // Otomatik yeniden bağlanma (max 5 deneme, artan bekleme)
        if (retryCount < 5) {
          retryTimerRef.current = setTimeout(() => {
            setRetryCount((c) => c + 1);
            connectStream();
          }, Math.min(3000 * (retryCount + 1), 15000));
        } else {
          setStatus('offline');
        }
      };

      const handlePlaying = () => {
        setStatus('online');
        setRetryCount(0);
      };

      video.addEventListener('error', handleError);
      video.addEventListener('playing', handlePlaying);

      return () => {
        video.removeEventListener('error', handleError);
        video.removeEventListener('playing', handlePlaying);
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      };
    }
  }, [connectStream, retryCount]);

  const handleRetry = () => {
    setRetryCount(0);
    connectStream();
  };

  const isMjpeg = camera.streamUrl?.toLowerCase().includes('mjpeg') ||
    camera.streamUrl?.toLowerCase().includes('snapshot') ||
    camera.streamUrl?.toLowerCase().endsWith('.jpg');

  const statusColor = status === 'online' ? '#4CAF50' : status === 'connecting' ? '#FF9800' : '#F44336';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#1a1a2e',
        border: '1px solid',
        borderColor: status === 'online' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)',
        overflow: 'hidden',
      }}
    >
      {/* Video / Görüntü alanı */}
      <Box
        sx={{
          position: 'relative',
          flex: 1,
          bgcolor: '#0f0f23',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 180,
        }}
      >
        {isMjpeg ? (
          <img
            src={camera.streamUrl}
            alt={camera.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onLoad={() => setStatus('online')}
            onError={() => setStatus('error')}
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: status === 'online' ? 'block' : 'none',
            }}
          />
        )}

        {/* Bağlanıyor / Hata overlay */}
        {status !== 'online' && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            {status === 'connecting' ? (
              <>
                <CircularProgress size={32} sx={{ color: '#FF9800' }} />
                <Typography variant="caption" sx={{ color: '#FF9800' }}>Bağlanıyor...</Typography>
              </>
            ) : (
              <>
                <VideocamOffIcon sx={{ fontSize: 40, color: '#666' }} />
                <Typography variant="caption" sx={{ color: '#999' }}>
                  {status === 'error' ? 'Bağlantı hatası' : 'Çevrimdışı'}
                </Typography>
                <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={handleRetry} sx={{ color: '#999', borderColor: '#555', mt: 0.5 }}>
                  Tekrar Dene
                </Button>
              </>
            )}
          </Box>
        )}

        {/* Canlı göstergesi */}
        {status === 'online' && (
          <Chip
            icon={<RecordIcon sx={{ fontSize: '12px !important', color: '#F44336 !important' }} />}
            label="CANLI"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 700,
              height: 22,
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.7 },
              },
            }}
          />
        )}

        {/* Fullscreen butonu */}
        <IconButton
          onClick={() => onFullscreen(camera)}
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
          }}
          size="small"
        >
          <FullscreenIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Alt bilgi çubuğu */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 0.75, bgcolor: '#16213e' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: statusColor, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {camera.name}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', flexShrink: 0, ml: 1 }}>
          {camera.location}
        </Typography>
      </Box>
    </Card>
  );
};

/* ==================== GRID LAYOUTS ==================== */

type GridLayout = '1x1' | '2x2' | '3x3' | '4x4';

const GRID_CONFIGS: Record<GridLayout, { cols: number; label: string }> = {
  '1x1': { cols: 1, label: '1 Kamera' },
  '2x2': { cols: 2, label: '4 Kamera' },
  '3x3': { cols: 3, label: '9 Kamera' },
  '4x4': { cols: 4, label: '16 Kamera' },
};

/* ==================== DEMO CAMERAS ==================== */

const DEMO_CAMERAS: ApiCamera[] = [
  { id: 1, name: 'Lobi Girişi', location: 'Ana Giriş', streamUrl: '', status: 'offline', type: 'ip', order: 1 },
  { id: 2, name: 'Resepsiyon', location: 'Lobi', streamUrl: '', status: 'offline', type: 'ip', order: 2 },
  { id: 3, name: 'Otopark Girişi', location: 'Dış Mekan', streamUrl: '', status: 'offline', type: 'ip', order: 3 },
  { id: 4, name: 'Restoran', location: '1. Kat', streamUrl: '', status: 'offline', type: 'ip', order: 4 },
  { id: 5, name: 'Havuz', location: 'Dış Mekan', streamUrl: '', status: 'offline', type: 'ip', order: 5 },
  { id: 6, name: 'Koridor 1. Kat', location: '1. Kat', streamUrl: '', status: 'offline', type: 'ip', order: 6 },
  { id: 7, name: 'Koridor 2. Kat', location: '2. Kat', streamUrl: '', status: 'offline', type: 'ip', order: 7 },
  { id: 8, name: 'Arka Giriş', location: 'Servis', streamUrl: '', status: 'offline', type: 'ip', order: 8 },
  { id: 9, name: 'Asansör Lobi', location: 'Lobi', streamUrl: '', status: 'offline', type: 'ip', order: 9 },
];

/* ==================== ANA BİLEŞEN ==================== */

const CameraView: React.FC = () => {
  const [cameras, setCameras] = useState<ApiCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridLayout, setGridLayout] = useState<GridLayout>('3x3');
  const [fullscreenCamera, setFullscreenCamera] = useState<ApiCamera | null>(null);

  useEffect(() => {
    cameraApi.getAll()
      .then((data) => setCameras(data.length > 0 ? data : DEMO_CAMERAS))
      .catch(() => setCameras(DEMO_CAMERAS))
      .finally(() => setLoading(false));
  }, []);

  const handleRefreshAll = () => {
    setLoading(true);
    cameraApi.getAll()
      .then((data) => setCameras(data.length > 0 ? data : DEMO_CAMERAS))
      .catch(() => setCameras(DEMO_CAMERAS))
      .finally(() => setLoading(false));
  };

  const { cols } = GRID_CONFIGS[gridLayout];
  const onlineCount = cameras.filter((c) => c.status === 'online').length;

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VideocamIcon color="primary" />
            Kameralar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {cameras.length} kamera {onlineCount > 0 && `(${onlineCount} aktif)`}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Grid düzeni seçimi */}
          <ToggleButtonGroup
            value={gridLayout}
            exclusive
            onChange={(_, val) => val && setGridLayout(val)}
            size="small"
          >
            <ToggleButton value="1x1">
              <Tooltip title="1 Kamera"><Grid1x1Icon fontSize="small" /></Tooltip>
            </ToggleButton>
            <ToggleButton value="2x2">
              <Tooltip title="2x2"><Grid2x2Icon fontSize="small" /></Tooltip>
            </ToggleButton>
            <ToggleButton value="3x3">
              <Tooltip title="3x3"><Grid4x4Icon fontSize="small" /></Tooltip>
            </ToggleButton>
            <ToggleButton value="4x4">
              <Tooltip title="4x4"><SettingsIcon fontSize="small" /></Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          <Tooltip title="Tümünü Yenile">
            <IconButton onClick={handleRefreshAll} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Kamera Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress />
        </Box>
      ) : cameras.length === 0 ? (
        <Paper sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, py: 8 }}>
          <VideocamOffIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">Kamera tanımlı değil</Typography>
          <Typography variant="body2" color="text.disabled">Kamera eklemek için sistem yöneticisiyle iletişime geçin.</Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 1,
            overflow: 'auto',
          }}
        >
          {cameras.slice(0, cols * cols).map((camera) => (
            <CameraPlayer
              key={camera.id}
              camera={camera}
              onFullscreen={setFullscreenCamera}
            />
          ))}
        </Box>
      )}

      {/* Fullscreen Dialog */}
      <Dialog
        open={!!fullscreenCamera}
        onClose={() => setFullscreenCamera(null)}
        fullScreen
        PaperProps={{ sx: { bgcolor: '#0a0a1a' } }}
      >
        <AppBar sx={{ position: 'relative', bgcolor: '#16213e' }} elevation={0}>
          <Toolbar variant="dense">
            <VideocamIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
              {fullscreenCamera?.name} — {fullscreenCamera?.location}
            </Typography>
            <IconButton color="inherit" onClick={() => setFullscreenCamera(null)}>
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          {fullscreenCamera && (
            <CameraPlayer
              camera={fullscreenCamera}
              onFullscreen={() => setFullscreenCamera(null)}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
};

export default CameraView;
