# Synapse - Expo app (APP folder)

This folder has been converted into an Expo-managed React Native project so you can run it on your device using Expo Go.

Quick start

1. Install dependencies (from Windows CMD or PowerShell):

```powershell
cd C:\Users\USUARIO\PROYECTO_SYNAPSE\APP
npm install
```

2. Start the Expo dev server:

```powershell
npx expo start
```

3. Open Expo Go on your phone and scan the QR code shown in the terminal.

Notes
- The default API baseUrl in `src/services/api.js` is `http://10.0.2.2:5000/api` (works for Android emulator). If you test on a physical device, change it to your machine IP (for example `http://192.168.1.42:5000/api`).
- The original web project was backed up to `package.web.json` in this folder in case you want to restore it.

If you want, I can add React Navigation, extra styling, or wire more screens to match the web UI exactly.
