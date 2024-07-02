import { useEffect, useState } from 'react';
import useRels from './useRels';
import useRelsEx from './useRelsEx';
import { useInventory } from '../contexts/InventoryProvider';
import { useMergeOptions } from '../contexts/MergeOptionsProvider';
import { Rel, key } from '../utils/rels';

function resolve(part, [mergePrints, mergePatterns, mergeMolds, mergeAlternates, mergeExtra, rels, relsEx]) {
  part['refPartNum'] = part.partNum;
  part['sortFactor'] = 0;
  part.color['nameLowerCase'] = part.color.name.toLowerCase();
  part['nameLowerCase'] = part.name.toLowerCase();

  let found = new Set();
  const links = [
    [Rel.Print, 1000, mergePrints],
    [Rel.Pattern, 100, mergePatterns],
    [Rel.Mold, 1, mergeMolds],
    [Rel.Alt, 10, mergeAlternates],
  ];
  while (true) {
    let resolved, resolvedSortFactor;
    for (const [rel, sortFactor, shouldResolve] of links) {
      if (shouldResolve) {
        const partKey = key(part.refPartNum, rel);
        resolved = null !== rels ? rels.get(partKey) : undefined;
        if (resolved === undefined && mergeExtra && null !== relsEx) {
          resolved = relsEx.get(partKey);
        }
        if (resolved !== undefined) {
          resolvedSortFactor = sortFactor;
          break;
        }
      }
    }

    if (resolved === undefined) {
      return part;
    }
    if (found.has(resolved)) {
      console.warn(`avoided circular reference involving parts ${part.refPartNum} and ${resolved}`);
      return part;
    }
    found.add(resolved);
    part.refPartNum = resolved;
    part.sortFactor += resolvedSortFactor;
  }
}

function merge(inventory, options) {
  let map = new Map();

  for (const part of inventory) {
    let resolved = resolve(structuredClone(part), options);

    let list = map.get(resolved.refPartNum);
    if (list === undefined) {
      map.set(resolved.refPartNum, [resolved]);
    }
    else {
      list.push(resolved);
    }
  }

  let merged = [...map.values()];
  let mergedCount = 0;

  for (const group of merged) {
    group.sort((l, r) => l.sortFactor - r.sortFactor
      || l.partNum.localeCompare(r.partNum)
      || l.color.sortPos - r.color.sortPos);
    for (const part of group) {
      mergedCount += part.count;
    }
  }

  merged.sort((l, r) => {
    // Make it smarter a bit so that for example "Brick 1 x 2" comes _before_
    // "Brick 1 x 16"
    const lw = l[0].nameLowerCase.split(' ').reverse();
    const rw = r[0].nameLowerCase.split(' ').reverse();
    while (lw.length > 0 && rw.length > 0 && lw[lw.length - 1] === rw[rw.length - 1]) {
      lw.pop();
      rw.pop();
    }
    if (lw.length === 0 || rw.length === 0) {
      return lw.length !== 0 ? 1 : rw.length !== 0 ? -1 : 0;
    }
    const ln = parseInt(lw[lw.length - 1]);
    const rn = parseInt(rw[rw.length - 1]);
    if (!isNaN(ln) && !isNaN(rn)) {
      return ln - rn;
    }
    return lw[lw.length - 1].localeCompare(rw[rw.length - 1]);
  });

  return {merged: merged, mergedCount: mergedCount};
}

export default function useMergedInventory() {
  const {inventory} = useInventory();
  const {mergePrints, mergePatterns, mergeMolds, mergeAlternates, mergeExtra} = useMergeOptions();
  const rels = useRels();
  const relsEx = useRelsEx();
  const [merged, setMerged] = useState({merged: [], mergedCount: 0});

  console.debug(`useMergedInventory : mergedCount=${merged.mergedCount}, mergePrints=${mergePrints}, mergePatterns=${mergePatterns}, mergeMolds=${mergeMolds}, mergeAlternates=${mergeAlternates}, mergeExtra=${mergeExtra}`);

  useEffect(() => {
    const newMerged = merge(inventory, [mergePrints, mergePatterns, mergeMolds, mergeAlternates, mergeExtra, rels, relsEx]);
    setMerged(newMerged);
    console.log(`useMergedInventory > setMerged : mergedCount=${newMerged.mergedCount}, mergePrints=${mergePrints}, mergePatterns=${mergePatterns}, mergeMolds=${mergeMolds}, mergeAlternates=${mergeAlternates}, mergeExtra=${mergeExtra}`);
  }, [inventory, mergePrints, mergePatterns, mergeMolds, mergeAlternates, mergeExtra, rels, relsEx]);

  return merged;
}
