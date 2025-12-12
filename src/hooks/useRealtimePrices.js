import { useEffect, useRef, useState, useCallback } from 'react';
import { wsUrl } from '../utils/apiUrl';

/**
 * useRealtimePrices - Hook for real-time price updates via WebSocket
 * 
 * Connects to the backend WebSocket and maintains a map of symbol -> price data.
 * Optimized for indices display - updates LTP and percentage without chart refresh.
 * 
 * @returns {Object} { prices, isConnected, getPrice }
 * - prices: Map of symbol -> { price, change, changePercent, open, high, low, close }
 * - isConnected: Boolean indicating WebSocket connection status
 * - getPrice: Function to get price data for a specific symbol
 */
export const useRealtimePrices = () => {
    const [prices, setPrices] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef(null);
    const reconnectTimer = useRef(null);

    // Connect to WebSocket
    const connect = useCallback(() => {
        try {
            const WS_URL = `ws://${wsUrl}/ws/prices`;
            console.log(`[RealtimePrices] Attempting to connect to: ${WS_URL}`);

            ws.current = new WebSocket(WS_URL);

            ws.current.onopen = () => {
                console.log('✅ [RealtimePrices] WebSocket Connected');
                setIsConnected(true);
            };

            ws.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    // Handle price updates
                    if (message.type === 'price' && message.data) {
                        const { symbol, value, open, high, low, close } = message.data;

                        if (!symbol || value === undefined) return;

                        setPrices(prev => {
                            // Get previous close for change calculation
                            const prevData = prev[symbol];
                            const prevClose = prevData?.prevClose || open || value;

                            // Calculate change and percent
                            const change = value - prevClose;
                            const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

                            return {
                                ...prev,
                                [symbol]: {
                                    price: value,
                                    change,
                                    changePercent,
                                    open,
                                    high,
                                    low,
                                    close,
                                    prevClose: prevData?.prevClose || open || value, // Keep prev close stable
                                    timestamp: new Date()
                                }
                            };
                        });
                    }
                } catch (err) {
                    // Ignore parse errors for ping/pong messages
                }
            };

            ws.current.onerror = (error) => {
                // Log full error details
                console.log('❌ [RealtimePrices] WebSocket Error:', error);
                if (error.message) console.log('Error Message:', error.message);
            };

            ws.current.onclose = (e) => {
                console.log(`🔄 [RealtimePrices] WebSocket Closed (Code: ${e.code}, Reason: ${e.reason}) - Reconnecting...`);
                setIsConnected(false);
                scheduleReconnect();
            };

        } catch (error) {
            console.error('[RealtimePrices] Connection error:', error);
            scheduleReconnect();
        }
    }, []);

    // Schedule reconnection
    const scheduleReconnect = useCallback(() => {
        if (reconnectTimer.current) return;

        reconnectTimer.current = setTimeout(() => {
            reconnectTimer.current = null;
            connect();
        }, 3000);
    }, [connect]);

    // Get price for a specific symbol
    const getPrice = useCallback((symbol) => {
        return prices[symbol] || null;
    }, [prices]);

    // Initialize connection
    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
            }
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [connect]);

    return { prices, isConnected, getPrice };
};

export default useRealtimePrices;
