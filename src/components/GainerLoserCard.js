import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useIntervalData } from '../hooks/useIntervalData';

const { width } = Dimensions.get('window');

const GainerLoserCard = ({ symbol, name, price, change, percentChange }) => {
    // Always fetch 1D data for Gainers/Losers
    const { data, loading } = useIntervalData(symbol, '1d');

    const currentPrice = price ?? data?.ltp ?? 0;
    const priceChange = change ?? data?.priceChange ?? 0;
    const percentageChange = percentChange ?? data?.percentChange ?? 0;
    const isPositive = priceChange >= 0;
    const color = isPositive ? '#22c55e' : '#ef4444';

    // Prepare chart data
    const candles = data?.candles || [];
    const values = candles.map((c) => c.close);
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;
    const range = max - min;

    const chartData = candles.map((c) => ({ value: c.close - min }));

    // Loading state
    if (loading && !data) {
        return (
            <View style={styles.card}>
                <View style={styles.leftSection}>
                    <View style={styles.iconPlaceholder} />
                    <View>
                        <Text style={styles.name}>{name}</Text>
                        <Text style={styles.symbol}>{symbol}</Text>
                    </View>
                </View>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            {/* Left: Icon & Name */}
            <View style={styles.leftSection}>
                <View style={styles.iconContainer}>
                    <Text style={styles.iconText}>{symbol[0]}</Text>
                </View>
                <View>
                    <Text style={styles.name} numberOfLines={1}>{name}</Text>
                    <Text style={styles.symbol}>{symbol}</Text>
                </View>
            </View>

            {/* Middle: Mini Chart */}
            <View style={styles.chartSection}>
                {chartData.length > 0 && (
                    <LineChart
                        data={chartData}
                        height={40}
                        width={80}
                        maxValue={Math.max(0.1, range)}
                        yAxisOffset={0}
                        initialSpacing={0}
                        endSpacing={0}
                        spacing={chartData.length > 1 ? 80 / (chartData.length - 1) : 80}
                        color={color}
                        thickness={2}
                        startFillColor={color}
                        endFillColor={color}
                        startOpacity={0.2}
                        endOpacity={0.0}
                        hideDataPoints
                        hideRules
                        hideAxesAndRules
                        hideYAxisText
                        curved
                        areaChart
                    />
                )}
            </View>

            {/* Right: Price Info */}
            <View style={styles.rightSection}>
                <Text style={styles.price}>₹ {currentPrice.toFixed(2)}</Text>
                <Text style={[styles.change, { color }]}>
                    {isPositive ? '+' : ''}₹{Math.abs(priceChange).toFixed(2)} ({Math.abs(percentageChange).toFixed(2)}%)
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        height: 80,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1.2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        marginRight: 12,
    },
    iconText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4F46E5',
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    symbol: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
    },
    chartSection: {
        width: 80,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    rightSection: {
        alignItems: 'flex-end',
        flex: 1,
    },
    price: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    change: {
        fontSize: 12,
        fontWeight: '600',
    },
    loadingText: {
        fontSize: 12,
        color: '#94a3b8',
    },
});

export default GainerLoserCard;
