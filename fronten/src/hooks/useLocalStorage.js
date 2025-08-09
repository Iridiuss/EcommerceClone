import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  // Initialize with initialValue (safe for SSR)
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  console.log(`🔍 LOCALSTORAGE DEBUG: ${key} - Initial render:`, { 
    storedValue, 
    isInitialized, 
    hasWindow: typeof window !== 'undefined' 
  });

  // Load from localStorage only after component mounts (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') {
      console.log(`🔍 LOCALSTORAGE DEBUG: ${key} - No window, setting initialized`);
      setIsInitialized(true);
      return;
    }

    try {
      const item = window.localStorage.getItem(key);
      const value = item ? JSON.parse(item) : initialValue;
      console.log(`🔍 LOCALSTORAGE DEBUG: ${key} - Loading from localStorage:`, { item, value });
      setStoredValue(value);
    } catch (error) {
      console.error(`🔍 LOCALSTORAGE DEBUG: ${key} - Error reading localStorage:`, error);
      setStoredValue(initialValue);
    } finally {
      setIsInitialized(true);
    }
  }, [key, initialValue]);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      console.log(`🔍 LOCALSTORAGE DEBUG: ${key} - Setting value:`, { 
        value, 
        valueToStore, 
        hasWindow: typeof window !== 'undefined',
        currentStoredValue: storedValue
      });
      setStoredValue(valueToStore);
      
      // Only save to localStorage if we're in the browser
      if (typeof window !== 'undefined') {
        const stringValue = JSON.stringify(valueToStore);
        console.log(`🔍 LOCALSTORAGE DEBUG: ${key} - Saving to localStorage:`, stringValue);
        window.localStorage.setItem(key, stringValue);
        console.log(`🔍 LOCALSTORAGE DEBUG: ${key} - Saved to localStorage successfully`);
        
        // Verify it was saved
        const savedValue = window.localStorage.getItem(key);
        console.log(`🔍 LOCALSTORAGE DEBUG: ${key} - Verification - saved value:`, savedValue);
      } else {
        console.log(`🔍 LOCALSTORAGE DEBUG: ${key} - No window, skipping localStorage save`);
      }
    } catch (error) {
      console.error(`🔍 LOCALSTORAGE DEBUG: ${key} - Error setting localStorage:`, error);
    }
  };

  // Remove item from localStorage
  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      
      // Only remove from localStorage if we're in the browser
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue, removeValue, isInitialized];
} 