import { useState } from 'react';
import Table from 'react-bootstrap/Table';
import InventoryHead from '../components/InventoryHead';
import InventoryRow from '../components/InventoryRow';
import InventoryPagination from '../components/InventoryPagination';
import { useTableOptions } from '../contexts/TableOptionsProvider';
import useFilteredInventory from '../hooks/useFilteredInventory';

export default function InventoryPage() {
  const parts = useFilteredInventory();
  const {tablePartsPerPage} = useTableOptions();
  const [pageNumUnbounded, setPageNum] = useState(1);

  const totalPages = parts.filtered.length && tablePartsPerPage ? Math.floor((parts.filtered.length - 1) / tablePartsPerPage + 1) : 0;
  const pageNum = totalPages && pageNumUnbounded > totalPages ? totalPages : pageNumUnbounded;
  const partsView = totalPages > 1 ? parts.filtered.slice(tablePartsPerPage * (pageNum - 1), tablePartsPerPage * pageNum) : parts.filtered;

  return (
    <>
      <Table style={{marginBottom: totalPages ? '4rem' : 0}} striped bordered>
        <InventoryHead />
        <tbody>
          {partsView.map(group => <InventoryRow key={group[0].refPartNum} group={group} />)}
        </tbody>
      </Table>
      {totalPages > 1 ? <InventoryPagination pageNum={pageNum} setPageNum={setPageNum} totalPages={totalPages} /> : <></>}
    </>
  );
}
