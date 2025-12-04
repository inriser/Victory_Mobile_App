// src/utils/angelOneTokens.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_TOKEN: '@angelone_auth_token',
  FEED_TOKEN: '@angelone_feed_token',
  REFRESH_TOKEN: '@angelone_refresh_token',
  CLIENT_ID: '@angelone_client_id',
};

export const getAngelOneTokens = async () => {
  try {
    const [auth, feed, refresh, clientId] = await Promise.all([
      AsyncStorage.getItem(KEYS.AUTH_TOKEN),
      AsyncStorage.getItem(KEYS.FEED_TOKEN),
      AsyncStorage.getItem(KEYS.REFRESH_TOKEN),
      AsyncStorage.getItem(KEYS.CLIENT_ID),
    ]);
    return {
      authToken: auth,
      feedToken: feed,
      refreshToken: refresh,
      clientId,
      isAuthenticated: !!auth && !!feed,
    };
  } catch (e) {
    console.error('Token retrieval failed', e);
    return { authToken: null, feedToken: null, refreshToken: null, clientId: null, isAuthenticated: false };
  }
};

export const clearAngelOneTokens = async () => {
  await AsyncStorage.multiRemove(Object.values(KEYS));
};