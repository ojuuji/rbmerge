import { useState } from 'react';
import relsData from '../data/rels.json';

export default function useRels() {
  const [rels, ] = useState(() => {
    const rels = new Map(relsData);
    console.log(`useRels : rels.size=${rels.size}`);
    return rels;
  });
  return rels;
}
