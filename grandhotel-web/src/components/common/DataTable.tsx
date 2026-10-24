/**
 * DataTable Bileşeni
 *
 * Uygulama genelinde kullanılan veri tablosu.
 * MUI DataGrid üzerine kurulmuş, proje standartlarına uygun wrapper bileşen.
 *
 * Özellikler:
 *   - Sıralama, filtreleme, sayfalama
 *   - Satır seçimi (opsiyonel)
 *   - Yükleniyor durumu (skeleton)
 *   - Boş durum mesajı
 *   - Türkçe yerelleştirme (tema üzerinden)
 *   - Arama kutusu (opsiyonel)
 *
 * Örnek Kullanım:
 *   <DataTable
 *     rows={rooms}
 *     columns={columns}
 *     loading={isLoading}
 *     onRowClick={(row) => navigate(`/rooms/${row.id}`)}
 *     searchable
 *     searchPlaceholder="Oda ara..."
 *   />
 *
 * Props:
 *   - rows (array, zorunlu): Tablo verileri (her satırda id alanı olmalı)
 *   - columns (array, zorunlu): Kolon tanımları (MUI DataGrid formatında)
 *   - loading (boolean): Yükleniyor durumu
 *   - onRowClick (function): Satıra tıklama (parametre: row)
 *   - pageSize (number): Sayfa başına satır sayısı (varsayılan: 25)
 *   - checkboxSelection (boolean): Satır seçimi aktif mi
 *   - searchable (boolean): Arama kutusu göster
 *   - searchPlaceholder (string): Arama kutusu placeholder
 *   - toolbar (ReactNode): Tablo üstüne eklenecek ek bileşenler
 *   - server (ServerTableControl): Sunucu taraflı sayfalama + arama (hooks/useServerTable).
 *       Verilirse rows sadece mevcut sayfadır; arama kutusu backend'e gider (?search=)
 *   - sx (object): Ek stil
 *   - ...rest: Diğer MUI DataGrid prop'ları
 */

import React, { useState, useMemo } from 'react';
import { Box, TextField, InputAdornment, Typography, SxProps, Theme } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams, DataGridProps } from '@mui/x-data-grid';
import { Search as SearchIcon, Inbox as InboxIcon } from '@mui/icons-material';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';
import type { ServerTableControl } from '../../hooks/useServerTable';

/**
 * Boş tablo durumunda gösterilen bileşen.
 * Tablo verisi yokken kullanıcıya bilgi mesajı gösterir.
 */
const EmptyOverlay: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 1,
      py: 6,
    }}
  >
    <InboxIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
    <Typography variant="body1" color="text.secondary">
      Gösterilecek veri bulunamadı
    </Typography>
  </Box>
);

interface DataTableRow {
  id: string | number;
  [key: string]: unknown;
}

interface DataTableProps extends Omit<DataGridProps, 'rows' | 'columns' | 'onRowClick'> {
  rows?: DataTableRow[];
  columns?: GridColDef[];
  loading?: boolean;
  onRowClick?: (row: DataTableRow) => void;
  pageSize?: number;
  checkboxSelection?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  server?: ServerTableControl;
  sx?: SxProps<Theme>;
}

const DataTable: React.FC<DataTableProps> = ({
  rows = [],
  columns = [],
  loading = false,
  onRowClick,
  pageSize = DEFAULT_PAGE_SIZE,
  checkboxSelection = false,
  searchable = false,
  searchPlaceholder = 'Ara...',
  toolbar,
  server,
  sx = {},
  ...rest
}) => {
  /* Arama metni */
  const [searchText, setSearchText] = useState<string>('');

  /* Sayfalama modeli */
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: pageSize,
  });

  /**
   * Arama metni girildiğinde satırları filtreler.
   * Tüm kolon değerlerinde arama yapar (case-insensitive).
   */
  const filteredRows = useMemo(() => {
    if (server || !searchText.trim()) return rows;

    const search = searchText.toLowerCase().trim();
    return rows.filter((row) =>
      Object.values(row).some(
        (value) =>
          value !== null &&
          value !== undefined &&
          String(value).toLowerCase().includes(search)
      )
    );
  }, [rows, searchText, server]);

  /**
   * Satır tıklama olayını işler.
   * onRowClick prop'u verildiyse, tıklanan satırın verisini gönderir.
   */
  const handleRowClick = (params: GridRowParams): void => {
    if (onRowClick) {
      onRowClick(params.row as DataTableRow);
    }
  };

  return (
    <Box>
      {/* Tablo üst araç çubuğu: Arama + Ekstra toolbar */}
      {(searchable || toolbar) && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            mb: 2,
            flexWrap: 'wrap',
          }}
        >
          {/* Arama kutusu */}
          {searchable && (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={server ? server.search : searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                (server ? server.onSearchChange : setSearchText)(e.target.value)}
              sx={{ minWidth: 280, maxWidth: 400 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          )}

          {/* Ekstra toolbar bileşenleri (filtre butonları vb.) */}
          {toolbar && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {toolbar}
            </Box>
          )}
        </Box>
      )}

      {/* Veri tablosu */}
      <DataGrid
        rows={filteredRows}
        columns={columns}
        loading={loading}
        {...(server
          ? {
            paginationMode: 'server' as const,
            rowCount: server.rowCount,
            // Sıralama / kolon filtresi sadece mevcut sayfaya uygulanırdı → sunucu modunda kapalı
            disableColumnSorting: true,
            disableColumnFilter: true,
            paginationModel: server.paginationModel,
            onPaginationModelChange: server.onPaginationModelChange,
          }
          : { paginationModel, onPaginationModelChange: setPaginationModel })}
        pageSizeOptions={[10, 25, 50, 100]}
        checkboxSelection={checkboxSelection}
        disableRowSelectionOnClick
        onRowClick={handleRowClick}
        autoHeight
        slots={{
          noRowsOverlay: EmptyOverlay,
          noResultsOverlay: EmptyOverlay,
        }}
        sx={{
          cursor: onRowClick ? 'pointer' : 'default',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          /* Satır hover efekti */
          '& .MuiDataGrid-row:hover': {
            bgcolor: onRowClick ? 'action.hover' : 'inherit',
          },
          ...sx,
        }}
        {...rest}
      />
    </Box>
  );
};

export default DataTable;
