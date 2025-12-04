import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '../utils/apiUrl';

export const useAllStocks = (limit = 100, sortBy = 'price_desc') => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState(null);

  const fetchStocks = useCallback(async (currentOffset) => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${apiUrl}/api/symbols?limit=${limit}&offset=${currentOffset}&sort=${sortBy}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data && Array.isArray(data.symbolsWithNames)) {
        const startIndex = currentOffset;
        const endIndex = startIndex + limit;
        const paginatedData = data.symbolsWithNames.slice(startIndex, endIndex);

        const formattedStocks = paginatedData.map((stock, index) => ({
          id: `${stock.symbol}-${currentOffset + index}`,
          symbol: stock.symbol,
          name: stock.name || stock.symbol,
          exchange: 'NSE',
        }));

        if (currentOffset === 0) {
          setStocks(formattedStocks);
        } else {
          setStocks((prev) => [...prev, ...formattedStocks]);
        }

        setHasMore(endIndex < data.symbolsWithNames.length);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setError(err.message || 'Failed to fetch stocks');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [limit, loading, sortBy]);

  useEffect(() => {
    fetchStocks(0);
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const newOffset = offset + limit;
      setOffset(newOffset);
      fetchStocks(newOffset);
    }
  }, [offset, limit, hasMore, loading, fetchStocks]);

  const refresh = useCallback(() => {
    setOffset(0);
    setHasMore(true);
    fetchStocks(0);
  }, [fetchStocks]);

  return {
    stocks,
    loading,
    hasMore,
    error,
    loadMore,
    refresh,
  };
};
