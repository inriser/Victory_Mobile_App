import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { LinearGradient } from "expo-linear-gradient";

const WatchlistItemCard = ({ data = [], ltpData = {}, onPressItem, onRemoveItem }) => {
  // ✅ Create a ref map to track each Swipeable instance
  const swipeableRefs = useRef({});

  // ✅ Helper: Close a specific item's swipe
  const closeSwipe = useCallback((id) => {
    if (swipeableRefs.current[id]) {
      swipeableRefs.current[id].close();
    }
  }, []);

  // ✅ Handlers that auto-close after action
  const handleLeftSwipe = useCallback((item) => {
    onPressItem?.(item);
    closeSwipe(item.script_id); // or item.token if script_id not unique
  }, [onPressItem, closeSwipe]);

  const handleRightSwipe = useCallback((item) => {
    Alert.alert(
      "Remove from Watchlist?",
      `Are you sure you want to remove ${item.script_name} from your watchlist?`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => closeSwipe(item.script_id), // ✅ Still close on Cancel
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            onRemoveItem?.(item);
            closeSwipe(item.script_id);
          },
        },
      ],
      { cancelable: true }
    );
  }, [onRemoveItem, closeSwipe]);

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <View style={styles.emptyWrapper}>
        <Text style={styles.emptyText}>
          Find a stock and add it to your watchlist.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {data.map((item) => {
        const id = item.script_id; // Ensure this is unique!
        const symbol = item.script_id;
        const name = item.script_name;
        const ltp = ltpData[symbol];
        const isUp = typeof ltp === 'number' && ltp > 0;

        const initials = name
          .split(' ')
          .map(w => w[0]?.toUpperCase())
          .filter(Boolean)
          .join('')
          .slice(0, 2) || '??';

        return (
          <Swipeable
            key={id}
            ref={(ref) => {
              if (ref) {
                swipeableRefs.current[id] = ref;
              } else {
                // Cleanup on unmount
                delete swipeableRefs.current[id];
              }
            }}
            renderLeftActions={() => (
              <View style={styles.leftAction}>
                <Text style={styles.buyText}>Buy ››</Text>
              </View>
            )}
            renderRightActions={() => (
              <View style={styles.rightAction}>
                <Text style={styles.removeText}>Remove ‹‹</Text>
              </View>
            )}
            onSwipeableLeftOpen={() => handleLeftSwipe(item)}
            onSwipeableRightOpen={() => handleRightSwipe(item)}
            // Optional: Prevent overswipe
            overshootLeft={false}
            overshootRight={false}
          >
            <View style={styles.cardWrapper}>
              <LinearGradient
                colors={isUp ? ["#E6F7EE", "#21C17A"] : ["#FDEAEA", "#E53935"]}
                start={{ x: 0.3, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientWave}
              />

              <TouchableOpacity
                style={styles.card}
              >
                <View style={styles.logoFallback}>
                  <Text style={styles.logoFallbackText}>{initials}</Text>
                </View>

                <View style={styles.infoContainer}>
                  <Text style={styles.companyName} numberOfLines={1}>{name}</Text>
                  <Text style={styles.symbol} numberOfLines={1}>{symbol}</Text>
                </View>

                <View style={styles.rightContainer}>
                  <Text style={[styles.price, { color: isUp ? '#2E7D32' : '#C62828' }]}>
                    {ltp != null ? `₹${ltp.toFixed(2)}` : '--'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </Swipeable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardWrapper: { marginVertical: 6, marginHorizontal: 12 },
  gradientWave: {
    position: "absolute",
    right: 0, top: 0, bottom: 0,
    width: "35%", borderRadius: 14,
    opacity: 0.2,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    elevation: 2,
  },
  logoFallback: {
    width: 34, height: 34,
    borderRadius: 17,
    backgroundColor: "#210F47",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoFallbackText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  infoContainer: { flex: 1 },
  companyName: { fontSize: 14, fontWeight: "600", color: "#111" },
  symbol: { fontSize: 11, color: "#666", marginTop: 2 },
  rightContainer: { alignItems: "flex-end" },
  price: { fontSize: 14, fontWeight: "600" },
  leftAction: {
    justifyContent: "center",
    paddingLeft: 30,
    width: 90,
    borderRadius: 14,
  },
  buyText: { fontSize: 12, fontWeight: "700", color: "#210F47" },
  rightAction: {
    justifyContent: "center",
    paddingRight: 30,
    paddingLeft: 20,
    width: 110,
    borderRadius: 14,
  },
  removeText: { fontSize: 12, fontWeight: "700", color: "#D32F2F" },
  emptyWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30
  },
  emptyText: { fontSize: 14, color: "#777", textAlign: "center" },
});

export default WatchlistItemCard;