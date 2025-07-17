import { useState } from 'react';

export function useStoredState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredState = (value) => {
    setState(value);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  };

  return [state, setStoredState];
} 