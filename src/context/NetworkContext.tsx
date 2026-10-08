import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

interface NetworkContextType {
  isOnline: boolean;
  isChecking: boolean;
  checkConnection: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  isChecking: false,
  checkConnection: async () => true,
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);

    // If Web navigator.onLine is false, immediately report offline
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      setIsChecking(false);
      return false;
    }

    try {
      // 3.5s timeout ping
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      }).catch(async () => {
        // Fallback ping to 1.1.1.1
        const fallbackCtrl = new AbortController();
        const fbTimeout = setTimeout(() => fallbackCtrl.abort(), 2500);
        return await fetch('https://1.1.1.1', {
          method: 'HEAD',
          cache: 'no-store',
          signal: fallbackCtrl.signal,
        }).finally(() => clearTimeout(fbTimeout));
      });

      clearTimeout(timeoutId);

      const online = response ? (response.ok || response.status < 500) : false;
      setIsOnline(online);
      setIsChecking(false);
      return online;
    } catch {
      setIsOnline(false);
      setIsChecking(false);
      return false;
    }
  }, []);

  useEffect(() => {
    // Initial check on mount
    checkConnection();

    // Event listeners for Web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => {
        setIsOnline(true);
        checkConnection();
      };
      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // Periodic check every 15 seconds
    const interval = setInterval(() => {
      checkConnection();
    }, 15000);

    return () => clearInterval(interval);
  }, [checkConnection]);

  return (
    <NetworkContext.Provider value={{ isOnline, isChecking, checkConnection }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
