/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { Table, TableStatus } from '../types';
import { tableService } from '../services/tableService';
import { useAuth } from './AuthContext';

interface TableContextType {
  tables: Table[];
  loading: boolean;
  error: string | null;
  refreshTables: () => Promise<void>;
  updateTableStatus: (tableId: string, status: TableStatus) => Promise<void>;
  getTableById: (tableId: string) => Table | undefined;
  getAvailableTables: () => Table[];
  occupyTable: (tableId: string, orderId: string) => Promise<void>;
  releaseTable: (tableId: string) => Promise<void>;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const TableProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getJwtToken } = useAuth();

  const refreshTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const jwt = getJwtToken() || undefined;
      const data = await tableService.getAllTables(jwt);
      setTables(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  }, [getJwtToken]);

  useEffect(() => {
    refreshTables();
  }, [refreshTables]);

  const updateTableStatus = useCallback(async (tableId: string, status: TableStatus) => {
    try {
      const jwt = getJwtToken() || undefined;
      const updatedTable = await tableService.updateTableStatus(tableId, status, jwt);
      setTables((prev) =>
        prev.map((table) => (table.id === tableId ? updatedTable : table))
      );
    } catch (err) {
      console.error('Failed to update table status:', err);
      throw err;
    }
  }, [getJwtToken]);

  const getTableById = useCallback(
    (tableId: string) => {
      return tables.find((table) => table.id === tableId);
    },
    [tables]
  );

  const getAvailableTables = useCallback(() => {
    return tables.filter((table) => table.status === TableStatus.AVAILABLE);
  }, [tables]);

  const occupyTable = useCallback(async (tableId: string, orderId: string) => {
    // Note: This logic might need a more specific API endpoint depending on backend
    await updateTableStatus(tableId, TableStatus.OCCUPIED);
    setTables((prev) =>
      prev.map((table) =>
        table.id === tableId
          ? { ...table, currentOrderId: orderId, occupiedAt: new Date().toISOString() }
          : table
      )
    );
  }, [updateTableStatus]);

  const releaseTable = useCallback(async (tableId: string) => {
    await updateTableStatus(tableId, TableStatus.CLEANING);
    setTables((prev) =>
      prev.map((table) =>
        table.id === tableId
          ? { ...table, currentOrderId: undefined, occupiedAt: undefined }
          : table
      )
    );
  }, [updateTableStatus]);

  const value = useMemo(
    () => ({
      tables,
      loading,
      error,
      refreshTables,
      updateTableStatus,
      getTableById,
      getAvailableTables,
      occupyTable,
      releaseTable,
    }),
    [tables, loading, error, refreshTables, updateTableStatus, getTableById, getAvailableTables, occupyTable, releaseTable]
  );

  return (
    <TableContext.Provider value={value}>
      {children}
    </TableContext.Provider>
  );
};

export const useTables = () => {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTables must be used within TableProvider');
  }
  return context;
};
