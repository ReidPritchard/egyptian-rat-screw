import { useDebugValue, useState } from "react";

/**
 * A hook for persisting state in localStorage with type safety and JSON serialization
 * @param key The localStorage key to store the value under
 * @param defaultValue The default value to use if no value is stored
 * @returns A tuple containing the current value and a setter function
 */
export const useLocalStorage = <T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prevValue: T) => T)) => void] => {
  useDebugValue(key, (key) => `useLocalStorage(${key})`);

  // Initialize state with stored value or default
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Update localStorage when value changes
  const updateValue = (newValue: T | ((prevValue: T) => T)) => {
    try {
      // Handle function updates
      const valueToStore =
        newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error saving to localStorage key "${key}":`, error);
    }
  };

  return [value, updateValue];
};
