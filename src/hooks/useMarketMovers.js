import { useEffect, useState } from 'react';
import { apiUrl } from '../utils/apiUrl';

// Simple in-memory cache to prevent excessive API calls
const cache = {
  data: null,
  timestamp: 0,
};

const CACHE_DURATION = 60 * 1000; // 1 minute

export function useMarketMovers() {
  const [data, setData] = useState(cache.data);
  const [loading, setLoading] = useState(!cache.data);
  const [error, setError] = useState(null);

  const fetchData = async (force = false) => {
    // Use cache if valid
    if (!force && cache.data && Date.now() - cache.timestamp < CACHE_DURATION) {
      setData(cache.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(`${apiUrl}/api/movers?limit=5`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Error fetching movers: ${response.statusText}`);
      }

      const result = await response.json();

      // Update cache
      cache.data = result;
      cache.timestamp = Date.now();

      setData(result);
    } catch (err) {
      setError(err.message || 'Unknown error');
      console.error('Failed to fetch market movers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = () => fetchData(true);

  return { data, loading, error, refetch };
}
