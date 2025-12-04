import React, { useState, useEffect, useRef } from "react";
import { Image, View, StyleSheet, ScrollView, Text, TouchableOpacity, Modal } from "react-native";
import { WebView } from "react-native-webview";
import { useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import SwipeButton from "rn-swipe-button";
import { apiUrl } from '../utils/apiUrl';
import TopOrderHeader from "../components/TopOrderHeader";
import NseBseRadioBox from "../components/NseBseRadioBox";
import OrderTopMenu from "../components/OrderTopMenu";
import OrderInputBox from "../components/OrderInputBox";
// import OrderDropdownBox from "../components/OrderDropdownBox";
import { getDeviceId } from "../utils/deviceId";
import { useAuth } from '../context/AuthContext';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TradeOrderScreen({ navigation }) {
  const { authToken } = useAuth();
  const { setAuthData } = useAuth();

  const handleAngelOneNavigation = async (navState) => {
    const { url } = navState;

    if (url.includes("auth_token") && url.includes("feed_token")) {
      try {
        const urlObj = new URL(url);
        const auth_token = urlObj.searchParams.get("auth_token");
        const feed_token = urlObj.searchParams.get("feed_token");
        const refresh_token = urlObj.searchParams.get("refresh_token");

        // Save in AuthContext
        await setAuthData({
          authToken: auth_token,
          feedToken: feed_token,
          refreshToken: refresh_token,
        });

        // Close modal
        setShowAngelOneModal(false);

        // Force refresh of page → triggers new token usage
        setSwipeKey(Date.now());

        alert("✔ Angel One login successful");
      } catch (e) {
        console.log("Token parse error:", e);
      }
    }
  };

  const [showAngelOneModal, setShowAngelOneModal] = useState(false);

  const angelOneUrl =
    "https://smartapi.angelone.in/publisher-login?api_key=IG8g0BMf&state=tradepage";

  const handleUserPriceInput = (val) => {
    setIsUserTypedPrice(true);
    setUserTypedTime(Date.now());
    setPrice(val);
  };
  const [isPriceValid, setIsPriceValid] = useState(true);
  const [isQtyValid, setIsQtyValid] = useState(true);
  const [isTargetValid, setIsTargetValid] = useState(true);
  const [isStopLossValid, setIsStopLossValid] = useState(true);

  // ⭐ Map incoming producttype → valid segment
  const mapProductTypeToSegment = (type) => {
    if (!type) return "INTRADAY";

    const t = type.toString().trim().toUpperCase();

    if (["INTRADAY", "MIS"].includes(t)) return "INTRADAY";
    if (["DELIVERY", "CNC"].includes(t)) return "DELIVERY";
    if (["MARGIN", "NRML"].includes(t)) return "MARGIN";

    return "INTRADAY";
  };

  const route = useRoute();
  const { symbol: passedSymbol, token: passedToken, name: passedName, price: passedPrice, quantity: passedQuantity, stoploss: passedStopLoss, target: passedTarget, producttype: passedProductType, internaltype = internaltype, orderid: passedOrderId } = route.params || {};
  const swipeRef = useRef(null);
  const [selectedMenu, setSelectedMenu] = useState("Intraday");

  const [selected, setSelected] = useState("NSE");
  const [segment, setSegment] = useState("INTRADAY");

  const [selectedSegmentType, setSelectedSegmentType] = useState("");
  const [nseLtp, setNseLtp] = useState("0.00");
  const [bseLtp, setBseLtp] = useState("0.00");
  const format2 = (num) => {
    return parseFloat(num || 0).toFixed(2);
  };
  const format4 = (num) => {
    return parseFloat(num || 0).toFixed(4);
  };

  const [price, setPrice] = useState("0");
  const [qty, setQty] = useState("1");
  const [taxes, setTaxes] = useState("0");
  const [isUserTypedPrice, setIsUserTypedPrice] = useState(false);
  const [userTypedTime, setUserTypedTime] = useState(null);

  const [balance, setBalance] = useState("0");
  const [orderValue, setOrderValue] = useState("0");

  const [brokerage, setBrokerage] = useState("0");
  const [charges, setCharges] = useState("0");

  const [closingBalance, setClosingBalance] = useState("0");
  const [isOrderValid, setIsOrderValid] = useState(false);
  const [target, setTarget] = useState("0");
  const [stopLoss, setStopLoss] = useState("0");
  const [swipeKey, setSwipeKey] = useState(Date.now());

  const symbol = passedSymbol || "WELENT-EQ";
  const fetchBrokerage = async () => {
    try {
      const symbolToken = passedToken || "";
      const url = `${apiUrl}/api/brokerage/calculate?price=${price}&quantity=${qty}&segment=${segment}&symbol=${symbol}&symboltoken=${symbolToken}&exchange=${selected}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + authToken,
          Accept: "application/json",
        },
      });
      const data = await res.json();
      if (data.success) {
        setBrokerage(data.angelOneBrokerage);
        setCharges(data.externalCharges);
        setTaxes(data.taxes);
      }
    } catch (err) {
      console.log("Brokerage Error:", err.message);
    }
  };

  useEffect(() => {
    const p = parseFloat(price);
    const q = parseInt(qty);
    const tg = parseFloat(target);
    const sl = parseFloat(stopLoss);

    const ltp = parseFloat(
      selected === "NSE"
        ? nseLtp.replace("₹", "")
        : bseLtp.replace("₹", "")
    );

    setIsPriceValid(p > 0);
    setIsQtyValid(q > 0);
    setIsTargetValid(tg === 0 || tg > ltp);
    setIsStopLossValid(sl === 0 || sl < ltp);

  }, [price, qty, target, stopLoss, nseLtp, bseLtp]);


  // BROKERAGE AUTO UPDATE
  useEffect(() => {
    if (price && qty) {
      fetchBrokerage();
    }
  }, [price, qty, segment, selected]);

  // -------------------------
  // 🔢 ORDER VALUE + Closing balance
  // -------------------------
  useEffect(() => {
    const p = parseFloat(price) || 0;
    const q = parseInt(qty) || 0;

    const ov = p * q;
    setOrderValue(ov);
    const cb =
      balance - (ov - brokerage - taxes - charges);

    setClosingBalance(cb);


  }, [price, qty, balance, brokerage, charges, taxes]);

  const modifyOrder = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const deviceId = await getDeviceId();

      const payload = {
        variety: "NORMAL",
        orderid: passedOrderId,        // ⭐ REQUIRED
        tradingsymbol: symbol,         // e.g., SBIN-EQ
        symboltoken: passedToken,      // e.g., 3045
        exchange: selected,            // NSE / BSE
        ordertype: "LIMIT",            // only LIMIT supported for modify
        producttype: segment,          // INTRADAY / DELIVERY / MARGIN
        duration: "DAY",
        transactiontype: "BUY",
        squareoff: 0,
        stoploss: stopLoss || 0,
        script: symbol,
        price: String(price),          // STRING recommended
        quantity: String(qty)          // STRING recommended
      };

      const res = await fetch(`${apiUrl}/api/order/modify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + authToken,
          userid: userId,
          device_mac: deviceId,
          internaltype: internaltype,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        alert("Order Modified Successfully");
        navigation.navigate("OrdersScreen", { defaultTab: 2 });
      } else {
        alert(data.message || "Failed to modify order");
      }
    } catch (err) {
      alert("ERROR: " + err.message);
    }
  };

  const placeOrder = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      const deviceId = await getDeviceId();  // your device MAC/unique ID

      const payload = {
        variety: "NORMAL",
        tradingsymbol: symbol,         // e.g., "SBIN-EQ"
        symboltoken: passedToken,      // e.g., "3045"
        transactiontype: "BUY",
        exchange: selected,            // NSE / BSE
        ordertype: "LIMIT",            // MARKET / LIMIT
        producttype: segment,          // INTRADAY / DELIVERY
        duration: "DAY",
        price: parseFloat(price),          // string is recommended
        squareoff: "0",
        stoploss: parseFloat(stopLoss || 0),
        quantity: parseFloat(qty),
        scripconsent: "yes"
      };

      const res = await fetch(`${apiUrl}/api/order/place`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + authToken,
          "userid": userId,
          "device_mac": deviceId,
          "internaltype": internaltype,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.angelResponse?.message === "SUCCESS") {
        alert("Order Placed Successfully.");
        navigation.navigate('OrdersScreen', { defaultTab: 2 });
      } else {
        alert(JSON.stringify(data));
      }
    } catch (err) {
      alert("ERROR: " + err.message);
    }
  };

  useEffect(() => {
    if (!isUserTypedPrice) return;

    const timer = setTimeout(() => {
      setIsUserTypedPrice(false);  // Allow LTP auto update again
    }, 3000);

    return () => clearTimeout(timer);
  }, [isUserTypedPrice]);


  // -------------------------
  // 🔄 FETCH LTP
  // -------------------------
  const fetchLtp = async () => {
    try {
      // If user typed recently (within 1 minute), don't overwrite price
      if (isUserTypedPrice && userTypedTime && Date.now() - userTypedTime < 60000) {
        return; // Do NOT update price from LTP
      }

      const ex = selected;
      const res = await fetch(
        `${apiUrl}/api/buyshare/search?symbol=${symbol}&exchange=${ex}`,
        {
          headers: {
            Authorization: "Bearer " + authToken,
          },
        }
      );
      const data = await res.json();

      if (data.success) {
        const ltp = parseFloat(data.ltp || 0).toFixed(2);

        if (ex === "NSE") setNseLtp(`₹${ltp}`);
        else setBseLtp(`₹${ltp}`);

      }
    } catch (err) {
      console.log("LTP Error:", err.message);
    }
  };

  useEffect(() => {
    fetchLtp();
    const t = setInterval(fetchLtp, 3000);
    return () => clearInterval(t);
  }, [selected, symbol]);

  // Autofill passed values when screen loads
  useEffect(() => {
    if (passedPrice) setPrice(String(passedPrice));
    if (passedQuantity) setQty(String(passedQuantity));
    if (passedTarget) setTarget(String(passedTarget));
    if (passedStopLoss) setStopLoss(String(passedStopLoss));

    if (passedProductType) {
      const mappedSeg = mapProductTypeToSegment(passedProductType);
      setSegment(mappedSeg);

      // ⭐ UI menu ke liye human readable text
      if (mappedSeg === "INTRADAY") setSelectedMenu("Intraday");
      else if (mappedSeg === "DELIVERY") setSelectedMenu("Delivery");
      else if (mappedSeg === "MARGIN") setSelectedMenu("Margin");
    }


    // Prevent LTP from overriding the initial price immediately
    if (passedPrice) {
      setIsUserTypedPrice(true);
      setUserTypedTime(Date.now());
    }
  }, []);

  const fetchFunds = async (segmentType) => {
    setSelectedSegmentType(segmentType);
    try {
      const res = await fetch(
        `${apiUrl}/api/fundandmargin/get?segment=${segmentType}`,
        {
          headers: {
            Authorization: "Bearer " + authToken,
          },
        }
      );

      const data = await res.json();
      if (data.success) {
        setBalance(data.amountAvail || "0");
      }
    } catch (err) {
      console.log("Fund API error:", err.message);
    }
  };

  useEffect(() => {
    fetchFunds(segment);
  }, [segment]);
  // const handleSwipe = () => {
  //   alert("✔ Order Placed!");
  // };
  const menuItems = [
    { id: 1, name: "Intraday" },
    { id: 2, name: "Margin" },
    { id: 3, name: "Delivery" },
  ];

  const handleSegmentChange = (name) => {
    const map = {
      Intraday: "INTRADAY",
      Margin: "MARGIN",
      Delivery: "DELIVERY",
    };
    setSegment(map[name]);
  };
  const validateOrder = () => {
    const p = parseFloat(price || 0);
    const q = parseInt(qty || 0);
    const tg = parseFloat(target || 0);
    const sl = parseFloat(stopLoss || 0);

    const ltp = parseFloat(
      selected === "NSE"
        ? nseLtp.replace("₹", "")
        : bseLtp.replace("₹", "")
    ) || 0;

    const br = parseFloat(brokerage || 0);
    const ch = parseFloat(charges || 0);
    const tx = parseFloat(taxes || 0);
    const bal = parseFloat(balance || 0);

    // 1) Quantity > 0
    if (q <= 0) return false;

    // 2) Total cost must not exceed balance
    const totalCost = p * q + br + ch + tx;
    if (totalCost > bal) return false;

    // 3) Target validation (if placed)
    if (tg > 0 && tg < ltp) return false;

    // 4) Stop loss validation (if placed)
    if (sl > 0 && sl > ltp) return false;

    return true;
  };

  const combinedCharges =
    parseFloat(charges || 0) + parseFloat(taxes || 0);

  useEffect(() => {
    setIsOrderValid(validateOrder());
  }, [price, qty, target, stopLoss, balance, brokerage, charges, taxes]);
  const isModifyMode = internaltype?.toLowerCase() === "modify";
  return (
    <SafeAreaView edges={['left', 'top']} style={styles.container}>
      <TopOrderHeader
        title={symbol}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.radioContainer}>
          <NseBseRadioBox
            selected={selected}
            nseLtp={nseLtp}
            bseLtp={bseLtp}
            onSelect={setSelected}
          />
        </View>

        <View style={styles.menuContainer}>
          {/* <OrderTopMenu
            items={menuItems}
            defaultSelected="Intraday"
            onSelect={handleSegmentChange}
          /> */}
          <OrderTopMenu
            items={menuItems}
            defaultSelected={selectedMenu}   // ⭐ now fully controlled
            onSelect={(name) => {
              setSelectedMenu(name);        // UI highlight
              handleSegmentChange(name);    // backend / logic mapping
            }}
          />

        </View>

        <View style={styles.inputsWrapper}>
          <OrderInputBox
            label="Price"
            value={price}
            onChange={handleUserPriceInput}
            isValid={isPriceValid}
          />

          <OrderInputBox
            label="Quantity"
            value={qty}
            onChange={setQty}
            isValid={isQtyValid}
          />

          <OrderInputBox
            label="Target"
            value={target}
            onChange={setTarget}
            isValid={isTargetValid}
            editable={!isModifyMode}
          />

          <OrderInputBox
            label="Stop Loss"
            value={stopLoss}
            onChange={setStopLoss}
            isValid={isStopLossValid}
            editable={!isModifyMode}
          />

          {/* <Text>{internaltype}</Text> */}

          {/* <OrderDropdownBox
            label="Order Type"
            options={["Market", "Limit", "SL_Limit", "SL_Market"]}
            zIndex={3000}
            zIndexInverse={2000}
          />

          <OrderDropdownBox
            label="Variety"
            options={["Normal", "StopLoss", "Robo"]}
            zIndex={2000}
            zIndexInverse={1000}
          /> */}

        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>

        <View style={styles.summaryContainer}>
          <View style={styles.row}>
            <Text style={styles.label}>Balance available</Text>
            <Text style={styles.value}>₹{format4(balance)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Order value</Text>
            <Text style={styles.value}>₹{format2(orderValue)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Brokerage</Text>
            <Text style={styles.value}>₹{format2(brokerage)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Charges</Text>
            <Text style={styles.value}>
              ₹{format2(combinedCharges)}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Closing balance</Text>
            <Text style={styles.value}>₹{format2(closingBalance)}</Text>
          </View>
          <Ionicons
            name="refresh"
            size={20}
            color="#210f47"
            style={styles.refreshIcon}
            onPress={() => {
              fetchFunds(selectedSegmentType);
              fetchLtp();
              fetchBrokerage();
            }}
          />
        </View>
        {/* SWIPE BUTTON */}
        <View style={{ position: "relative", width: "100%" }}>
          <SwipeButton
            key={swipeKey}
            disabled={false}
            title="Swipe right to buy >>"
            titleColor="#210f47"
            titleFontSize={14}
            railBackgroundColor="#ffffff"
            railFillBackgroundColor="#ffffff"
            thumbIconBackgroundColor="#4CAF50"
            thumbIconBorderColor="transparent"
            railFillBorderColor="transparent"
            disabledThumbIconBackgroundColor="#4CAF50"
            disabledRailBackgroundColor="#ffffff"
            containerStyles={{
              borderRadius: 25,
              height: 52,
              width: "100%",
              backgroundColor: "#ffffff",
            }}

            thumbIconComponent={() => (
              <Text style={{ color: "#fff", fontWeight: "700" }}>Buy</Text>
            )}
            onSwipeSuccess={() => {
              if (!authToken) {
                setShowAngelOneModal(true);
                setSwipeKey(Date.now());
                return;
              }
              if (!isOrderValid) {
                alert("⚠ Fix order conditions");
                setSwipeKey(Date.now());
                return;
              }
              // placeOrder();
              if (internaltype?.toLowerCase() === "modify") {
                modifyOrder();
              } else {
                placeOrder();
              }
              setSwipeKey(Date.now());
            }}
          />

          <TouchableOpacity
            onPress={() => setShowAngelOneModal(true)}
            style={{
              position: "absolute",
              right: 12,
              top: 14,
              zIndex: 10,
            }}
          >
            <Image
              source={require("../../assets/angelone.png")}
              style={{
                width: 35,
                height: 35,
                resizeMode: "contain",
              }}
            />
          </TouchableOpacity>

        </View>
      </View>
      {/* ⭐ AngelOne Login Modal */}
      {/* ⭐ AngelOne Login Modal */}
      <Modal
        visible={showAngelOneModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowAngelOneModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#fff" }}>

          <TouchableOpacity
            style={{
              position: "absolute",
              top: 40,
              right: 20,
              zIndex: 999,
              backgroundColor: "#eee",
              width: 36,
              height: 36,
              borderRadius: 18,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => setShowAngelOneModal(false)}
          >
            <Text style={{ fontSize: 18 }}>✕</Text>
          </TouchableOpacity>

          <WebView
            source={{
              uri:
                "https://smartapi.angelone.in/publisher-login?api_key=IG8g0BMf&state=tradeorder",
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            useWebKit={true}
            onNavigationStateChange={handleAngelOneNavigation}
          />
        </View>
      </Modal>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", },
  scrollContent: { alignItems: "center", paddingBottom: 160 },
  radioContainer: { marginTop: 10 },
  menuContainer: { width: "100%", marginTop: 10 },
  inputsWrapper: { marginTop: 10 },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
  },
  summaryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
    gap: 10,
  },
  row: { width: "30%", marginBottom: 4 },
  label: { fontSize: 12, color: "#555" },
  value: { fontSize: 13, fontWeight: "600", color: "#000" },
});
