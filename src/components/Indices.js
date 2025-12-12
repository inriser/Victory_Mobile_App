import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { apiUrl } from '../utils/apiUrl';
import { useIntervalData } from '../hooks/useIntervalData';
// import { useRealtimePrices } from '../hooks/useRealtimePrices';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 250; // Increased width to match Figma design

const IndexCard = ({ name, value, change, changePercent, data, onPress }) => {
    const isPositive = change >= 0;

    // Generate zigzag chart data from OHLC or create realistic pattern
    let chartData;

    if (data && Array.isArray(data) && data.length > 0) {
        // Use provided OHLC data
        chartData = data;
    } else {
        // Generate multi-point zigzag pattern with peaks and valleys
        const close = value; // Current value is Close
        const open = value - change; // Previous close is Open

        // Calculate range for zigzag variations
        const range = Math.abs(change);
        const volatility = range * 1.2; // Increased volatility for more pronounced zigzag

        // Create 8-point zigzag pattern with alternating peaks and valleys
        const baseValue = Math.min(open, close);
        const topValue = Math.max(open, close);
        const midValue = (baseValue + topValue) / 2;

        const rawData = [
            open,                           // Start at Open
            baseValue + volatility * 0.6,   // Small peak
            baseValue + volatility * 0.3,   // Valley
            midValue + volatility * 0.5,    // Medium peak
            midValue - volatility * 0.2,    // Small valley
            topValue - volatility * 0.3,    // Higher peak
            topValue - volatility * 0.6,    // Valley
            close,                          // End at Close with upward trend
        ];

        // Normalize data by subtracting minimum (like GainerLoserCard)
        const minValue = Math.min(...rawData);
        chartData = rawData.map(val => ({ value: val - minValue }));
    }

    // Get current timestamp
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
        ' ' +
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    return (
        <TouchableOpacity style={styles.horizontalCard} onPress={onPress}>
            {/* Top Row: Name on left, Value on right */}
            <View style={styles.cardTopRow}>
                <View style={styles.cardLeft}>
                    <Text style={styles.indexName}>{name}</Text>
                    <Text style={styles.timestamp}>{timestamp}</Text>
                </View>
                <View style={styles.cardRight}>
                    <Text style={styles.indexValue}>₹ {value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    <Text style={[styles.changeText, isPositive ? styles.positive : styles.negative]}>
                        {isPositive ? '+' : ''}₹{change.toFixed(2)}({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
                    </Text>
                </View>
            </View>

            {/* Bottom: Minimal Zigzag Chart */}
            <View style={styles.chartContainer}>
                <LineChart
                    data={chartData}
                    width={CARD_WIDTH - 32}
                    height={50}
                    maxValue={Math.max(...chartData.map(d => d.value)) - Math.min(...chartData.map(d => d.value))}
                    yAxisOffset={0}
                    initialSpacing={0}
                    endSpacing={0}
                    spacing={chartData.length > 1 ? (CARD_WIDTH - 32) / (chartData.length - 1) : (CARD_WIDTH - 32)}
                    color={isPositive ? '#22c55e' : '#ef4444'}
                    thickness={2}
                    startFillColor={isPositive ? '#22c55e' : '#ef4444'}
                    endFillColor={isPositive ? '#22c55e' : '#ef4444'}
                    startOpacity={0.2}
                    endOpacity={0.0}
                    hideDataPoints
                    hideRules
                    hideAxesAndRules
                    hideYAxisText
                    curved
                    areaChart
                />
            </View>
        </TouchableOpacity>
    );
};

const IndexVerticalCard = ({ index, onPress }) => {
    // Fetch 1-minute interval data for more granularity (more zigzag)
    const { data: intervalData, loading } = useIntervalData(index.symbol, '1m');
    const isPositive = index.change >= 0;
    const color = isPositive ? '#22c55e' : '#ef4444';

    // Prepare Chart Data like StockListCard
    const allCandles = intervalData?.candles || [];
    // Take last 30 candles for a clean sparkline
    const recentCandles = allCandles.slice(-30);

    let chartData = [];
    let yMin = 0;
    let finalRange = 100;

    if (recentCandles.length >= 2) {
        chartData = recentCandles.map(item => ({ value: item.close }));

        const allValues = chartData.map(d => d.value);
        const minVal = Math.min(...allValues);
        const maxVal = Math.max(...allValues);
        const range = maxVal - minVal;

        // Dynamic padding
        const padding = range > 0 ? range * 0.1 : minVal * 0.01;

        yMin = Math.max(0, minVal - padding);
        const yMax = maxVal + padding;
        finalRange = Math.max(0.05, yMax - yMin);
    } else {
        // Fallback: Generate volatile zigzag if no real data
        const open = index.value - index.change;
        const close = index.value;
        const range = Math.abs(index.change);
        const volatility = range * 0.8 || index.value * 0.002;

        // Create 10-point zigzag pattern for more "zigzag" look
        const rawData = [
            open,
            open + (isPositive ? 1 : -1) * volatility * 0.3,
            open - (isPositive ? 1 : -1) * volatility * 0.2,
            open + (isPositive ? 1 : -1) * volatility * 0.6,
            open + (isPositive ? 1 : -1) * volatility * 0.1,
            open + (isPositive ? 1 : -1) * volatility * 0.8,
            open + (isPositive ? 1 : -1) * volatility * 0.4,

            close
        ];

        chartData = rawData.map(v => ({ value: v }));

        const minVal = Math.min(...rawData);
        const maxVal = Math.max(...rawData);
        const chartRange = maxVal - minVal;
        const padding = chartRange * 0.1;
        yMin = Math.max(0, minVal - padding);
        finalRange = chartRange + 2 * padding;
    }

    // console.log(`[Indices] ${index.symbol} - Loading: ${loading}, DataPoints: ${chartData.length}, Range: ${finalRange}`);

    return (
        <TouchableOpacity
            style={styles.verticalCard}
            onPress={() => onPress && onPress(index)}
        >
            <View style={styles.verticalCardLeft}>
                <Text style={styles.verticalSymbol}>{index.name || index.symbol}</Text>
                <Text style={styles.verticalTime}>
                    {new Date().toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit', hour12: true
                    }).toLowerCase()}
                </Text>
            </View>

            <View style={styles.verticalChartContainer}>
                {loading && chartData.length <= 3 && !recentCandles.length ? (
                    <ActivityIndicator size="small" color={color} />
                ) : (
                    <LineChart
                        data={chartData}
                        height={40}
                        width={80}
                        adjustToWidth={true}
                        maxValue={finalRange}
                        yAxisOffset={yMin}
                        initialSpacing={0}
                        endSpacing={0}
                        color={color}
                        thickness={2}
                        startFillColor={color}
                        endFillColor={color}
                        startOpacity={0.2}
                        endOpacity={0.0}
                        hideDataPoints
                        hideRules
                        rulesThickness={0}
                        rulesColor="transparent"
                        hideAxesAndRules
                        hideYAxisText
                        hideXAxisText
                        xAxisThickness={0}
                        yAxisThickness={0}
                        curved
                        areaChart
                        isAnimated={false} // Disable animation to prevent blinking
                    />
                )}
            </View>

            <View style={styles.verticalCardRight}>
                <Text style={styles.verticalPrice}>
                    ₹{index.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={[styles.verticalChange, { color }]}>
                    {isPositive ? '+' : ''}{index.change.toFixed(2)} ({isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%)
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const Indices = ({ exchange = 'NSE', viewMode = 'horizontal', onViewAllPress, maxItems, externalData, onIndexPress }) => {
    const [indices, setIndices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Subscribe to real-time price updates (DISABLED)
    // const { prices: realtimePrices, isConnected } = useRealtimePrices();

    useEffect(() => {
        // If externalData is provided, use it instead of fetching
        if (externalData) {
            setIndices(externalData);
            setLoading(false);
            return;
        }
        fetchIndices();
    }, [exchange, externalData]);

    // Merge real-time prices with fetched indices
    const indicesWithRealtimeData = useMemo(() => {
        return indices;
    }, [indices]);

    const fetchIndices = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${apiUrl}/api/indices`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success && Array.isArray(result.data)) {
                // Filter indices based on exchange
                // NSE indices: NIFTY, BANKNIFTY, etc.
                // BSE indices: SENSEX, BSE500, etc.
                const filteredIndices = result.data.filter(index => {
                    if (exchange === 'NSE') {
                        return index.symbol.includes('NIFTY') || index.symbol === 'NIFTY';
                    } else {
                        return index.symbol.includes('BSE') || index.symbol === 'SENSEX';
                    }
                });

                setIndices(filteredIndices);
            } else {
                setIndices([]);
            }
        } catch (err) {
            console.error('Error fetching indices:', err);
            setError(err.message);
            setIndices([]);
        } finally {
            setLoading(false);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2F0079" />
                <Text style={styles.loadingText}>Loading indices...</Text>
            </View>
        );
    }

    // Show error state
    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                <Text style={styles.errorText}>Failed to load indices</Text>
                <Text style={styles.errorSubtext}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchIndices}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Show empty state
    if (indicesWithRealtimeData.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="bar-chart-outline" size={48} color="#888" />
                <Text style={styles.emptyText}>No indices data available</Text>
                <Text style={styles.emptySubtext}>
                    {exchange === 'NSE' ? 'NSE indices will appear here' : 'BSE indices will appear here'}
                </Text>
            </View>
        );
    }

    // Horizontal scroll view (default)
    if (viewMode === 'horizontal') {
        // Limit items if maxItems is specified
        const displayIndices = maxItems ? indicesWithRealtimeData.slice(0, maxItems) : indicesWithRealtimeData;

        return (
            <View style={styles.horizontalContainer}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Indices</Text>
                    <TouchableOpacity onPress={onViewAllPress} style={styles.viewAllButton}>
                        <Ionicons name="arrow-forward" size={20} color="#2F0079" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalScroll}
                >
                    {displayIndices.map((index, i) => (
                        <IndexCard
                            key={index.symbol || i}
                            name={index.name || index.symbol}
                            value={index.value}
                            change={index.change}
                            changePercent={index.changePercent}
                            onPress={onViewAllPress}
                        />
                    ))}
                </ScrollView>
            </View>
        );
    }

    // Vertical list view (when arrow is clicked)
    if (viewMode === 'vertical') {
        return (
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.verticalList}>
                    {indicesWithRealtimeData.map((index, i) => (
                        <IndexVerticalCard
                            key={index.symbol || i}
                            index={index}
                            onPress={onIndexPress}
                        />
                    ))}
                </View>
            </ScrollView>
        );
    }

    // Grid view (for sectors/themes)
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Indices</Text>
            </View>

            <View style={styles.grid}>
                {indicesWithRealtimeData.map((index, i) => (
                    <View key={index.symbol || i} style={styles.gridCard}>
                        <Text style={styles.indexName}>{index.name || index.symbol}</Text>
                        <Text style={styles.indexValue}>₹ {index.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        <Text style={[styles.changeText, index.change >= 0 ? styles.positive : styles.negative]}>
                            {index.change >= 0 ? '+' : ''}{index.change.toFixed(2)} ({index.change >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%)
                        </Text>

                        <View style={styles.chartContainer}>
                            <LineChart
                                data={[
                                    { value: 100 },
                                    { value: 102 },
                                    { value: 98 },
                                    { value: 105 },
                                    { value: 103 },
                                    { value: 108 },
                                    { value: 110 },
                                ]}
                                width={(width - 48) / 2 - 32}
                                height={60}
                                hideDataPoints
                                hideAxesAndRules
                                hideYAxisText
                                color={index.change >= 0 ? '#22c55e' : '#ef4444'}
                                thickness={2}
                                curved
                                areaChart
                                startFillColor={index.change >= 0 ? '#22c55e' : '#ef4444'}
                                endFillColor={index.change >= 0 ? '#22c55e20' : '#ef444420'}
                                startOpacity={0.3}
                                endOpacity={0.1}
                            />
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    // Horizontal scroll styles
    horizontalContainer: {
        backgroundColor: '#F5F5F7',
        paddingVertical: 16,
    },
    horizontalScroll: {
        paddingHorizontal: 16,
        gap: 12,
    },
    horizontalCard: {
        width: CARD_WIDTH,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        paddingBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        minHeight: 130,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    cardLeft: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    cardRight: {
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    viewAllButton: {
        padding: 4,
    },

    // Grid view styles
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 16,
    },
    gridCard: {
        width: (width - 48) / 2,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    // Common styles
    indexName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    timestamp: {
        fontSize: 10,
        color: '#999',
        fontWeight: '400',
    },
    indexValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
        textAlign: 'right',
    },
    changeText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right',
    },
    positive: {
        color: '#22c55e',
    },
    negative: {
        color: '#ef4444',
    },
    chartContainer: {
        marginTop: 0,
        alignItems: 'center',
        overflow: 'hidden',
    },

    // Loading state
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },

    // Error state
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        padding: 20,
    },
    errorText: {
        marginTop: 12,
        fontSize: 18,
        color: '#ef4444',
        fontWeight: '600',
    },
    errorSubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#2F0079',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    // Empty state
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
        padding: 20,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 18,
        color: '#666',
        fontWeight: '600',
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },

    // Vertical list styles
    verticalList: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    verticalCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1,
    },
    verticalCardLeft: {
        flex: 1.2,
        justifyContent: 'center',
    },
    verticalChartContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
    },
    verticalCardRight: {
        flex: 1.2,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    verticalSymbol: {
        fontSize: 13,
        fontWeight: '700',
        color: '#333',
    },
    verticalTime: {
        fontSize: 11,
        color: '#999',
        marginTop: 4,
    },
    verticalPrice: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    verticalChange: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    changePercentText: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
});

export default Indices;
