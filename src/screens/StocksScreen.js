import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    StyleSheet,
    View,
    Text
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BottomTabBar from '../components/BottomTabBar';
import TopHeader from "../components/TopHeader";
import TopMenuSlider from '../components/TopMenuSlider';
import MarketTabs from '../components/MarketTabs';
import StockListCard from '../components/StockListCard'; // Import the new card
import GainerLoserCard from '../components/GainerLoserCard';
import StockCard from '../components/StockCard';

import { useAllStocks } from '../hooks/useAllStocks';
import { useMarketMovers } from '../hooks/useMarketMovers';

const StocksScreen = ({ navigation, route }) => {
    const { exchange, filterIndex } = route.params || {};

    // Auto-select exchange if passed from Home
    const [selectedExchange, setSelectedExchange] = useState(exchange || 'NSE');
    const [selectedTab, setSelectedTab] = useState('All'); // 'All' is default

    // Update state if params change (e.g. navigating from Home again)
    useEffect(() => {
        if (exchange) {
            setSelectedExchange(exchange);
        }
        // Always reset to 'All' when entering from an Index click
        setSelectedTab('All');
    }, [exchange]);

    // Lazy load: Start with 5 stocks. If filtering by index, ignore exchange filter to show all constituents.
    // This is crucial because NIFTY stocks might be stored as 'BSE' in our InternalTokenList, 
    // and filtering by 'NSE' (selectedExchange) would hide them.
    const { stocks: allStocks, loading: stocksLoading, hasMore, loadMore } = useAllStocks(5, 'price_desc', filterIndex, filterIndex ? null : selectedExchange);
    const { data: moversData, loading: moversLoading } = useMarketMovers();

    // Tabs configuration
    const stockTabs = ['All', 'Gainers', 'Losers', 'Breakout', '52W High', '52W Low'];

    // Sample Watchlist (using subset of all stocks for now)
    const watchlistStocks = allStocks.slice(0, 10);

    const handleExchangeChange = (exch) => {
        setSelectedExchange(exch);
    };

    const handleTabChange = (tab) => {
        setSelectedTab(tab);
    };

    const getStockData = () => {
        const defaultStats = { likes: "0", dislikes: "0", comments: "0" };

        switch (selectedTab) {
            case "All":
                // If specific exchange is selected, you might filter 'allStocks' here
                // assuming allStocks contains 'exchange' or similar field.
                // For now, if we assume allStocks are mixed or fetched based on exchange,
                // we'll filter client-side if the data supports it.
                return allStocks.filter(s => {
                    // If viewing an Index, show all its constituents regardless of their exchange
                    if (filterIndex) return true;

                    // Strict filtering by exchange
                    if (selectedExchange === 'NSE') {
                        return s.exchange === 'NSE';
                    } else if (selectedExchange === 'BSE') {
                        return s.exchange === 'BSE';
                    }
                    // If no exchange selected (unlikely for now), return all
                    return true;
                }).map(stock => ({
                    ...stock,
                    analysis: "Real-time market analysis and insights.",
                    stats: stock.stats || defaultStats
                }));

            case "Gainers":
                return (moversData?.gainers || []).map(item => ({
                    ...item,
                    stats: defaultStats
                }));

            case "Losers":
                return (moversData?.losers || []).map(item => ({
                    ...item,
                    stats: defaultStats
                }));

            // Placeholder for other tabs
            case "Breakout":
            case "52W High":
            case "52W Low":
                return [];

            default:
                return allStocks;
        }
    };

    const stockData = getStockData();

    // Layout config
    const { height: SCREEN_HEIGHT } = Dimensions.get('window');
    const ITEM_HEIGHT = SCREEN_HEIGHT - 60;

    const renderStockItem = ({ item }) => (
        <View>
            {/* Use the new improved StockListCard for the list view */}
            <StockListCard stock={item} />
        </View>
    );

    const renderGainerLoserItem = ({ item }) => (
        <GainerLoserCard
            symbol={item.symbol}
            name={item.name}
            price={item.price}
            change={item.change}
            percentChange={item.percentChange}
        />
    );

    const handleLoadMore = () => {
        if (selectedTab === 'All' && !stocksLoading && hasMore) {
            loadMore();
        }
    };

    return (
        <>
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <TopHeader />
                <TopMenuSlider currentRoute="Stocks" />

                <MarketTabs
                    tabs={stockTabs}
                    selectedExchange={selectedExchange}
                    onExchangeChange={handleExchangeChange}
                    onCategoryChange={handleTabChange}
                />

                <View style={styles.content}>
                    {(selectedTab === 'Gainers' || selectedTab === 'Losers') ? (
                        moversLoading ? (
                            <ActivityIndicator size="large" color="#210F47" style={{ marginTop: 20 }} />
                        ) : (
                            <FlatList
                                data={stockData}
                                renderItem={renderGainerLoserItem}
                                keyExtractor={(item) => item.id || item.symbol}
                                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, marginTop: 10 }}
                                showsVerticalScrollIndicator={true}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>No stocks found</Text>
                                    </View>
                                }
                            />
                        )
                    ) : (selectedTab === 'Breakout' || selectedTab === '52W High' || selectedTab === '52W Low') ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{selectedTab} data coming soon...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={stockData}
                            renderItem={renderStockItem} // Corrected to use renderStockItem
                            keyExtractor={(item) => item.id || item.token || item.symbol}
                            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, marginTop: 10 }}
                            showsVerticalScrollIndicator={true}
                            onEndReached={handleLoadMore}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={
                                stocksLoading ? (
                                    <ActivityIndicator size="small" color="#210F47" style={{ padding: 20 }} />
                                ) : null
                            }
                        />
                    )}
                </View >
            </SafeAreaView >
            <BottomTabBar />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50
    },
    emptyText: {
        fontSize: 14,
        color: '#888',
        fontWeight: '500'
    }
});

export default StocksScreen;
