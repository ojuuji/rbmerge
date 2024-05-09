export const Rel = Object.freeze({
  Alt      : 'A',
  Mold     : 'M',
  Print    : 'P',
  Pattern  : 'T',
  RE       : '[AMPT]'
});

export function key(partNum, rel) {
  return `${partNum}:${rel}`;
}
