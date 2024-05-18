import colorsSorted from '../data/colors.json';

export function compareColors(l, r) {
  if (l !== r) {
    for (const color of colorsSorted) {
      if (color === l || color === r) {
        return color === l ? -1 : 1;
      }
    }
  }
  return 0;
}
