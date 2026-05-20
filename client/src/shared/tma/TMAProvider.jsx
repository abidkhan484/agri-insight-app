import React, { createContext, useContext, useEffect, useState } from 'react';
import WebAppImport from '@twa-dev/sdk';
import log from 'loglevel';

const TMAContext = createContext(null);

// Robustly resolve the WebApp object to handle ESM/CJS interop issues in production
const WebApp = WebAppImport?.default || WebAppImport || (typeof window !== 'undefined' ? window.Telegram?.WebApp : null);

/**
 * TMAProvider initializes the Telegram WebApp SDK and handles authentication
 * with the backend to receive a Supabase JWT.
 */
export const TMAProvider = ({ children, authEndpoint }) => {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initTMA = async () => {
      try {
        if (!WebApp) {
          throw new Error('Telegram WebApp SDK not found');
        }

        // 1. Initialize Telegram SDK
        if (typeof WebApp.ready === 'function') {
          WebApp.ready();
        }
        if (typeof WebApp.expand === 'function') {
          WebApp.expand();
        }

        const initData = WebApp.initData;
        if (!initData) {
          if (import.meta.env.DEV) {
            log.warn('Running outside Telegram. Using mock user for development.');
            setUser({ id: 'mock-user-123', first_name: 'DevFarmer', language_code: 'en' });
            setIsReady(true);
            return;
          }
          throw new Error('This app must be run inside Telegram');
        }

        // 2. Validate with Backend and get Supabase JWT
        const response = await fetch(authEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData })
        });

        if (!response.ok) {
          throw new Error('Authentication failed');
        }

        const data = await response.json();
        
        // 3. Set Global User Context
        setUser({
          ...data.user,
          token: data.token
        });
      } catch (err) {
        log.error('TMA Initialization Error:', err);
        setError(err.message);
      } finally {
        setIsReady(true);
      }
    };

    initTMA();
  }, [authEndpoint]);

  return (
    <TMAContext.Provider value={{ user, isReady, error, WebApp }}>
      {children}
    </TMAContext.Provider>
  );
};

export const useTMA = () => {
  const context = useContext(TMAContext);
  if (!context) {
    throw new Error('useTMA must be used within a TMAProvider');
  }
  return context;
};
