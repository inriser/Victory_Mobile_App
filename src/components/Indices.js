import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { apiUrl } from '../utils/apiUrl';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 160; // Fixed width for horizontal scroll cards

const IndexCard = ({ name, value, change, changePercent, data, onPress }) => {
    const isPositive = change >= 0;

    // Sample chart data - replace with actual data when available
    const chartData = data || [
        { value: 100 },
        { value: 102 },
        { value: 98 },
        { value: 105 },
        { value: 103 },
        { value: 108 },
        { value: 110 },
    ];

    return (
        <TouchableOpacity style={styles.horizontalCard} onPress={onPress}>
            <Text style={styles.indexName}>{name}</Text>
            <Text style={styles.indexValue}>₹ {value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            <Text style={[styles.changeText, isPositive ? styles.positive : styles.negative]}>
                {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
            </Text>

            {/* Mini Chart */}
            <View style={styles.chartContainer}>
                <LineChart
                    data={chartData}
                    width={CARD_WIDTH - 32}
                    height={50}
                    hideDataPoints
                    hideAxesAndRules
                    hideYAxisText
                    color={isPositive ? '#22c55e' : '#ef4444'}
                    thickness={2}
                    curved
                    areaChart
                    startFillColor={isPositive ? '#22c55e' : '#ef4444'}
                    endFillColor={isPositive ? '#22c55e20' : '#ef444420'}
                    startOpacity={0.3}
                    endOpacity={0.1}
                />
            </View>
        </TouchableOpacity>
    );
};

const Indices = ({ exchange = 'NSE', viewMode = 'horizontal', onViewAllPress }) => {
    const [indices, setIndices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchIndices();
    }, [exchange]);

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
    if (indices.length === 0) {
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
                    {indices.map((index, i) => (
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

    // Grid view (when Indices tab is selected)
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Indices</Text>
            </View>

            <View style={styles.grid}>
                {indices.map((index, i) => (
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
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
        color: '#2F0079',
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
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 4,
    },
    indexValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2F0079',
        marginBottom: 4,
    },
    changeText: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    positive: {
        color: '#22c55e',
    },
    negative: {
        color: '#ef4444',
    },
    chartContainer: {
        marginTop: 8,
        alignItems: 'center',
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
});

export default Indices;
