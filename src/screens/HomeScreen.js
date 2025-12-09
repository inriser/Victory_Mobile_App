import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from '@react-navigation/native';
import TopMenuSlider from '../components/TopMenuSlider';
import TopHeader from '../components/TopHeader';
import { useAuth } from '../context/AuthContext';
import BottomTabBar from '../components/BottomTabBar';
import MarketTabs from '../components/MarketTabs';
import Indices from '../components/Indices';

export default function HomeScreen({ navigation }) {
    const route = useRoute();
    const { clientId, authToken, feedToken, refreshToken } = useAuth();

    const [selectedExchange, setSelectedExchange] = useState('NSE');
    const [selectedCategory, setSelectedCategory] = useState(null); // No tab selected by default

    const handleExchangeChange = (exchange) => {
        setSelectedExchange(exchange);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    const handleViewAllIndices = () => {
        setSelectedCategory('Indices');
    };

    // Render content based on selected category
    const renderContent = () => {
        // Default view: Show horizontal scroll of indices
        if (!selectedCategory) {
            return (
                <Indices
                    exchange={selectedExchange}
                    viewMode="horizontal"
                    onViewAllPress={handleViewAllIndices}
                />
            );
        }

        // When a tab is selected
        switch (selectedCategory) {
            case 'Indices':
                return <Indices exchange={selectedExchange} viewMode="grid" />;
            case 'Sectors':
                return (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>Sectors content coming soon...</Text>
                    </View>
                );
            case 'Industries':
                return (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>Industries content coming soon...</Text>
                    </View>
                );
            case 'Themes':
                return (
                    <View style={styles.placeholderContainer}>
                        <Text style={styles.placeholderText}>Themes content coming soon...</Text>
                    </View>
                );
            default:
                return (
                    <Indices
                        exchange={selectedExchange}
                        viewMode="horizontal"
                        onViewAllPress={handleViewAllIndices}
                    />
                );
        }
    };

    return (
        <>
            <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: "#fff" }}>
                <TopHeader />
                <TopMenuSlider currentRoute={route.name} />
                <MarketTabs
                    onExchangeChange={handleExchangeChange}
                    onCategoryChange={handleCategoryChange}
                />

                <View style={styles.content}>
                    {renderContent()}
                </View>

            </SafeAreaView>
            <BottomTabBar />
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F7',
    },
    placeholderText: {
        fontSize: 16,
        color: '#888',
        fontWeight: '500',
    },
});
