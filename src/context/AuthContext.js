import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const TOKENS = {
  AUTH_TOKEN: "@angelone_auth_token",
  FEED_TOKEN: "@angelone_feed_token",
  REFRESH_TOKEN: "@angelone_refresh_token",
  CLIENT_ID: "@angelone_client_id",
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [feedToken, setFeedToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [clientId, setClientId] = useState(null);

  const [loading, setLoading] = useState(true);

  const loadTokens = async () => {
    try {
      const a = await AsyncStorage.getItem(TOKENS.AUTH_TOKEN);
      const f = await AsyncStorage.getItem(TOKENS.FEED_TOKEN);
      const r = await AsyncStorage.getItem(TOKENS.REFRESH_TOKEN);
      const c = await AsyncStorage.getItem(TOKENS.CLIENT_ID);

      setAuthToken(a);
      setFeedToken(f);
      setRefreshToken(r);
      setClientId(c);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, []);

  const setAuthData = async ({ authToken, feedToken, refreshToken, clientId }) => {
    if (authToken) {
      await AsyncStorage.setItem(TOKENS.AUTH_TOKEN, authToken.toString());
      setAuthToken(authToken.toString());
    }
    if (feedToken) {
      await AsyncStorage.setItem(TOKENS.FEED_TOKEN, feedToken.toString());
      setFeedToken(feedToken.toString());
    }
    if (refreshToken) {
      await AsyncStorage.setItem(TOKENS.REFRESH_TOKEN, refreshToken.toString());
      setRefreshToken(refreshToken.toString());
    }
    if (clientId) {
      await AsyncStorage.setItem(TOKENS.CLIENT_ID, clientId.toString());
      setClientId(clientId.toString());
    }
  };

  const clearAuth = async () => {
    await AsyncStorage.removeItem(TOKENS.AUTH_TOKEN);
    await AsyncStorage.removeItem(TOKENS.FEED_TOKEN);
    await AsyncStorage.removeItem(TOKENS.REFRESH_TOKEN);
    await AsyncStorage.removeItem(TOKENS.CLIENT_ID);

    setAuthToken(null);
    setFeedToken(null);
    setRefreshToken(null);
    setClientId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        authToken,
        feedToken,
        refreshToken,
        clientId,
        loading,
        setAuthData,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);