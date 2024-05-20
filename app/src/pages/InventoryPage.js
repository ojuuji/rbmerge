import Table from 'react-bootstrap/Table';
import InventoryRow from '../components/InventoryRow';
import useFilteredInventory from '../hooks/useFilteredInventory';
import InventoryHead from '../components/InventoryHead';

export default function InventoryPage() {
  const parts = useFilteredInventory();

  return (
    <Table striped bordered>
      <InventoryHead parts={parts} />
      <tbody>
        {parts.filtered.map(group => <InventoryRow key={group[0].refPartNum} group={group} />)}
      </tbody>
    </Table>
  );
}
