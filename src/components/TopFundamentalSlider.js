
import { Text, StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import axiosInstance from "../api/axios";

const TopFundamentalSlider = ({
    currentRoute: propCurrentRoute,
    learningCategory = [],
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
                {learningCategory.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                            styles.tabItem,
                            (selectedCategory?.id === item.id) && styles.activeTab
                        ]}
                        onPress={() => handleTabPress(item)}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                (selectedCategory?.id === item.id) && styles.activeTabText
                            ]}
                        >
                            {item.name}
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
        backgroundColor: "#e6e6e6", // <-- Gray active tab background
        shadowColor: "#210f47",
        shadowOpacity: 0.2,
    },
    activeTabText: {
        color: "#210f47", // Keep text dark on gray background
        fontWeight: "600",
    },
});

export default TopFundamentalSlider;
