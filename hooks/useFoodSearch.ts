import { useState, useRef, useCallback, useEffect } from 'react';
import { searchFoods, FoodItem } from '@/utils/foodSearch';

export function useFoodSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryRef = useRef('');

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const search = useCallback((text: string) => {
    setQuery(text);
    setError(null);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (text.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    latestQueryRef.current = text;

    timerRef.current = setTimeout(async () => {
      try {
        const items = await searchFoods(text);
        // Only update if this is still the latest query
        if (latestQueryRef.current === text) {
          setResults(items);
          setError(null);
        }
      } catch (e) {
        if (latestQueryRef.current === text) {
          setError(e instanceof Error ? e.message : 'Search failed');
          setResults([]);
        }
      } finally {
        if (latestQueryRef.current === text) {
          setLoading(false);
        }
      }
    }, 400);
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setLoading(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { query, results, loading, error, search, clear };
}
