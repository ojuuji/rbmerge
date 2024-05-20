import { useMediaQuery } from 'react-responsive';
import FilterTableHeader from '../components/FilterTableHeader';
import { useFilterOptions } from '../contexts/FilterOptionsProvider';
import { useTableOptions } from '../contexts/TableOptionsProvider';

function formatCount(filtered, merged) {
  return filtered !== merged ? `${filtered}/\u200B${merged}` : `${merged}`;
}

export default function InventoryHead({parts}) {
  const isNotXS = useMediaQuery({ query: '(min-width: 576px)' });  // bootstrap 'sm' breakpoint
  const {colorFilter, setColorFilter, nameFilter, setNameFilter} = useFilterOptions();
  const {tableStickyHeader} = useTableOptions();

  return (
    <thead className={tableStickyHeader ? 'position-sticky top-0' : null}>
      <tr>
        {isNotXS ?
          <>
            <th className='inventory-refpartnum'>{formatCount(parts.filtered.length, parts.merged.length)}</th>
            <th className='inventory-numparts'>{formatCount(parts.filteredCount, parts.mergedCount)}</th>
          </>
        :
          <th className='inventory-refandnum'>
            {formatCount(parts.filtered.length, parts.merged.length)}
            <br/>
            {formatCount(parts.filteredCount, parts.mergedCount)}
          </th>
        }
        <FilterTableHeader setFilter={setColorFilter} value={colorFilter} name="Colors" className='inventory-colors py-0 ps-0' />
        <FilterTableHeader setFilter={setNameFilter} value={nameFilter} name="Description" className='inventory-desc py-0 ps-0' />
      </tr>
    </thead>
  );
}
