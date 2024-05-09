import { useEffect, useState } from 'react';
import debugLog from '../utils/debugLog';
import fetchCsv from '../utils/fetchCsv';
import { key, Rel } from '../utils/rels';
import csvPath from '../data/rbm_part_relationships.csv'

function parseTable(csv) {
  const specs = csv.trim().split('\n');
  const specRegex = new RegExp(`^${Rel.RE},[^,]+,[^,]+$`);
  const rels = new Map();

  for (const spec of specs) {
    if (specRegex.test(spec)) {
      let [type, child, parent] = spec.split(',')
      rels.set(key(child, type), parent);
    }
    else {
      console.log(`unexpected spec in rels: ${spec}`);
    }
  }

  return rels;
}

export default function useRels() {
  const [rels, setRels] = useState(null);
  debugLog(`useRels: rels.size=${rels?.size}`, 2);

  useEffect(() => {
    (async () => {
      const csv = await fetchCsv(csvPath);
      if (null !== csv) {
        const newRels = parseTable(csv);
        setRels(newRels);
        debugLog(`useRels > setRels: newRels.size=${newRels.size}`);
      }
    })();
  }, [])

  return rels;
}
