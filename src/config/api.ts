import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_MARKET99_API_URL = 'https://api.market99pos.com/api';

const CUSTOM_API_URL_KEY = '@app_custom_api_url';

export const getDefaultApiUrl = (): string => {
  return DEFAULT_MARKET99_API_URL;
};

export const getApiBaseUrl = async (): Promise<string> => {
  try {
    const customUrl = await AsyncStorage.getItem(CUSTOM_API_URL_KEY);
    if (customUrl) {
      return customUrl;
    }
  } catch (error) {
    console.error('Error fetching custom API URL:', error);
  }
  return getDefaultApiUrl();
};

export const setCustomApiUrl = async (url: string): Promise<void> => {
  try {
    if (!url || url.trim() === '') {
      await AsyncStorage.removeItem(CUSTOM_API_URL_KEY);
    } else {
      await AsyncStorage.setItem(CUSTOM_API_URL_KEY, url.trim());
    }
  } catch (error) {
    console.error('Error setting custom API URL:', error);
  }
};
