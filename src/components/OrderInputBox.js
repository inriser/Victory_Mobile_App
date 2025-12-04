import React from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const OrderInputBox = ({
    label = "Price",
    value,
    onChange,
    isValid = true,
    editable = true,   // ⭐ NEW: Add editable prop
}) => {
    return (
        <View style={styles.container}>
            {/* Left Side: Label */}
            <View style={styles.labelBox}>
                <Text style={styles.labelText}>{label}</Text>
            </View>

            {/* Right Side: Input + Tick */}
            <View
                style={[
                    styles.valueBox,
                    !editable && styles.disabledBox,  // ⭐ disabled styling
                ]}
            >
                <TextInput
                    style={[
                        styles.input,
                        !editable && styles.disabledText  // ⭐ grey text
                    ]}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    placeholder="0"
                    editable={editable}       // ⭐ Main control here
                    placeholderTextColor="#777"
                />

                {value !== "" && (
                    isValid ? (
                        <Ionicons name="checkmark-circle" size={20} color="green" />
                    ) : (
                        <Ionicons name="alert-circle" size={20} color="#ffcc00" />
                    )
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 20,
        marginVertical: 5,
    },

    labelBox: {
        backgroundColor: "#f2ebf7",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 14,
        width: 150,
        marginRight: 10,
    },

    labelText: {
        color: "#210f47",
        fontSize: 14,
        fontWeight: "600",
    },

    valueBox: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        width: 150,
    },

    input: {
        flex: 1,
        fontSize: 14,
        fontWeight: "500",
        color: "#000",
        padding: 0,
        margin: 0,
    },

    disabledBox: {
        backgroundColor: "#f0f0f0",
        borderColor: "#d0d0d0",
    },

    disabledText: {
        color: "#999",
    },
});

export default OrderInputBox;
