import { useEffect, useState } from 'react';
import { apiUrl } from '../utils/apiUrl';

export function useIntervalData(symbol, interval, limit = 100) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let pollInterval;

    const isMarketOpen = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const ist = new Date(utc + (3600000 * 5.5)); // IST time

      const hours = ist.getHours();
      const minutes = ist.getMinutes();
      const day = ist.getDay(); // 0 is Sunday, 6 is Saturday

      // Check weekend
      if (day === 0 || day === 6) return false;

      // Market times: 09:15 to 15:30
      const currentMinutes = hours * 60 + minutes;
      const startMinutes = 9 * 60 + 15; // 09:15
      const endMinutes = 15 * 60 + 30;  // 15:30

      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    };

    const fetchData = async () => {
      if (!symbol) return;

      // Don't set loading on subsequent polls to avoid UI flicker
      if (!data) setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${apiUrl}/api/trading/ohlc?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`
        );

        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const result = await response.json();

        if (isMounted) {
          const candles = result.data || [];
          let ltp = 0;
          let priceChange = 0;
          let percentChange = 0;

          if (candles.length > 0) {
            const lastCandle = candles[candles.length - 1];
            const firstCandle = candles[0];

            ltp = lastCandle.close;

            // Calculate change over the fetched period (e.g. last 100 mins for 1m interval)
            // Or should we use the candle's own change?
            // Usually for a sparkline card, comparing vs previous close is best, but we don't have it.
            // Let's use Open of the first candle in the series as the reference for the "graph's change".
            // Alternatively, if this is "Realtime 1m", user might expect Day Change.
            // Since we lack Day Open here, we'll try to use the provided stock data from prop in the component,
            // BUT here in the hook, let's at least provide valid candle-based data.

            priceChange = lastCandle.close - firstCandle.open;
            percentChange = ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100;
          }

          setData({
            candles,
            ltp,
            priceChange,
            percentChange
          });
        }
      } catch (err) {
        if (isMounted) {
          // Only show error if we don't have data yet
          if (!data) setError(err.message || 'Unknown error');
          console.log('Failed to fetch interval data (likely network/rate limit):', err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchData();

    // Setup polling based on market status
    // Check every minute if we should be polling
    pollInterval = setInterval(() => {
      if (isMarketOpen()) {
        fetchData();
      } else {
        // Market closed, we rely on the initial fetch (which we just did). 
        // We do NOT keep fetching.
        console.log('Market closed, skipping poll for', symbol);
      }
    }, 60000); // Check/Poll every 60s

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [symbol, interval, limit]);

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
