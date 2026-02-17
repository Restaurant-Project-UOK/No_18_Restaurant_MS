/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { Table, TableStatus } from '../types';
import { MOCK_TABLES } from '../data/mockData';

interface TableContextType {
  tables: Table[];
  updateTableStatus: (tableId: string, status: TableStatus) => void;
  getTableById: (tableId: string) => Table | undefined;
  getAvailableTables: () => Table[];
  occupyTable: (tableId: string, orderId: string) => void;
  releaseTable: (tableId: string) => void;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const TableProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tables, setTables] = useState<Table[]>(MOCK_TABLES);

  const updateTableStatus = useCallback((tableId: string, status: TableStatus) => {
    setTables((prev) =>
      prev.map((table) =>
        table.id === tableId ? { ...table, status } : table
      )
    );
  }, []);

  const getTableById = useCallback(
    (tableId: string) => {
      return tables.find((table) => table.id === tableId);
    },
    [tables]
  );

  const getAvailableTables = useCallback(() => {
    return tables.filter((table) => table.status === TableStatus.AVAILABLE);
  }, [tables]);

  const occupyTable = useCallback((tableId: string, orderId: string) => {
    setTables((prev) =>
      prev.map((table) =>
        table.id === tableId
          ? { ...table, status: TableStatus.OCCUPIED, currentOrderId: orderId, occupiedAt: new Date().toISOString() }
          : table
      )
    );
  }, []);

  const releaseTable = useCallback((tableId: string) => {
    setTables((prev) =>
      prev.map((table) =>
        table.id === tableId
          ? { ...table, status: TableStatus.CLEANING, currentOrderId: undefined, occupiedAt: undefined }
          : table
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      tables,
      updateTableStatus,
      getTableById,
      getAvailableTables,
      occupyTable,
      releaseTable,
    }),
    [tables, updateTableStatus, getTableById, getAvailableTables, occupyTable, releaseTable]
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

