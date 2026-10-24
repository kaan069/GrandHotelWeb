/**
 * RoomDetailById — oda numarasından (id) oda detayını yükleyip RoomDetailContent'i gösterir.
 * Oda listesi elinde olmayan sayfalar için (ör. Borçlular → Konaklayan sekmesi).
 * Detayda bir değişiklik olunca (folio, ödeme…) oda yeniden yüklenir.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

import RoomDetailContent from './RoomDetailContent';
import { roomsApi } from '../../api/services';
import type { ApiRoom } from '../../api/services';
import { mapApiRoomToDetail } from '../../utils/roomDetail';

interface Props {
  roomId: number;
  onClose?: () => void;
  /** Detayda değişiklik olunca (liste tazelensin) */
  onChanged?: () => void;
}

const RoomDetailById: React.FC<Props> = ({ roomId, onClose, onChanged }) => {
  const [room, setRoom] = useState<ApiRoom | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    roomsApi.getById(roomId)
      .then((data) => { setRoom(data); setError(false); })
      .catch(() => setError(true));
  }, [roomId]);

  useEffect(() => { load(); }, [load]);

  if (error && !room) {
    return <Typography color="error" sx={{ py: 4, textAlign: 'center' }}>Oda bilgisi yüklenemedi.</Typography>;
  }
  if (!room) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  }
  return (
    <RoomDetailContent
      key={room.id}
      room={mapApiRoomToDetail(room)}
      onRoomUpdate={() => { load(); onChanged?.(); }}
      onClose={onClose}
    />
  );
};

export default RoomDetailById;
