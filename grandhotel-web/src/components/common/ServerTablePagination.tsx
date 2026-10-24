/**
 * ServerTablePagination — düz MUI Table'lar için sunucu taraflı sayfa çubuğu
 *
 * DataGrid kullanmayan listelerde (adisyon, gider, mesai geçmişi) hooks/useServerTable
 * kontrolünü MUI TablePagination'a bağlar. Etiketler tema yerelleştirmesinden (trTR) gelir.
 */

import React from 'react';
import { TablePagination } from '@mui/material';

import type { ServerTableControl } from '../../hooks/useServerTable';

interface Props {
  server: ServerTableControl;
}

const ServerTablePagination: React.FC<Props> = ({ server }) => (
  <TablePagination
    component="div"
    count={server.rowCount}
    page={server.paginationModel.page}
    rowsPerPage={server.paginationModel.pageSize}
    rowsPerPageOptions={[10, 25, 50, 100]}
    onPageChange={(_e, page) => server.onPaginationModelChange({ ...server.paginationModel, page })}
    onRowsPerPageChange={(e) => server.onPaginationModelChange({ page: 0, pageSize: Number(e.target.value) })}
  />
);

export default ServerTablePagination;
