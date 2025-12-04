import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";

export const getDeviceId = async () => {
  try {
    // 1️⃣ Already saved?
    const existingId = await AsyncStorage.getItem("device_id");
    if (existingId) return existingId;

    // 2️⃣ Generate unique string
    const baseString = `${Device.modelName}-${Device.osBuildId}-${Date.now()}`;

    // 3️⃣ SHA256 Hash (more secure)
    const newId = Crypto.randomUUID
      ? Crypto.randomUUID()
      : await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        baseString
      );

    // 4️⃣ Save permanently
    await AsyncStorage.setItem("device_id", newId);

    return newId;
  } catch (e) {
    console.log("Device ID error:", e);
    return "unknown-device";
  }
};