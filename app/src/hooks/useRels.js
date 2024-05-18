//*

import { useState } from 'react';
import relsData from '../data/rels.json';
import { key, Rel } from '../utils/rels';

export default function useRels() {
  const [rels, ] = useState(() => parseTable(relsData[0]));
  return rels;
}

/*/

import { useEffect, useState } from 'react';
import fetchCsv from '../utils/fetchCsv';
import { key, Rel } from '../utils/rels';
import csvPath from '../data/rbm_part_relationships.csv'

export default function useRels() {
  const [rels, setRels] = useState(null);
  console.debug(`useRels: rels.size=${rels?.size}`);

  useEffect(() => {
    (async () => {
      const csv = await fetchCsv(csvPath);
      if (null !== csv) {
        const newRels = parseTable(csv);
        setRels(newRels);
      }
    })();
  }, [])

  return rels;
}

//*/

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
      console.warn(`unexpected spec in rels: ${spec}`);
    }
  }

  console.log(`useRels > parseTable : rels.size=${rels.size}`);

  return rels;
}
