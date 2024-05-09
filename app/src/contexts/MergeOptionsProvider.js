import { createContext, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const MergeOptionsContext = createContext();

export default function MergeOptionsProvider({ children }) {
  const [mergePrints, setMergePrints] = useLocalStorage('merge-prints', true);
  const [mergePatterns, setMergePatterns] = useLocalStorage('merge-patterns', true);
  const [mergeMolds, setMergeMolds] = useLocalStorage('merge-molds', true);
  const [mergeAlternates, setMergeAlternates] = useLocalStorage('merge-alternates', true);
  const [mergeExtra, setMergeExtra] = useLocalStorage('merge-extra', true);

  return (
    <MergeOptionsContext.Provider value={{
      mergePrints, setMergePrints,
      mergePatterns, setMergePatterns,
      mergeMolds, setMergeMolds,
      mergeAlternates, setMergeAlternates,
      mergeExtra, setMergeExtra,
    }}>
      {children}
    </MergeOptionsContext.Provider>
  );
}

export function useMergeOptions() {
  return useContext(MergeOptionsContext);
}
