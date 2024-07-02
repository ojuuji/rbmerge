import { colorNameToId } from "./colors";

function htmlDecode(input) {
  const doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
}

function fromHtmlTable(data) {
  const thead = "<tr>\n<th>Image</th>\n<th>Part Num</th>\n<th>Quantity</th>\n<th>Color</th>\n<th>Description</th>\n</tr>\n";
  if (!data.includes(thead)) {
    return null;
  }

  const inventory = [];
  const re = /<td>\s*<img[^>]+data-src="(?<img>[^"]+)".*?>\s*<\/td>\s*<td>(?<partNum>[^<]+)<\/td>\s*<td>(?<count>\d+)<\/td>\s*<td>(?<color>[^<]+)<\/td>\s*<td>(?<name>[^<]+)<\/td>/g

  for (let match; (match = re.exec(data)) !== null; ) {
    const {groups: {img, partNum, count, color, name}} = match;
    const part = {
      img: img,
      partNum: partNum,
      count: Number(count),
      colorId: colorNameToId(htmlDecode(color)),
      name: htmlDecode(name),
    };
    inventory.push(part);
  }

  return inventory;
}

function fromRebrickableCsv(data) {
  const csv = data.replaceAll ('\r', '');
  const header = "Part,Color,Quantity\n";
  if (!csv.startsWith(header)) {
    return null;
  }

  const inventory = [];
  for (const line of csv.replace(header, '').split('\n').filter(Boolean)) {
    const cells = line.split(',');
    if (cells.length === 3) {
      const [partNum, colorId, count] = cells;
      const part = {
        partNum: partNum,
        colorId: Number(colorId),
        count: Number(count),
      };
      inventory.push(part);
    }
    else {
      console.warn(`unexpected number of commas (${cells.length}!=3) in the line: ${line}`);
    }
  }

  return inventory;
}

export default function importInventory(data) {
  const inventory = fromHtmlTable(data) || fromRebrickableCsv(data);
  if (inventory === null) {
    throw new Error("document does not contain table in expected format");
  }
  return inventory;
}
