//*

import { useState } from 'react';
import { Rel } from '../utils/rels';
import relsExData from '../data/relsEx.json';

export default function useRelsEx() {
  const [relsEx, ] = useState(() => parseTable(relsExData[0]));
  return relsEx;
}

/*/

import { useEffect, useState } from 'react';
import fetchCsv from '../utils/fetchCsv';
import { Rel } from '../utils/rels';
import csvPath from '../data/part_relationships_ex.csv'

export default function useRelsEx() {
  const [relsEx, setRelsEx] = useState(null);
  console.debug(`useRelsEx : ${annotate(relsEx)}`);

  useEffect(() => {
    (async () => {
      const csv = await fetchCsv(csvPath);
      if (null !== csv) {
        const newRelsEx = parseTable(csv);
        setRelsEx(newRelsEx);
      }
    })();
  }, [])

  return relsEx;
}

//*/

const annotate = r => `A=${r?.get(Rel.Alt).length}, M=${r?.get(Rel.Mold).length}, T=${r?.get(Rel.Pattern).length}, P=${r?.get(Rel.Print).length}`;

function parseTable(data) {
  const specs = data.trim().split('\n');
  const relsRegex = new RegExp(Rel.RE);
  const relsEx = new Map([
    [Rel.Alt, []], [Rel.Mold, []], [Rel.Print, []], [Rel.Pattern, []]
  ]);

  for (const spec of specs) {
    if (spec.length > 2 && relsRegex.test(spec[0])) {
      const items = spec.split(spec[1]);
      if (items.length === 3) {
        const [type, child, parent] = items;
        relsEx.get(type).push({regex: new RegExp(`^${child}$`), partNum: parent});

        continue;
      }
    }
    console.warn(`unexpected spec in relsEx: ${spec}`);
  }

  console.log(`useRelsEx > parseTable : ${annotate(relsEx)}`);

  return relsEx;
}
