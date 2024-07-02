import Dexie from 'dexie';
import { colorNameToId, makeColorMapper } from './colors';

const db = new Dexie('rbmerge');

db.version(1).stores({
  inventory: '++id'
});

export async function loadInventory() {
  const colorMapper = makeColorMapper();
  const inventory = await db.inventory.toArray()

  return inventory.map(p => {
    if (p.colorId !== undefined) {
      p.color = colorMapper(p.colorId);
      delete p.colorId; // to ensure it is unused
    }
    else if (p.color !== undefined) {
      const colorId = colorNameToId(p.color);
      p.color = colorMapper(colorId);
    }
    return p;
  });
}

export async function saveInventory(inventory) {
  await db.inventory.clear();
  await db.inventory.bulkAdd(inventory);
}
