import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  // SafeAreaView,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from '@react-navigation/native';
import TopMenuSlider from '../components/TopMenuSlider'; // Adjust the path as needed
import TopHeader from '../components/TopHeader';
import { useAuth } from '../context/AuthContext';
import BottomTabBar from '../components/BottomTabBar';

export default function HomeScreen({ navigation }) {
  const route = useRoute();
  const { clientId, authToken, feedToken, refreshToken } = useAuth();
  console.log("authToken", authToken);
  console.log("feedToken", feedToken);
  return (
    <>
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: "#fff" }}>
        <TopHeader />
        <TopMenuSlider currentRoute={route.name} />
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to 1Trade!</Text>

          <Text style={styles.subtitle}>
            You’re successfully logged in. Start managing your portfolio,
            checking market updates, or tracking your DEMAT account.
          </Text>
        </View>

      </SafeAreaView>
      <BottomTabBar />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' }, // Removed justifyContent: 'center'
  content: {
    flex: 1, // Add flex: 1 to take remaining space
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 250, // Add some padding from the top menu
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2F0079',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#444',
    marginBottom: 30,
    lineHeight: 22,
  },

  // 🟢 Trade Order Button Styles
  tradeBtn: {
    backgroundColor: '#007bff',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginBottom: 15,
  },
  tradeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  logoutBtn: {
    backgroundColor: '#2F0079',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  learningBtn: { // Added separate style for learning button
    backgroundColor: '#28a745', // Green color for learning
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginBottom: 15,
  },
});
