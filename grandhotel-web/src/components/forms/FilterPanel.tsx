/**
 * FilterPanel Bileşeni
 *
 * Liste sayfalarında kullanılan filtre paneli.
 * Filtre butonlarını gruplar ve aktif filtre sayısını gösterir.
 *
 * Örnek Kullanım:
 *   <FilterPanel
 *     filters={[
 *       {
 *         id: 'status',
 *         label: 'Durum',
 *         options: [
 *           { value: 'available', label: 'Müsait' },
 *           { value: 'occupied', label: 'Dolu' },
 *         ],
 *         value: filters.status,
 *         onChange: (value) => handleFilterChange('status', value),
 *       },
 *       {
 *         id: 'floor',
 *         label: 'Kat',
 *         options: [
 *           { value: '1', label: '1. Kat' },
 *           { value: '2', label: '2. Kat' },
 *         ],
 *         value: filters.floor,
 *         onChange: (value) => handleFilterChange('floor', value),
 *       },
 *     ]}
 *     onClearAll={handleClearFilters}
 *   />
 *
 * Props:
 *   - filters (array): Filtre tanımları dizisi
 *     - id (string): Filtre kimliği
 *     - label (string): Filtre etiketi
 *     - options (array): Seçenekler [{ value, label }]
 *     - value (string): Seçili değer
 *     - onChange (function): Değişiklik fonksiyonu
 *   - onClearAll (function): Tüm filtreleri temizleme fonksiyonu
 */

import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Badge,
  SelectChangeEvent,
} from '@mui/material';
import { FilterList as FilterIcon, Close as CloseIcon } from '@mui/icons-material';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  id: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterPanelProps {
  filters?: FilterConfig[];
  onClearAll?: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters = [], onClearAll }) => {
  /* Aktif filtre sayısını hesapla */
  const activeFilterCount = filters.filter(
    (f) => f.value !== '' && f.value !== null && f.value !== undefined
  ).length;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      {/* Filtre ikonu ve aktif sayaç */}
      <Badge badgeContent={activeFilterCount} color="primary">
        <FilterIcon color="action" />
      </Badge>

      {/* Filtre select'leri */}
      {filters.map((filter) => (
        <FormControl key={filter.id} size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{filter.label}</InputLabel>
          <Select
            value={filter.value || ''}
            onChange={(e: SelectChangeEvent) => filter.onChange(e.target.value)}
            label={filter.label}
          >
            {/* Tümü seçeneği - filtreyi temizler */}
            <MenuItem value="">
              <em>Tümü</em>
            </MenuItem>
            {filter.options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}

      {/* Filtreleri temizle butonu (aktif filtre varsa göster) */}
      {activeFilterCount > 0 && onClearAll && (
        <Button
          size="small"
          color="inherit"
          startIcon={<CloseIcon fontSize="small" />}
          onClick={onClearAll}
          sx={{ color: 'text.secondary' }}
        >
          Temizle
        </Button>
      )}
    </Box>
  );
};

export default FilterPanel;
