import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { GlobalFilterProvider } from './src/context/GlobalFilterContext';
import { OfflineNotice } from './src/components/OfflineNotice';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NetworkProvider>
          <AuthProvider>
            <GlobalFilterProvider>
              <NavigationContainer>
                <StatusBar style="auto" />
                <OfflineNotice />
                <RootNavigator />
              </NavigationContainer>
            </GlobalFilterProvider>
          </AuthProvider>
        </NetworkProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

