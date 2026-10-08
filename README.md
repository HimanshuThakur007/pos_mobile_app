# Mobile App - Cross-Platform React Native (Android & macOS)

This is the mobile client application built with **React Native** and **Expo** in TypeScript, designed to run cross-platform on **Android** and **macOS** (via iOS Simulator, Mac Catalyst, or Web preview).

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- For Android: Android Studio & Android Virtual Device (AVD) emulator, or Expo Go app on a physical device.
- For macOS: Xcode (for iOS Simulator / Mac Catalyst) or any Web browser.

### 1. Installation
Navigate into the mobile directory:
```bash
cd mobile
npm install
```

### 2. Running on macOS
- **Web Desktop (macOS)**:
  ```bash
  npm run web
  ```
- **iOS Simulator (macOS)**:
  ```bash
  npm run ios
  ```

### 3. Running on Android
- **Android Emulator / Device**:
  ```bash
  npm run android
  ```
  *Note: Android automatically maps host `localhost:5000` to `http://10.0.2.2:5000/api`.*

### 4. General Development Server
To launch the interactive Expo CLI menu:
```bash
npm run start
```

---

## 📱 Features Included
- **Auth System**: Login screen with pre-configured Quick Demo roles (Admin, Manager, Cashier) and `AsyncStorage` token persistence.
- **Dashboard**: Live KPI statistics, system status matrix, and real-time POS transaction feed.
- **Analytics**: Performance breakdown by store, timeframe switcher, and peak hourly sales matrix.
- **User Directory**: Searchable team member directory with role badges and active status indicators.
- **Settings**: Dynamic API URL configuration (`localhost` vs `10.0.2.2`), platform details, and account management.
