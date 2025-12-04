import { useEffect, useRef, useState } from 'react';
import { apiUrl, wsUrl } from '../utils/apiUrl';
// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
export const BACKEND_IP = wsUrl;
export const WS_URL = `ws://${wsUrl}/ws/prices`;

export const useStockData = (symbol, resolution = '1D') => {
  const [data, setData] = useState([]);
  const [latestQuote, setLatestQuote] = useState({
    price: 0,
    change: 0,
    changePct: 0,
    open: undefined,
    high: undefined,
    low: undefined,
    intervalComparison: undefined,
  });

  const [loading, setLoading] = useState(true);
  const ws = useRef(null);
  const dataRef = useRef([]);

  // Keep dataRef synced
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // 1. Fetch Initial Data
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setLoading(true);

        const chartResolutionMap = {
          '1m': '1',
          '5m': '1',
          '15m': '1',
          '30m': '2',
          '1H': '5',
          '1D': '15',
          '1W': '30',
          '1M': '60',
        };

        const fetchResolution = chartResolutionMap[resolution] || resolution;

        const historyUrl = `${apiUrl}/api/history?symbol=${symbol}&resolution=${fetchResolution}&limit=300`;
        const latestUrl = `${apiUrl}/api/prices/latest?symbol=${symbol}`;

        const historyRes = await fetch(historyUrl);
        const latestRes = await fetch(latestUrl);

        const historyJson = await historyRes.json();
        const latestJson = await latestRes.json();

        if (!isMounted) return;

        if (historyJson?.candles?.length > 0) {
          const totalCandles = historyJson.candles.length;
          const labelInterval = Math.ceil(totalCandles / 6);

          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

          const formattedData = historyJson.candles
            .filter(c => c.c && c.t)
            .map((c, index) => {
              const date = new Date(c.t * 1000);
              const istOffset = 5.5 * 60 * 60 * 1000;
              const istDate = new Date(date.getTime() + istOffset);

              const showLabel = index % labelInterval === 0 || index === totalCandles - 1;
              let label = '';

              if (resolution === '1D' || resolution === '1W') {
                const day = istDate.getUTCDate();
                const month = monthNames[istDate.getUTCMonth()];
                label = showLabel ? `${month} ${day}` : '';
              } else {
                const hours = istDate.getUTCHours().toString().padStart(2, '0');
                const minutes = istDate.getUTCMinutes().toString().padStart(2, '0');
                label = showLabel ? `${hours}:${minutes}` : '';
              }

              return {
                time: Number(c.t),
                open: parseFloat(c.o),
                high: parseFloat(c.h),
                low: parseFloat(c.l),
                close: parseFloat(c.c),
                value: parseFloat(c.c),
                date: istDate,
                label,
              };
            })
            .sort((a, b) => a.time - b.time);

          setData(formattedData);
        } else {
          console.warn(`⚠️ No candles for ${symbol}`);
          setData([]);
        }

        if (latestJson && !latestJson.error) {
          const currentLTP = latestJson.price || 0;

          const intervalMapping = {
            '1m': '1',
            '5m': '5',
            '15m': '15',
            '1H': '60',
            '1D': '1D',
            '1W': '1W',
            '1M': '1M',
          };

          const intervalComparison = {};

          await Promise.all(
            Object.entries(intervalMapping).map(async ([key, res]) => {
              try {
                const prevUrl = `${apiUrl}/api/history?symbol=${symbol}&resolution=${res}&limit=2`;
                const prevRes = await fetch(prevUrl);
                const prevJson = await prevRes.json();

                if (prevJson?.candles?.length >= 2) {
                  const lastCandle = prevJson.candles[prevJson.candles.length - 1];
                  const previousCandle = prevJson.candles[prevJson.candles.length - 2];

                  const previousClose = parseFloat(previousCandle.c);
                  const priceChange = currentLTP - previousClose;
                  const changePercent = previousClose !== 0 ? (priceChange / previousClose) * 100 : 0;

                  intervalComparison[key] = {
                    previousClose,
                    priceChange,
                    changePercent,
                    open: parseFloat(lastCandle.o),
                    high: parseFloat(lastCandle.h),
                    low: parseFloat(lastCandle.l),
                    close: parseFloat(lastCandle.c),
                  };
                } else {
                  intervalComparison[key] = {
                    previousClose: currentLTP,
                    priceChange: 0,
                    changePercent: 0,
                    open: currentLTP,
                    high: currentLTP,
                    low: currentLTP,
                    close: currentLTP,
                  };
                }
              } catch (err) {
                console.error(`Error fetching ${key} interval:`, err);
              }
            })
          );

          setLatestQuote({
            price: currentLTP,
            open: latestJson.open,
            high: latestJson.high,
            low: latestJson.low,
            change: latestJson.change || 0,
            changePct: latestJson.changePercent || 0,
            intervalComparison,
          });
        }
      } catch (err) {
        console.error('💥 Fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [symbol, resolution]);

  // 2. WebSocket connection
  useEffect(() => {
    let reconnectInterval;

    const connect = () => {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => console.log('✅ WS Connected');

      ws.current.onmessage = e => {
        try {
          const message = JSON.parse(e.data);
          if (message.type === 'price' && message.data && message.data.symbol === symbol) {
            const newPrice = parseFloat(message.data.value);

            setLatestQuote(prev => {
              const currentData = dataRef.current;
              const initialPrice = currentData.length > 0 ? currentData[0].value : newPrice;
              const priceChange = newPrice - initialPrice;
              const changePercent = initialPrice !== 0 ? (priceChange / initialPrice) * 100 : 0;

              return {
                ...prev,
                price: newPrice,
                change: priceChange,
                changePct: changePercent,
                open: message.data.open ? parseFloat(message.data.open) : prev.open,
                high: message.data.high ? parseFloat(message.data.high) : prev.high,
                low: message.data.low ? parseFloat(message.data.low) : prev.low,
                intervalComparison: prev.intervalComparison,
              };
            });

            // Update chart last candle
            setData(prevData => {
              const newData = [...prevData];
              if (newData.length > 0) {
                const last = newData[newData.length - 1];
                const updated = {
                  ...last,
                  close: newPrice,
                  high: Math.max(last.high, newPrice),
                  low: Math.min(last.low, newPrice),
                  value: newPrice,
                };
                newData[newData.length - 1] = updated;
              }
              return newData;
            });
          }
        } catch (err) {
          console.error('WS Parse Error:', err);
        }
      };

      ws.current.onerror = e => console.log('WS Error:', e);

      ws.current.onclose = () => {
        console.log('WS Closed - Reconnecting...');
      };
    };

    connect();

    reconnectInterval = setInterval(() => {
      if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
        connect();
      }
    }, 3000);

    return () => {
      clearInterval(reconnectInterval);
      if (ws.current) ws.current.close();
    };
  }, [symbol]);

  return { data, latestQuote, loading };
};
