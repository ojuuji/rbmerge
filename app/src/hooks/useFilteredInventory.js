import { useEffect, useState } from 'react';
import { useFilterOptions } from '../contexts/FilterOptionsProvider';
import useMergedInventory from './useMergedInventory';

function match(text, filter, filterSmart) {
  if (filterSmart) {
    const pattern = /^\d+$/.test(filter) ? new RegExp(`\\b${filter}\\b`) : filter;
    const newText = text.replace(pattern, '');
    return [newText.length !== text.length, newText];
  }
  else {
    const matched = text.includes(filter);
    return [matched, text];
  }
}

function matchPartNum(part, filter) {
  return part.partNumLowerCase.includes(filter) || part.refPartNumLowerCase.includes(filter);
}

function applyGroupsFilter(isName, source, filter, filterSmart) {
  let filtered = [];
  let filteredCount = 0;

  for (const group of source) {
    let groupFilter = [...filter];
    if (isName && groupFilter.length === 1) {
      for (const part of group) {
        if (matchPartNum(part, filter[0])) {
          groupFilter = [];
          break;
        }
      }
    }
    if (groupFilter.length !== 0) {
      let lastText;
      grouploop: for (const part of group) {
        let text = isName ? part.nameLowerCase : part.color.nameLowerCase;
        if (lastText !== text) {
          lastText = text;
          for (let i = groupFilter.length - 1; i >= 0; i --) {
            const [matched, newText] = match(text, groupFilter[i], filterSmart);
            if (matched) {
              text = newText;
              groupFilter.splice(i, 1);
              if (groupFilter.length === 0) {
                break grouploop;
              }
            }
          }
        }
      }
    }
    if (groupFilter.length === 0) {
      filtered.push(group);
      for (const part of group) {
        filteredCount += part.count;
      }
    }
  }

  return [filtered, filteredCount];
}

function applyPartsFilter(isName, source, filter, filterSmart) {
  let filtered = [];
  let filteredCount = 0;

  for (const group of source) {
    let filteredGroup = [];
    for (const part of group) {
      let matches = true;
      if (!isName || filter.length !== 1 || !matchPartNum(part, filter[0])) {
        let text = isName ? part.nameLowerCase : part.color.nameLowerCase;
        for (let i = 0; i < filter.length && matches; i++) {
          [matches, text] = match(text, filter[i], filterSmart);
        }
      }
      if (matches) {
        filteredGroup.push(part);
        filteredCount += part.count
      }
    }
    if (filteredGroup.length !== 0) {
      filtered.push(filteredGroup);
    }
  }

  return [filtered, filteredCount];
}

function applyFilter(isName, source, filter, filterSmart, filterGroups) {
  return (filterGroups ? applyGroupsFilter : applyPartsFilter)(isName, source, filter, filterSmart);
}

export default function useFilteredInventory() {
  const {filterSmart, filterGroups, colorFilter, nameFilter} = useFilterOptions();
  const merged = useMergedInventory();
  const [filtered, setFiltered] = useState(() => ({...merged, filtered: [], filteredCount: 0}));

  console.debug(`useFilteredInventory : filteredCount=${filtered.filteredCount}, filterSmart=${filterSmart} filterGroups=${filterGroups} colorFilter="${colorFilter}" nameFilter="${nameFilter}"`);

  useEffect(() => {
    const colorWords = colorFilter.toLowerCase().match(/\S+/g) || [];
    const nameWords = nameFilter.toLowerCase().match(/\S+/g) || [];
    const parts = structuredClone(merged);

    if (colorWords.length === 0 && nameWords.length === 0) {
      [parts.filtered, parts.filteredCount] = [parts.merged, parts.mergedCount]
    }
    else {
      let [filteredColor, filteredColorCount] = colorWords.length === 0
        ? [parts.merged, parts.mergedCount]
        : applyFilter(false, parts.merged, colorWords, filterSmart, filterGroups);

      [parts.filtered, parts.filteredCount] = nameWords.length === 0
        ? [filteredColor, filteredColorCount]
        : applyFilter(true, filteredColor, nameWords, filterSmart, filterGroups);
    }

    setFiltered(parts);
    console.log(`useFilteredInventory > setFiltered : filteredCount=${parts.filteredCount}, filterSmart=${filterSmart} filterGroups=${filterGroups} colorFilter="${colorFilter}" nameFilter="${nameFilter}"`);
  }, [merged, filterSmart, filterGroups, colorFilter, nameFilter])

  return filtered;
}
