import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '../utils/apiUrl';

export const useAllStocks = (limit = 100, sortBy = 'price_desc', indexName = null, exchange = null) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState(null);

  const [allData, setAllData] = useState([]);
  const [dataFetched, setDataFetched] = useState(false);

  const fetchStocks = useCallback(async (currentOffset) => {
    if (loading && currentOffset !== 0) return;

    try {
      setLoading(true);
      setError(null);

      let fullList = allData;

      // Fetch init data if needed
      if (currentOffset === 0 || !dataFetched) {
        // 1. Fetch Master List
        const response = await fetch(`${apiUrl}/api/trading/watchlist`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        // 2. If indexName is provided, fetch constituent symbols and filter
        if (result.success && Array.isArray(result.data)) {
          let filteredData = result.data;

          if (indexName) {
            try {
              const idxRes = await fetch(`${apiUrl}/api/indices/${indexName}/stocks`);
              const idxResult = await idxRes.json();
              if (idxResult.success && Array.isArray(idxResult.data)) {
                // Determine constituent symbols
                const constituentSymbols = new Set(idxResult.data);

                // Filter by Index Constituents
                filteredData = filteredData.filter(s => constituentSymbols.has(s.symbol));
              }
            } catch (idxErr) {
              console.warn(`Failed to filter by index ${indexName}:`, idxErr);
            }
          }

          // Filter by Exchange (NSE/BSE) if provided
          if (exchange) {
            filteredData = filteredData.filter(stock =>
              (stock.exchange && stock.exchange === exchange) ||
              (stock.exch_seg && stock.exch_seg === exchange)
            );
          }

          fullList = filteredData;
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
        exchange: stock.exch_seg || stock.exchange || 'NSE',
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
  }, [limit, sortBy, allData, dataFetched, indexName]);

  useEffect(() => {
    // Reset state when indexName changes
    setOffset(0);
    setStocks([]);
    setDataFetched(false); // Force re-fetch
    setAllData([]);
    // fetchStocks(0) will be called by the dependency effect below or explicitly
    // Actually we need to call it here or ensure dependency triggers it
    fetchStocks(0);
  }, [indexName]);


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
