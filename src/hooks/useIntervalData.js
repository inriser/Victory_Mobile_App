import { useEffect, useState } from 'react';
import { apiUrl } from '../utils/apiUrl';

export function useIntervalData(symbol, interval) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!symbol) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${apiUrl}/api/trading/ohlc?symbol=${symbol}&interval=${interval}&limit=100`
        );

        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const result = await response.json();

        if (isMounted) {
          // StockCard expects { candles: [], ltp, ... }
          setData({
            candles: result.data || [],
            ltp: 0,
            priceChange: 0,
            percentChange: 0
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unknown error');
          console.error('Failed to fetch interval data:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [symbol, interval]);

  return { data, loading, error };
}

export function useAllIntervalsData(symbol) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!symbol) return;

      setLoading(true);

      try {
        const response = await fetch(`${apiUrl}/api/intervals/all?symbol=${symbol}`);

        if (!response.ok) {
          throw new Error(`Error fetching all intervals: ${response.statusText}`);
        }

        const result = await response.json();

        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  return { data, loading, error };
}
