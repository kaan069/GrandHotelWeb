/**
 * useServerTable — sunucu taraflı sayfalı liste
 *
 * Backend listeleri ?page=&pageSize= ile sayfalı döner (config/pagination.py → Paginated<T>).
 * Bu hook sayfa / sayfa boyutu / arama metnini tutar, arama yazımını bekletir (debounce),
 * filtre (deps) veya arama değişince ilk sayfaya döner ve eski isteklerin geç gelen yanıtlarını yok sayar.
 *
 * Kullanım:
 *   const table = useServerTable(
 *     (p) => reservationsApi.getPage({ ...filters, ...p }),
 *     [filters.filter],
 *   );
 *   <DataTable rows={table.rows} columns={columns} server={table.server} loading={table.loading} />
 */

import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import type { GridPaginationModel } from '@mui/x-data-grid';

import type { Paginated } from '../api/services';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';

export interface ServerPageParams {
  /** 1'den başlar (backend) */
  page: number;
  pageSize: number;
  search?: string;
}

/** DataTable'ın sunucu modunda beklediği kontrol nesnesi */
export interface ServerTableControl {
  rowCount: number;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  search: string;
  onSearchChange: (text: string) => void;
}

const SEARCH_DEBOUNCE_MS = 350;

export default function useServerTable<T>(
  fetcher: (params: ServerPageParams) => Promise<Paginated<T>>,
  deps: DependencyList,
  pageSize: number = DEFAULT_PAGE_SIZE,
) {
  const [rows, setRows] = useState<T[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const requestId = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  /* Arama yazımı bitince uygula ve ilk sayfaya dön */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPaginationModel((m) => (m.page === 0 ? m : { ...m, page: 0 }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* Filtre değişince ilk sayfa */
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPaginationModel((m) => (m.page === 0 ? m : { ...m, page: 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetcherRef.current({
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        search: search || undefined,
      });
      if (id !== requestId.current) return;
      setRows(res.results);
      setRowCount(res.count);
    } catch (err) {
      if (id !== requestId.current) return;
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404 && paginationModel.page > 0) {
        // Sayfa artık yok (kayıt silindi / filtre daraldı) → ilk sayfaya dön
        setPaginationModel((m) => ({ ...m, page: 0 }));
        return;
      }
      setError(err);
      setRows([]);
      setRowCount(0);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel.page, paginationModel.pageSize, search, ...deps]);

  useEffect(() => { load(); }, [load]);

  /* Sabit kimlikli yenileme: memoize edilmiş çağıranlar da güncel sayfayı / filtreyi yükler */
  const loadRef = useRef(load);
  loadRef.current = load;
  const refresh = useCallback(() => loadRef.current(), []);

  const server: ServerTableControl = {
    rowCount,
    paginationModel,
    onPaginationModelChange: setPaginationModel,
    search: searchInput,
    onSearchChange: setSearchInput,
  };

  return { rows, rowCount, loading, error, refresh, server };
}
