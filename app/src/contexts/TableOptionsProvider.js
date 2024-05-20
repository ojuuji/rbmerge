import { createContext, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const TableOptionsContext = createContext();

export default function TableOptionsProvider({ children }) {
  const [tableStickyHeader, setTableStickyHeader] = useLocalStorage('table-sticky-header', false);
  const [tablePartsPerPage, setTablePartsPerPage] = useLocalStorage('table-parts-per-page', 0);

  return (
    <TableOptionsContext.Provider value={{
      tableStickyHeader, setTableStickyHeader,
      tablePartsPerPage, setTablePartsPerPage,
    }}>
      {children}
    </TableOptionsContext.Provider>
  );
}

export function useTableOptions() {
  return useContext(TableOptionsContext);
}
