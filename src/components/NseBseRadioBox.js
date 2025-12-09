import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const NseBseRadioBox = ({
  selected = "NSE",
  nseLtp = "₹590.45",
  bseLtp = "₹590.90",
  onSelect,
}) => {
  return (
    <View style={styles.container}>
      {/* 🔵 NSE */}
      <TouchableOpacity
        style={[
          styles.option,
          selected === "NSE" && styles.optionActive,
        ]}
        activeOpacity={0.8}
        onPress={() => onSelect("NSE")}
      >
        <View style={styles.radioContainer}>
          <Ionicons
            name={
              selected === "NSE" ? "radio-button-on" : "radio-button-off"
            }
            size={16}
            color="#210F47"
          />
          <Text
            style={[
              styles.text,
              selected === "NSE" && styles.textActive,
            ]}
          >
            NSE {nseLtp}
          </Text>
        </View>
      </TouchableOpacity>

      {/* ⚪ BSE */}
      <TouchableOpacity
        style={[
          styles.option,
          selected === "BSE" && styles.optionActive,
        ]}
        activeOpacity={0.8}
        onPress={() => onSelect("BSE")}
      >
        <View style={styles.radioContainer}>
          <Ionicons
            name={
              selected === "BSE" ? "radio-button-on" : "radio-button-off"
            }
            size={16}
            color="#210F47"
          />
          <Text
            style={[
              styles.text,
              selected === "BSE" && styles.textActive,
            ]}
          >
            BSE {bseLtp}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginHorizontal: 6,
    backgroundColor: "#fff",
  },
  optionActive: {
    backgroundColor: "#f5f0fa",
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  radioContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    color: "#210F47",
    fontWeight: "500",
    fontSize: 13,
    marginLeft: 6,
  },
  textActive: {
    fontWeight: "600",
  },
});

export default NseBseRadioBox;
