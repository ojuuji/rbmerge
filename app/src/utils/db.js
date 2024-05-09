import Dexie from 'dexie';

const db = new Dexie('rbmerge');

db.version(1).stores({
  inventory: '++id, partNum, color, img, name, count'
});

export async function getInventory() {
  return db.inventory.toArray();
}

export async function setInventory(inventory) {
  await db.inventory.clear();
  await db.inventory.bulkAdd(inventory);
}
