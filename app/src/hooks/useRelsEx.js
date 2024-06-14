import { useState } from 'react';
import relsExData from '../data/relsEx.json';

export default function useRelsEx() {
  const [relsEx, ] = useState(() => {
    const relsEx = new Map(relsExData);
    console.log(`useRelsEx : relsEx.size=${relsEx.size}`);
    return relsEx;
  });
  return relsEx;
}
