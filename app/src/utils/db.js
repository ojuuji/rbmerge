import Dexie from 'dexie';
import parts from '../data/parts.json';
import images from '../data/images.json';
import { colorNameToId, makeColorMapper } from './colors';

const db = new Dexie('rbmerge');

db.version(1).stores({
  inventory: '++id'
});

export async function loadInventory() {
  const partsMap = new Map(parts);
  const colorMapper = makeColorMapper();
  const imagesMap = new Map(images);
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

    p.name = partsMap.get(p.partNum) || p.name || '[Unknown]';

    if (p.img === undefined) {
      const url = imagesMap.get(`${p.partNum}:${p.color.id}`);
      if (url !== undefined) {
        p.img = url.startsWith('/') ? `https://cdn.rebrickable.com/media/parts${url}` : url;
      }
    }

    return p;
  });
}

export async function saveInventory(inventory) {
  await db.inventory.clear();
  await db.inventory.bulkAdd(inventory);
}
