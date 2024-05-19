import { createContext, useContext, useEffect, useState } from 'react';
import { loadInventory, saveInventory } from '../utils/db';

const InventoryContext = createContext();

export default function InventoryProvider({ children }) {
  const [inventoryVersion, setInventoryVersion] = useState(0);
  const [inventory, setInventoryInternal] = useState([]);

  console.debug(`InventoryProvider : inventory.length=${inventory.length}`);

  useEffect(() => {
    (async () => {
      const newInventory = await loadInventory();
      setInventoryInternal(newInventory);
      console.log(`InventoryProvider > loadInventory : inventory.length=${newInventory.length}`);
    })();
  }, [inventoryVersion]);

  const setInventory = (newInventory) => {
    (async () => {
      await saveInventory(newInventory);
      setInventoryVersion(inventoryVersion + 1);
      console.log(`InventoryProvider > saveInventory : inventory.length=${newInventory.length}`);
    })();
  };

  return (
    <InventoryContext.Provider value={{
      inventory, setInventory,
    }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  return useContext(InventoryContext);
}
