import axios from 'axios';

// Default axios instance for React Native / Expo.
// For Android emulator use 10.0.2.2 to reach host localhost.
// When testing on a real device, change baseURL to your machine IP (e.g. http://192.168.1.42:5000/api)
const api = axios.create({
  baseURL: 'http://10.0.2.2:5000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

export default api;
