import { useState, useEffect } from 'react';

/**
 * Hook customizado de Debounce de alta performance para omnibox / live search
 * @param value Valor a ser observado
 * @param delay Tempo de espera em milissegundos (padrão 250ms)
 */
export function useDebounce<T>(value: T, delay: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
