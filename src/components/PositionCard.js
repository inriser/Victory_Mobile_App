import React from "react";
import { View, Text, StyleSheet } from "react-native";

const PositionCard = ({
    tradingsymbol,
    exchange,
    producttype,
    buyqty,
    sellqty,
    netqty,
    buyavgprice,
    sellavgprice,
    ltp,
    pnl,
    unrealised,
    realised
}) => {
    const pnlColor = Number(pnl) < 0 ? "red" : "green";

    return (
        <View style={styles.card}>

            {/* HEADER ROW */}
            <View style={styles.headerRow}>
                <Text style={styles.symbol}>{tradingsymbol}</Text>
            </View>

            {/* 3-COL GRID ROWS */}

            {/* Row 1 */}
            <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                    <Text style={styles.label}>Exchange</Text>
                    <Text style={styles.value}>{exchange}</Text>
                </View>

                <View style={styles.gridItem}>
                    <Text style={styles.label}>Product</Text>
                    <Text style={styles.value}>{producttype}</Text>
                </View>

                <View style={styles.gridItem}>
                    <Text style={styles.label}>Buy Qty</Text>
                    <Text style={styles.value}>{buyqty}</Text>
                </View>
            </View>

            {/* Row 2 */}
            <View style={styles.gridRow}>

                <View style={styles.gridItem}>
                    <Text style={styles.label}>Sell Qty</Text>
                    <Text style={styles.value}>{sellqty}</Text>
                </View>

                <View style={styles.gridItem}>
                    <Text style={styles.label}>Net Qty</Text>
                    <Text style={styles.value}>{netqty}</Text>
                </View>
                <View style={styles.gridItem}>
                    <Text style={styles.label}>Buy Avg. Price</Text>
                    <Text style={styles.value}>{buyavgprice}</Text>
                </View>
            </View>

            {/* Row 3 */}
            <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                    <Text style={styles.label}>Sell Avg. Price</Text>
                    <Text style={styles.value}>{sellavgprice}</Text>
                </View>


                <View style={styles.gridItem}>
                    <Text style={styles.label}>LTP</Text>
                    <Text style={styles.value}>{ltp}</Text>
                </View>
                <View style={styles.gridItem}>
                    <Text style={styles.label}>PNL</Text>
                    <Text style={[styles.value, { color: pnlColor }]}>
                        {pnl}
                    </Text>
                </View>
            </View>
            <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                    <Text style={styles.label}>Unrealised</Text>
                    <Text style={styles.value}>{unrealised}</Text>
                </View>
                <View style={styles.gridItem}>
                    <Text style={styles.label}>Realised</Text>
                    <Text style={styles.value}>{realised}</Text>
                </View>
            </View>

        </View>
    );
};

export default PositionCard;


const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: "#DDD",
        marginHorizontal: 20,
        marginTop: 10,
    },

    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },

    symbol: {
        fontSize: 16,
        fontWeight: "700",
        color: "#000",
        flex: 1,
    },

    typeTag: {
        flexDirection: "row",
        alignItems: "center",
    },

    typeDot: {
        width: 10,
        height: 10,
        borderRadius: 50,
        marginRight: 6,
    },

    typeText: {
        fontSize: 14,
        fontWeight: "700",
        textTransform: "uppercase",
    },

    gridRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },

    gridItem: {
        width: "25%",
    },

    gridItem2: {
        width: "50%",
    },

    label: {
        fontSize: 11,
        color: "#777",
    },

    value: {
        fontSize: 13,
        fontWeight: "600",
        color: "#000",
        marginTop: 2,
    },
});
