import colors from '../data/colors.json';

const UNKNOWN_ID = -1;
const IDX_NAME = 0;
const IDX_SORT_POS = 1;

export function makeColorMapper() {
  const colorMap = new Map(colors);
  return id => {
    const resolvedId = colorMap.has(id) ? id : UNKNOWN_ID;
    const spec = colorMap.get(resolvedId);
    return {
      id: resolvedId,
      name: spec[IDX_NAME],
      sortPos: spec[IDX_SORT_POS]
    };
  }
}

export function colorNameToId(name) {
  for (const [id, spec] of colors) {
    if (spec[IDX_NAME] === name) {
      return id;
    }
  }
  return UNKNOWN_ID;
}
