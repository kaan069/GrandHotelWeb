/**
 * Oda Listesi Sayfası
 *
 * Tüm odaları tablo ve filtre ile listeler.
 * Oda durumu, tipi, fiyat gibi bilgiler gösterilir.
 * Backend API'den veri çeker.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, Chip, CircularProgress, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

import { PageHeader, DataTable, StatusBadge } from '../../components/common';
import { FilterPanel } from '../../components/forms';
import usePermission from '../../hooks/usePermission';
import { formatCurrency } from '../../utils/formatters';
import {
  ROOM_STATUS_LABELS,
  BED_TYPE_LABELS,
  VIEW_TYPE_LABELS,
} from '../../utils/constants';
import { roomsApi } from '../../api/services';
import type { ApiRoom } from '../../api/services';

interface RoomData {
  [key: string]: unknown;
  id: number;
  roomNumber: string;
  typeName: string;
  floor: number;
  bedType: string;
  capacity: number;
  price: number;
  status: string;
  view: string;
}

/** Kat numarasına göre oda tipi belirle */
const getTypeName = (floor: number): string => {
  if (floor <= 2) return 'Standart';
  if (floor <= 4) return 'Deluxe';
  if (floor === 5) return 'Superior';
  return 'Suite';
};

/** ApiRoom → RoomData dönüşümü */
const mapApiRoom = (r: ApiRoom): RoomData => ({
  id: r.id,
  roomNumber: r.roomNumber,
  typeName: getTypeName(r.floor),
  floor: r.floor,
  bedType: r.bedType,
  capacity: r.capacity,
  price: parseFloat(r.price) || 0,
  status: r.status,
  view: VIEW_TYPE_LABELS[r.view] || r.view || '-',
});

/**
 * Tablo kolon tanımları.
 */
const getColumns = (canChangePrice: boolean): GridColDef[] => [
  {
    field: 'roomNumber',
    headerName: 'Oda No',
    width: 100,
    renderCell: (params: GridRenderCellParams) => (
      <Chip
        label={params.value}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 600 }}
      />
    ),
  },
  {
    field: 'typeName',
    headerName: 'Oda Tipi',
    width: 120,
  },
  {
    field: 'floor',
    headerName: 'Kat',
    width: 80,
    align: 'center' as const,
    headerAlign: 'center' as const,
  },
  {
    field: 'bedType',
    headerName: 'Yatak',
    width: 140,
    valueGetter: (value: string) => BED_TYPE_LABELS[value] || value,
  },
  {
    field: 'capacity',
    headerName: 'Kapasite',
    width: 100,
    align: 'center' as const,
    headerAlign: 'center' as const,
    renderCell: (params: GridRenderCellParams) => `${params.value} kişi`,
  },
  {
    field: 'price',
    headerName: 'Gecelik Fiyat',
    width: 140,
    renderCell: (params: GridRenderCellParams) =>
      canChangePrice ? formatCurrency(params.value) : '***',
  },
  {
    field: 'view',
    headerName: 'Manzara',
    width: 120,
  },
  {
    field: 'status',
    headerName: 'Durum',
    width: 120,
    renderCell: (params: GridRenderCellParams) => (
      <StatusBadge status={params.value} type="room" />
    ),
  },
];

interface Filters {
  status: string;
  floor: string;
}

const RoomList: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, canChangePrice } = usePermission();

  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);

  /* API'den odaları çek */
  useEffect(() => {
    roomsApi.getAll()
      .then((data) => setRooms(data.map(mapApiRoom)))
      .catch((err) => console.error('Odalar yüklenemedi:', err))
      .finally(() => setLoading(false));
  }, []);

  /* Filtre state'leri */
  const [filters, setFilters] = useState<Filters>({
    status: '',
    floor: '',
  });

  /** Filtre değişikliğini işle */
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  /** Tüm filtreleri temizle */
  const handleClearFilters = () => {
    setFilters({ status: '', floor: '' });
  };

  /** Filtrelenmiş oda listesi */
  const filteredRooms = rooms.filter((room) => {
    if (filters.status && room.status !== filters.status) return false;
    if (filters.floor && room.floor !== Number(filters.floor)) return false;
    return true;
  });

  /* Kat filtresi: backend'den gelen odalardan dinamik oluştur */
  const uniqueFloors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);

  /** Filtre tanımları */
  const filterConfig = [
    {
      id: 'status',
      label: 'Durum',
      options: Object.entries(ROOM_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      value: filters.status,
      onChange: (value: string) => handleFilterChange('status', value),
    },
    {
      id: 'floor',
      label: 'Kat',
      options: uniqueFloors.map((f) => ({ value: String(f), label: `${f}. Kat` })),
      value: filters.floor,
      onChange: (value: string) => handleFilterChange('floor', value),
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }} color="text.secondary">Odalar yükleniyor...</Typography>
      </Box>
    );
  }

  return (
    <div>
      <PageHeader
        title="Oda Yönetimi"
        subtitle={`Toplam ${rooms.length} oda`}
        actions={
          isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/rooms/settings')}
            >
              Yeni Oda
            </Button>
          )
        }
      />

      {/* Filtreler */}
      <Box sx={{ mb: 2 }}>
        <FilterPanel
          filters={filterConfig}
          onClearAll={handleClearFilters}
        />
      </Box>

      {/* Oda tablosu */}
      <DataTable
        rows={filteredRooms}
        columns={getColumns(canChangePrice)}
        onRowClick={(row) => navigate(`/rooms/${row.id}`)}
        searchable
        searchPlaceholder="Oda numarası veya tip ara..."
      />
    </div>
  );
};

export default RoomList;
