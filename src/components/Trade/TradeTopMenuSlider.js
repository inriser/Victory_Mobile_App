
import { Text, StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// import { useNavigation, useRoute } from "@react-navigation/native";
// import axiosInstance from "../api/axios";

const TradeTopMenuSlider = ({
    currentRoute: propCurrentRoute,
    tradeCategory = [],
    selectedCategory,
    onTabChange,
    isClickable = true
}) => {

    const handleTabPress = (item) => {
        if (!isClickable) return;
        onTabChange(item);
    };


    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {tradeCategory.map((item) => (
                    <TouchableOpacity
                        key={item.scriptTypeId}
                        style={[
                            styles.tabItem,
                            (selectedCategory?.scriptTypeId === item.scriptTypeId) && styles.activeTab
                        ]}
                        onPress={() => handleTabPress(item)}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                (selectedCategory?.scriptTypeId === item.scriptTypeId) && styles.activeTabText
                            ]}
                        >
                            {item.scriptTypeName}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: "#fff",
    },
    scrollContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    tabItem: {
        backgroundColor: "#fff",
        borderRadius: 40,
        paddingVertical: 6,
        paddingHorizontal: 18,
        marginRight: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 1.5,
        elevation: 2,
    },
    tabText: {
        color: "#210f47",
        fontSize: 12,
        fontWeight: "500",
    },
    activeTab: {
        backgroundColor: "#210f47",
        shadowColor: "#210f47",
        shadowOpacity: 0.2,
    },
    activeTabText: {
        color: "#fff",
        fontWeight: "600",
    },
});

export default TradeTopMenuSlider;
