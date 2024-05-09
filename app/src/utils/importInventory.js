export default async function importInventory(data) {
  const thead = "<tr>\n<th>Image</th>\n<th>Part Num</th>\n<th>Quantity</th>\n<th>Color</th>\n<th>Description</th>\n</tr>\n";
  if (!data.includes(thead)) {
    throw new Error("document does not contain table in expected format");
  }

  const inventory = [];
  const re = /<td>\s*<img[^>]+data-src="(?<img>[^"]+)".*?>\s*<\/td>\s*<td>(?<partNum>[^<]+)<\/td>\s*<td>(?<count>\d+)<\/td>\s*<td>(?<color>[^<]+)<\/td>\s*<td>(?<name>[^<]+)<\/td>/g

  for (let match; (match = re.exec(data)) !== null; ) {
    const {groups: {img, partNum, count, color, name}} = match;
    const part = {
      img: img,
      partNum: partNum,
      count: Number(count),
      color: color,
      name: name,
    };
    inventory.push(part);
  }

  return inventory;
}
