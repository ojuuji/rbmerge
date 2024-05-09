import { useState } from 'react';
 
export default function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(
    JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue))
  );
  return [value, (newValue) => {
    if (defaultValue === newValue) {
      localStorage.removeItem(key);
    }
    else {
      localStorage.setItem(key, JSON.stringify(newValue));
    }
    setValue(newValue);
  }];
}
