import { Table, TableStatus } from '../types';

/**
 * Table Service - Handles table management
 * Mocked because backend has no table endpoints.
 */
export const tableService = {
    /**
     * GET /api/admin/tables
     * Mock implementation
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getAllTables: async (_accessToken?: string): Promise<Table[]> => {
        // Return static tables 1-20
        return Array.from({ length: 20 }, (_, i) => ({
            id: String(i + 1),
            tableNumber: i + 1,
            status: TableStatus.AVAILABLE,
            capacity: 4
        }));
    },

    /**
     * PATCH /api/admin/tables/:id/status
     * Mock implementation
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateTableStatus: async (tableId: string | number, status: TableStatus, _accessToken?: string): Promise<Table> => {
        const idStr = String(tableId);
        const num = Number(tableId);
        return {
            id: idStr,
            tableNumber: num,
            status: status,
            capacity: 4
        };
    },
};
