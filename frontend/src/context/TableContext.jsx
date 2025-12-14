import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const TableContext = createContext();

export function TableProvider({ children }) {
  const [tableId, setTableId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tableFromUrl = params.get("tableId");
    if (tableFromUrl) setTableId(tableFromUrl);
  }, [location]);

  return (
    <TableContext.Provider value={{ tableId, setTableId }}>
      {children}
    </TableContext.Provider>
  );
}

export const useTable = () => useContext(TableContext);
