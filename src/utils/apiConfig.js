import { Platform } from 'react-native';

// Use 10.0.2.2 instead of localhost for Android Emulator
export const isAndroid = Platform.OS === 'android';
export const LOCAL_API_URL = isAndroid 
  ? 'http://10.0.2.2:11434/v1/chat/completions' // Android Emulator
  : 'http://localhost:8000/v1/chat/completions'; // iOS Simulator or dev machine