import { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import GainerLoserCard from '../components/GainerLoserCard';
import StockCard from '../components/StockCard';
import { useAllStocks } from '../hooks/useAllStocks';
import { useMarketMovers } from '../hooks/useMarketMovers';

const StockTimelineScreen = () => {
    const [activeFilter, setActiveFilter] = useState('Latest');

    const filters = ['Latest', 'Watchlists', 'Gainers', 'Losers'];

    const { stocks: allStocks, loading: stocksLoading, hasMore, loadMore } = useAllStocks(5);
    const { data: moversData, loading: moversLoading } = useMarketMovers();

    const watchlistStocks = allStocks.slice(0, 10);

    const getStockData = () => {
        switch (activeFilter) {
            case 'Latest':
                return allStocks.map(stock => ({
                    ...stock,
                    analysis: 'Real-time market analysis and insights.',
                    stats: { likes: '0', dislikes: '0', comments: '0' }
                }));
            case 'Watchlists':
                return watchlistStocks.map(stock => ({
                    ...stock,
                    analysis: 'Stock in your watchlist.',
                    stats: { likes: '0', dislikes: '0', comments: '0' }
                }));
            case 'Gainers':
                return moversData?.gainers || [];
            case 'Losers':
                return moversData?.losers || [];
            default:
                return allStocks.map(stock => ({
                    ...stock,
                    analysis: 'Real-time market analysis and insights.',
                    stats: { likes: '0', dislikes: '0', comments: '0' }
                }));
        }
    };

    const stockData = getStockData();

    const { height: SCREEN_HEIGHT } = Dimensions.get('window');
    const ITEM_HEIGHT = SCREEN_HEIGHT - 60;

    const renderStockItem = ({ item }) => (
        <View style={{ height: ITEM_HEIGHT, justifyContent: 'flex-start' }}>
            <StockCard stock={item} />
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
        if ((activeFilter === 'Latest' || activeFilter === 'Watchlists') && !stocksLoading && hasMore) {
            loadMore();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F5F7" />

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                style={styles.filterContainer}
                contentContainerStyle={styles.filterContent}
            >
                {filters.map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        style={[
                            styles.filterButton,
                            activeFilter === filter && styles.activeFilterButton,
                        ]}
                        onPress={() => setActiveFilter(filter)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                activeFilter === filter && styles.activeFilterText,
                            ]}
                        >
                            {filter}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={{ flex: 50 }}>
                {(activeFilter === 'Gainers' || activeFilter === 'Losers') ? (
                    moversLoading ? (
                        <ActivityIndicator size="large" color="#2D1B69" style={{ marginTop: 20 }} />
                    ) : (
                        <FlatList
                            data={stockData}
                            renderItem={renderGainerLoserItem}
                            keyExtractor={(item) => item.id || item.symbol}
                            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                            showsVerticalScrollIndicator={true}
                        />
                    )
                ) : (
                    <FlatList
                        data={stockData}
                        renderItem={renderStockItem}
                        keyExtractor={(item) => item.id}
                        pagingEnabled
                        snapToAlignment="start"
                        decelerationRate="fast"
                        snapToInterval={ITEM_HEIGHT}
                        getItemLayout={(data, index) => ({
                            length: ITEM_HEIGHT,
                            offset: ITEM_HEIGHT * index,
                            index,
                        })}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 0 }}
                        onEndReached={handleLoadMore}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={
                            stocksLoading ? (
                                <ActivityIndicator size="small" color="#2D1B69" style={{ padding: 20 }} />
                            ) : null
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    filterContainer: {
        flexWrap: 'wrap',
        paddingHorizontal: 2,
        marginBottom: 0,
        marginTop: 7,
    },
    filterContent: {
        gap: 0,
    },
    filterButton: {
        height: 40,
        minWidth: 70,
        paddingHorizontal: 20,
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E8E8EA',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    activeFilterButton: {
        backgroundColor: '#2D1B69',
        shadowOpacity: 0.25,
        elevation: 5,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    activeFilterText: {
        color: '#FFF',
    }
});

export default StockTimelineScreen;
