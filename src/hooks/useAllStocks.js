import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '../utils/apiUrl';

export const useAllStocks = (limit = 100, sortBy = 'price_desc') => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState(null);

  const [allData, setAllData] = useState([]);
  const [dataFetched, setDataFetched] = useState(false);

  const fetchStocks = useCallback(async (currentOffset) => {
    // If loading, skip. Exception: if it's a fresh load (offset 0) we might want to proceed if not already loading specific task
    // But for simplicity, we just check generic loading state
    if (loading && currentOffset !== 0) return;

    try {
      setLoading(true);
      setError(null);

      let fullList = allData;

      // If we are at offset 0, we want to refresh data from server OR if we haven't fetched yet
      if (currentOffset === 0 || !dataFetched) {
        const response = await fetch(`${apiUrl}/api/trading/watchlist`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          fullList = result.data;
          setAllData(fullList);
          setDataFetched(true);
        } else {
          fullList = [];
          setAllData([]);
        }
      }

      // Client-side pagination logic
      const startIndex = currentOffset;
      const endIndex = startIndex + limit;
      const paginatedData = fullList.slice(startIndex, endIndex);

      const formattedStocks = paginatedData.map((stock, index) => ({
        id: `${stock.symbol}-${startIndex + index}`, // Ensure ID is unique and stable
        symbol: stock.symbol,
        name: stock.name || stock.symbol,
        exchange: 'NSE',
        ...stock
      }));

      // If offset is 0, we replace. Else append.
      if (currentOffset === 0) {
        setStocks(formattedStocks);
      } else {
        // We only append if we are not resetting
        setStocks((prev) => [...prev, ...formattedStocks]);
      }

      // Determine if there are more
      if (endIndex >= fullList.length) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

    } catch (err) {
      console.error('Error fetching stocks:', err);
      setError(err.message || 'Failed to fetch stocks');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [limit, sortBy, allData, dataFetched]); // removed 'loading' from dependency to avoid closures issues, handled inside

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
    setDataFetched(false); // Force re-fetch from API
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
