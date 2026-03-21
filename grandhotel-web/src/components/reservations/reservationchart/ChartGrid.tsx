import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import dayjs from 'dayjs';

import type { ApiRoom, ApiReservation } from '../../../api/services';
import { getReservationColor, getRoomStatusColor, VISIBLE_DAYS } from './helpers';

interface ChartGridProps {
  rooms: ApiRoom[];
  days: dayjs.Dayjs[];
  startDate: dayjs.Dayjs;
  reservations: ApiReservation[];
  onCellClick: (room: ApiRoom, date: dayjs.Dayjs) => void;
}

/**
 * Bir rezervasyonun takvimde gösterilecek başlangıç ve bitiş tarihlerini hesaplar.
 * - status='reserved' → plannedCheckIn / plannedCheckOut
 * - status='checked_in' → checkIn / checkOut (checkOut null ise bugün + 1)
 */
const getBarDates = (r: ApiReservation): { start: dayjs.Dayjs; end: dayjs.Dayjs } | null => {
  if (r.status === 'reserved') {
    if (!r.plannedCheckIn) return null;
    const start = dayjs(r.plannedCheckIn).startOf('day');
    const end = r.plannedCheckOut
      ? dayjs(r.plannedCheckOut).startOf('day')
      : start.add(1, 'day');
    return { start, end };
  }
  if (r.status === 'checked_in') {
    const start = dayjs(r.checkIn).startOf('day');
    const end = r.checkOut
      ? dayjs(r.checkOut).startOf('day')
      : r.plannedCheckOut
        ? dayjs(r.plannedCheckOut).startOf('day')
        : dayjs().startOf('day').add(1, 'day');
    return { start, end };
  }
  return null;
};

const ChartGrid: React.FC<ChartGridProps> = ({ rooms, days, startDate, reservations, onCellClick }) => {
  const today = dayjs().startOf('day');

  const getReservationForCell = (roomNumber: string, date: dayjs.Dayjs): ApiReservation | null => {
    return reservations.find((r) => {
      if (r.roomNumber !== roomNumber) return false;
      const dates = getBarDates(r);
      if (!dates) return false;
      return date.isSame(dates.start, 'day') || (date.isAfter(dates.start, 'day') && date.isBefore(dates.end, 'day'));
    }) || null;
  };

  const isReservationStart = (roomNumber: string, date: dayjs.Dayjs): boolean => {
    return reservations.some((r) => {
      if (r.roomNumber !== roomNumber) return false;
      const dates = getBarDates(r);
      if (!dates) return false;
      return dates.start.isSame(date, 'day') ||
             (dates.start.isBefore(startDate, 'day') && date.isSame(startDate, 'day'));
    });
  };

  const getBlockSpan = (reservation: ApiReservation, date: dayjs.Dayjs): number => {
    const dates = getBarDates(reservation);
    if (!dates) return 1;
    const endOfView = startDate.add(VISIBLE_DAYS, 'day');
    const effectiveStart = dates.start.isBefore(startDate, 'day') ? startDate : date;
    const effectiveEnd = dates.end.isBefore(endOfView) ? dates.end : endOfView;
    return Math.max(1, effectiveEnd.diff(effectiveStart, 'day'));
  };

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: `120px repeat(${VISIBLE_DAYS}, minmax(80px, 1fr))`, minWidth: 120 + VISIBLE_DAYS * 80 }}>

        {/* Başlık satırı */}
        <Box sx={{ bgcolor: '#F1F5F9', borderBottom: '2px solid #CBD5E1', borderRight: '1px solid #E2E8F0', p: 1, position: 'sticky', left: 0, zIndex: 3 }}>
          <Typography variant="caption" fontWeight={600} color="text.secondary">ODA</Typography>
        </Box>
        {days.map((day) => {
          const isToday = day.isSame(today, 'day');
          const isWeekend = day.day() === 0 || day.day() === 6;
          return (
            <Box
              key={day.format('YYYY-MM-DD')}
              sx={{
                bgcolor: isToday ? '#E3F2FD' : isWeekend ? '#FFF8E1' : '#F1F5F9',
                borderBottom: '2px solid #CBD5E1',
                borderRight: '1px solid #E2E8F0',
                p: 0.5,
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" fontWeight={600} color={isToday ? 'primary' : 'text.secondary'} sx={{ display: 'block', fontSize: '0.65rem', textTransform: 'capitalize' }}>
                {day.format('ddd')}
              </Typography>
              <Typography variant="body2" fontWeight={isToday ? 700 : 500} color={isToday ? 'primary' : 'text.primary'}>
                {day.format('DD')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem', textTransform: 'capitalize' }}>
                {day.format('MMM')}
              </Typography>
            </Box>
          );
        })}

        {/* Oda satırları */}
        {rooms.map((room) => (
          <React.Fragment key={room.id}>
            {/* Oda etiketi */}
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderBottom: '1px solid #E2E8F0',
                borderRight: '1px solid #E2E8F0',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                position: 'sticky',
                left: 0,
                zIndex: 2,
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getRoomStatusColor(room.status), flexShrink: 0 }} />
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                  {room.roomNumber}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                  Kat {room.floor}
                </Typography>
              </Box>
            </Box>

            {/* Gün hücreleri */}
            {days.map((day) => {
              const reservation = getReservationForCell(room.roomNumber, day);
              const isStart = reservation && isReservationStart(room.roomNumber, day);
              const isToday = day.isSame(today, 'day');
              const isWeekend = day.day() === 0 || day.day() === 6;

              if (reservation && !isStart) return null;

              if (reservation && isStart) {
                const span = getBlockSpan(reservation, day);
                const color = getReservationColor(reservation.status);
                const dates = getBarDates(reservation);
                const nights = dates ? dates.end.diff(dates.start, 'day') : 0;
                const guestLabel = reservation.guestNames || 'Misafir';

                return (
                  <Tooltip
                    key={day.format('YYYY-MM-DD')}
                    title={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{guestLabel}</Typography>
                        <Typography variant="caption">
                          {reservation.status === 'reserved' ? 'Rezervasyon' : 'Konaklama'}
                        </Typography>
                        {dates && (
                          <>
                            <br />
                            <Typography variant="caption">
                              {dates.start.format('DD.MM')} - {dates.end.format('DD.MM.YYYY')} ({nights} gece)
                            </Typography>
                          </>
                        )}
                      </Box>
                    }
                    arrow
                  >
                    <Box
                      onClick={() => onCellClick(room, day)}
                      sx={{
                        gridColumn: `span ${span}`,
                        bgcolor: color.bg,
                        borderLeft: `3px solid ${color.border}`,
                        borderBottom: '1px solid #E2E8F0',
                        borderRight: '1px solid #E2E8F0',
                        p: 0.5,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        overflow: 'hidden',
                        transition: 'filter 0.15s',
                        '&:hover': { filter: 'brightness(0.93)' },
                      }}
                    >
                      <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        <Typography variant="caption" fontWeight={600} color={color.text} sx={{ display: 'block', lineHeight: 1.3, textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {guestLabel}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: color.text, opacity: 0.8 }}>
                          {reservation.status === 'reserved' ? 'Rez' : 'Konaklama'}
                        </Typography>
                      </Box>
                    </Box>
                  </Tooltip>
                );
              }

              return (
                <Box
                  key={day.format('YYYY-MM-DD')}
                  onClick={() => onCellClick(room, day)}
                  sx={{
                    bgcolor: isToday ? 'rgba(21, 101, 192, 0.04)' : isWeekend ? 'rgba(255, 193, 7, 0.04)' : 'background.paper',
                    borderBottom: '1px solid #E2E8F0',
                    borderRight: '1px solid #E2E8F0',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                    '&:hover': { bgcolor: '#E3F2FD' },
                  }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};

export default ChartGrid;
