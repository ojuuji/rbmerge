import Table from 'react-bootstrap/Table';
import FilterTableHeader from '../components/FilterTableHeader';
import InventoryRow from '../components/InventoryRow';
import { useFilterOptions } from '../contexts/FilterOptionsProvider';
import { useTableOptions } from '../contexts/TableOptionsProvider';
import useFilteredInventory from '../hooks/useFilteredInventory';

// function formatCount(sym, filtered, merged) {
//   let header = sym;
//   if (0 !== merged) {
//     header += ':';
//     if (filtered !== merged) {
//       header += `${filtered}/`;
//     }
//     header += `${merged}`;
//   }
//   return header;
// }

function formatCount(filtered, merged) {
  return filtered !== merged ? `${filtered}/${merged}` : `${merged}`;
}

export default function InventoryPage() {
  const {colorFilter, setColorFilter, nameFilter, setNameFilter} = useFilterOptions();
  const {tableStickyHeader} = useTableOptions();
  const parts = useFilteredInventory();

  return (
    <Table striped bordered>
      <thead className={tableStickyHeader ? 'position-sticky top-0' : null}>
        <tr>
          <th className='inventory-refpartnum'>{formatCount(/*'@', */parts.filtered.length, parts.merged.length)}</th>
          <th className='inventory-numparts'>{formatCount(/*'#', */parts.filteredCount, parts.mergedCount)}</th>
          <FilterTableHeader setFilter={setColorFilter} value={colorFilter} name="Colors" className='inventory-colors py-0 ps-0' />
          <FilterTableHeader setFilter={setNameFilter} value={nameFilter} name="Description" className='inventory-desc py-0 ps-0' />
        </tr>
      </thead>
      <tbody>
        {parts.filtered.map(group => <InventoryRow key={group[0].refPartNum} group={group} />)}
      </tbody>
    </Table>
  );
}
