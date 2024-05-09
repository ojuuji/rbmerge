import { createContext, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const TableOptionsContext = createContext();

export default function TableOptionsProvider({ children }) {
  const [tableStickyHeader, setTableStickyHeader] = useLocalStorage('table-sticky-header', false);

  return (
    <TableOptionsContext.Provider value={{
      tableStickyHeader, setTableStickyHeader,
    }}>
      {children}
    </TableOptionsContext.Provider>
  );
}

export function useTableOptions() {
  return useContext(TableOptionsContext);
}
