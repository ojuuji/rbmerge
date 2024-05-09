import { createContext, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const FilterOptionsContext = createContext();

export default function FilterOptionsProvider({ children }) {
  const [filterSmart, setFilterSmart] = useLocalStorage('filter-smart', true);
  const [filterGroups, setFilterGroups] = useLocalStorage('filter-groups', false);
  const [colorFilter, setColorFilter] = useLocalStorage('filter-color', '');
  const [nameFilter, setNameFilter] = useLocalStorage('filter-name', '');

  return (
    <FilterOptionsContext.Provider value={{
      filterSmart, setFilterSmart,
      filterGroups, setFilterGroups,
      colorFilter, setColorFilter,
      nameFilter, setNameFilter
    }}>
      {children}
    </FilterOptionsContext.Provider>
  );
}

export function useFilterOptions() {
  return useContext(FilterOptionsContext);
}
