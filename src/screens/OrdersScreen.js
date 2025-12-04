import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import TopHeader from "../components/TopHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomTabBar from '../components/BottomTabBar';
import { Ionicons } from "@expo/vector-icons";
import OrderItemCard from "../components/OrderItemCard";
import TradeExecutedCard from "../components/TradeExecutedCard";
import PositionCard from "../components/PositionCard";
import { apiUrl } from '../utils/apiUrl';
import { useAuth } from '../context/AuthContext';
import TradeOrderTabs from '../components/Trade/TradeOrderTabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceId } from "../utils/deviceId";
import { useNavigation, useRoute } from '@react-navigation/native';

const filterOptions = [
    "All",
    "Buy",
    "Sell",
    "Completed",
    "Pending"
];

const OrdersScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [originalOrders, setOriginalOrders] = useState([]);
    const [selectedTab, setSelectedTab] = useState(1);
    const [sortOrder, setSortOrder] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState("All");
    const { authToken } = useAuth();
    useEffect(() => {
        if (route.params?.defaultTab) {
            setSelectedTab(route.params.defaultTab);
        } else {
            setSelectedTab(1); // ⭐ DEFAULT Trade
        }
    }, [route.params]);
    const fetchOrders = async () => {
        try {
            setLoading(true);

            let url = "";
            if (selectedTab === 1) url = `${apiUrl}/api/trade/get`;
            if (selectedTab === 2) url = `${apiUrl}/api/order/get`;
            if (selectedTab === 3) url = `${apiUrl}/api/position/get`;

            const userId = await AsyncStorage.getItem("userId");
            const deviceId = await getDeviceId();

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${authToken}`,
                    "Content-Type": "application/json",
                    "userid": userId,
                    "device_mac": deviceId
                }
            });

            const text = await response.text();
            const data = JSON.parse(text);

            setOrders(data?.data || []);
            setOriginalOrders(data?.data || []);
            setSortOrder(null);

        } catch (error) {
            console.log("API Error:", error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchOrders();
    }, [selectedTab]);

    const sortOrders = () => {
        let newOrders = [...orders];

        if (sortOrder === null) {
            newOrders.sort((a, b) => Number(b.price) - Number(a.price)); // DESC
            setSortOrder("desc");
        }
        else if (sortOrder === "desc") {
            newOrders.sort((a, b) => Number(a.price) - Number(b.price)); // ASC
            setSortOrder("asc");
        }
        else {
            newOrders = [...originalOrders]; // RESET
            setSortOrder(null);
        }

        setOrders(newOrders);
    };

    // 📌 FILTER LOGIC
    const applyFilter = (option) => {
        setSelectedFilter(option);

        if (option === "All") {
            setOrders(originalOrders);
            return;
        }

        const filtered = originalOrders.filter((item) => {
            if (option === "Buy") return item.transaction_type === "Buy";
            if (option === "Sell") return item.transaction_type === "Sell";
            if (option === "Completed") return item.status === "Completed";
            if (option === "Pending") return item.status === "Pending";
            return true;
        });

        setOrders(filtered);
    };
    const cancelOrderApi = async (item) => {

        const userId = await AsyncStorage.getItem("userId");
        const deviceId = await getDeviceId();

        const payload = {
            variety: item.variety,
            orderid: item.orderid,

            symboltoken: item.symbol_token,
            tradingsymbol: item.trading_symbol,
            transactiontype: item.transaction_type,
            exchange: item.exchange,
            ordertype: item.order_type,
            producttype: item.product_type,
            duration: item.duration,
            price: item.price,
            squareoff: item.square_off ?? 0,
            stoploss: item.stop_loss ?? 0,
            quantity: item.quantity,
            script: item.script
        };
        const response = await fetch(`${apiUrl}/api/order/cancel/${item.orderid}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`,
                "userid": userId,
                "device_mac": deviceId
            },
            body: JSON.stringify(payload)
        });

        await fetchOrders();
        return await response.json();
    };


    return (
        <>
            <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
                <TopHeader />

                {/* Tabs */}
                <View style={styles.topSliders}>
                    <TradeOrderTabs
                        activeTab={selectedTab}
                        onTabChange={(tab) => setSelectedTab(tab)}
                    />

                </View>

                {/* Sort + Filter Bar */}
                <View style={styles.orderTopBar}>
                    <Text style={styles.orderTitle}>
                        {selectedTab === 1 ? "Trade" : selectedTab === 2 ? "Orders" : "Positions"}
                    </Text>

                    <View style={styles.row}>

                        {/* SORT BUTTON */}
                        <TouchableOpacity style={styles.iconRow} onPress={sortOrders}>
                            {/* Icon Logic */}
                            {sortOrder === null && (
                                <Ionicons name="swap-vertical" size={16} color="#000" />
                            )}
                            {sortOrder === "asc" && (
                                <Ionicons name="arrow-up" size={16} color="#000" />
                            )}
                            {sortOrder === "desc" && (
                                <Ionicons name="arrow-down" size={16} color="#000" />
                            )}
                            <Text style={styles.actionText}>Sort</Text>
                        </TouchableOpacity>

                        {/* FILTER BUTTON */}
                        <TouchableOpacity style={styles.iconRow} onPress={() => setIsFilterOpen(true)}>
                            <Ionicons name="funnel-outline" size={16} color="#000" />
                            <Text style={styles.actionText}>Filter</Text>
                        </TouchableOpacity>

                    </View>
                </View>

                {/* FILTER MODAL */}
                <Modal
                    visible={isFilterOpen}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setIsFilterOpen(false)}
                >
                    <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={() => setIsFilterOpen(false)}
                    >
                        <View style={styles.filterDropdown}>
                            {filterOptions.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.dropdownItem}
                                    onPress={() => {
                                        setIsFilterOpen(false);
                                        applyFilter(option);
                                    }}
                                >
                                    <Text style={styles.dropdownText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </TouchableOpacity>
                </Modal>

                {loading ? (
                    <View style={styles.loaderBox}>
                        <Text style={styles.loaderText}>Loading...</Text>
                    </View>
                ) : orders.length === 0 ? (

                    <View style={{ marginTop: 60, alignItems: 'center' }}>
                        <Text style={{ marginTop: 10, fontSize: 16, fontWeight: "600", color: "#555" }}>
                            No Data Found
                        </Text>
                    </View>

                ) : (
                    <ScrollView style={{ marginTop: 10 }}>
                        {orders.map((item, index) => {

                            const uniqueKey =
                                item.orderid ??
                                item.fillid ??
                                item.symboltoken ??
                                `${item.tradingsymbol || "row"}_${index}`;

                            if (selectedTab === 2) {
                                return (
                                    <OrderItemCard
                                        key={uniqueKey}
                                        name={item.trading_symbol}
                                        type={item.transaction_type?.toUpperCase()}
                                        shares={`${item.unfilledshares}/${Number(item.filledshares) + Number(item.unfilledshares)}`}
                                        status={item.status}
                                        price={`₹ ${Number(item.price).toFixed(2)}`}
                                        onModify={() => {
                                            navigation.navigate('TradeOrder', {
                                                symbol: item.trading_symbol,
                                                token: item.symbol_token,
                                                name: item.script,
                                                price: item.price,
                                                quantity: item.quantity,
                                                stoploss: item.stop_loss,
                                                target: 0,
                                                producttype: item.product_type,
                                                internaltype: 'Modify',
                                                orderid: item.orderid,
                                            });
                                        }}
                                        onCancel={async () => {
                                            Alert.alert(
                                                "Cancel Order",
                                                "Are you sure you want to cancel this order?",
                                                [
                                                    { text: "No", style: "cancel" },
                                                    {
                                                        text: "Yes",
                                                        onPress: async () => {
                                                            const res = await cancelOrderApi(item);

                                                            if (res.success) {
                                                                Alert.alert("Success", "Order cancelled successfully.");
                                                            } else {
                                                                Alert.alert("Error", res?.message || "Failed to cancel order.");
                                                            }
                                                        }
                                                    }
                                                ]
                                            );
                                        }}
                                    />
                                );
                            }

                            if (selectedTab === 1) {
                                return (
                                    <TradeExecutedCard
                                        key={uniqueKey}
                                        exchange={item.exchange}
                                        producttype={item.producttype}
                                        tradingsymbol={item.tradingsymbol}
                                        transactiontype={item.transactiontype}
                                        tradevalue={item.tradevalue}
                                        fillprice={item.fillprice}
                                        fillsize={item.fillsize}
                                        orderid={item.orderid}
                                        fillid={item.fillid}
                                        filltime={item.filltime}
                                    />
                                );
                            }

                            // 🔹 Positions Tab (selectedTab === 3)
                            return (
                                <PositionCard
                                    key={uniqueKey}
                                    tradingsymbol={item.tradingsymbol}
                                    exchange={item.exchange}
                                    producttype={item.producttype}
                                    buyqty={item.buyqty}
                                    sellqty={item.sellqty}
                                    netqty={item.netqty}
                                    buyavgprice={item.buyavgprice}
                                    sellavgprice={item.sellavgprice}
                                    ltp={item.ltp}
                                    pnl={item.pnl}
                                    unrealised={item.unrealised}
                                    realised={item.realised}
                                />
                            );
                        })}
                    </ScrollView>
                )}

            </SafeAreaView>
            <BottomTabBar />
        </>
    );
};

export default OrdersScreen;

const styles = StyleSheet.create({
    loaderBox: {
        marginTop: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    loaderText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#555",
    },
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    topSliders: {
        backgroundColor: "#fff",
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        marginTop: -3,
        paddingTop: 3,
        marginBottom: 10
    },

    orderTopBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginTop: 5,
    },

    orderTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#000",
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
    },

    iconRow: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 18,
    },

    actionText: {
        marginLeft: 4,
        fontSize: 13,
        color: "#000",
    },

    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-start",
        alignItems: "flex-end",
    },

    filterDropdown: {
        backgroundColor: "#fff",
        borderRadius: 10,
        marginTop: 140,
        marginRight: 20,
        width: 120,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: "#eee",
        elevation: 6,
        shadowColor: "#210f47",
        shadowOpacity: 0.15,
        shadowRadius: 5,
        zIndex: 1000,
    },
    dropdownItem: {
        paddingVertical: 6,
        paddingHorizontal: 10,
    },

    dropdownText: {
        fontSize: 14,
        color: "#000",
        borderBottomWidth: 0.5,
        borderBottomColor: "#eee",
    },
});
