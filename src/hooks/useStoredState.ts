import { useState, useEffect } from 'react';

export function useStoredState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item && item !== '"undefined"' ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setState(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  return [state, setValue];
}