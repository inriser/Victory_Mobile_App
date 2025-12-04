import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const BottomTabBar = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const tabs = [
    { name: "Home", component: "Home", icon: "home-outline", activeIcon: "home" },
    { name: "Portfolio", component: "PortfolioScreen", icon: "briefcase-outline", activeIcon: "briefcase" },
    { name: "Community", component: "StockTimelineScreen", icon: "people-outline", activeIcon: "people", badge: 3 },
    { name: "Ideas", component: "TradeScreen", icon: "bulb-outline", activeIcon: "bulb" },
    { name: "Trade", component: "OrdersScreen", icon: "cash-outline", activeIcon: "cash" },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = route.name === tab.component;

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(tab.component)}
          >
            <View style={styles.iconWrapper}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={isActive ? "#210f47" : "#888"}
              />
              {tab.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              )}
            </View>

            <Text
              style={[
                styles.label,
                { color: isActive ? "#210f47" : "#555" },
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 8,

  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    position: "relative",
  },
  label: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: "500",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#E53935",
    borderRadius: 10,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});

export default BottomTabBar;
