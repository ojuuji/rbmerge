import { useEffect, useState } from 'react';
import debugLog from '../utils/debugLog';
import fetchCsv from '../utils/fetchCsv';
import { Rel } from '../utils/rels';
import csvPath from '../data/part_relationships_ex.csv'

function parseTable(data = null) {
  const specs = data.split('\n');
  const blanksRegex = /^(?:#.*|\s*)$/;
  const specRegex = new RegExp(`^${Rel.RE},[^,]+,[^,]+$`);
  const relsEx = new Map([
    [Rel.Alt, []], [Rel.Mold, []], [Rel.Print, []], [Rel.Pattern, []]
  ]);

  for (const spec of specs) {
    if (!blanksRegex.test(spec)) {
      if (specRegex.test(spec)) {
        let [type, child, parent] = spec.split(',')
        relsEx.get(type).push({regex: new RegExp(`^${child}$`), partNum: parent});
      }
      else {
        console.log(`unexpected spec in relsEx: ${spec}`);
      }
    }
  }

  return relsEx;
}

const annotate = r => `A=${r?.get(Rel.Alt).length}, M=${r?.get(Rel.Mold).length}, T=${r?.get(Rel.Pattern).length}, P=${r?.get(Rel.Print).length}`;

export default function useRelsEx() {
  const [relsEx, setRelsEx] = useState(null);
  debugLog(`useRelsEx : ${annotate(relsEx)}`, 2);

  useEffect(() => {
    (async () => {
      const csv = await fetchCsv(csvPath);
      if (null !== csv) {
        const newRelsEx = parseTable(csv);
        setRelsEx(newRelsEx);
        debugLog(`useRelsEx > setRelsEx : ${annotate(newRelsEx)}`);
      }
    })();
  }, [])

  return relsEx;
}
