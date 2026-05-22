import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import WebAppImport from '@twa-dev/sdk';
import log from 'loglevel';

const TMAContext = createContext(null);

// Robustly resolve the WebApp object to handle ESM/CJS interop issues in production
const WebApp = WebAppImport?.default || WebAppImport || (typeof window !== 'undefined' ? window.Telegram?.WebApp : null);

// Session storage key for persisting auth across reloads
const AUTH_STORAGE_KEY = 'tma_auth_session';

/**
 * TMAProvider initializes the Telegram WebApp SDK and handles authentication
 * with the backend to receive a Supabase JWT.
 *
 * Auth modes:
 * - 'telegram'  → Opened inside Telegram, auto-authenticated via initData
 * - 'browser'   → Opened in browser, authenticated via Telegram Login Widget
 * - 'guest'     → Unauthenticated, limited offline-only features
 * - 'login'     → Waiting for user to sign in (shows LoginScreen)
 */
export const TMAProvider = ({ children, authEndpoint }) => {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('login'); // 'telegram' | 'browser' | 'guest' | 'login'

  /**
   * Handles Telegram Login Widget OAuth callback.
   * Sends the OAuth data to the backend for validation and JWT generation.
   */
  const loginWithTelegramOAuth = useCallback(async (telegramOAuthData) => {
    try {
      log.info('Attempting Telegram OAuth login...');

      const authUrl = authEndpoint.replace('/telegram', '/telegram-oauth');
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oauthData: telegramOAuthData }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Auth failed with status ${response.status}`);
      }

      const data = await response.json();

      const authUser = {
        ...data.user,
        token: data.token,
      };

      setUser(authUser);
      setMode('browser');

      // Persist to sessionStorage so refreshes don't lose auth
      try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          user: authUser,
          timestamp: Date.now(),
        }));
      } catch (e) {
        log.warn('Failed to persist auth session:', e);
      }

      log.info('Telegram OAuth login successful', { userId: data.user?.id });
    } catch (err) {
      log.error('Telegram OAuth login error:', err);
      throw err;
    }
  }, [authEndpoint]);

  /**
   * Logs the user out and returns to the login screen.
   */
  const logout = useCallback(() => {
    setUser(null);
    setMode('login');
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      log.warn('Failed to clear auth session:', e);
    }
    log.info('User logged out');
  }, []);

  useEffect(() => {
    const initTMA = async () => {
      try {
        // 1. Check for Telegram WebApp context (opened inside Telegram)
        if (WebApp && typeof WebApp.ready === 'function') {
          WebApp.ready();

          if (typeof WebApp.expand === 'function') {
            WebApp.expand();
          }

          const initData = WebApp.initData;
          if (initData) {
            // Validate with backend
            setMode('telegram');
            const response = await fetch(authEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ initData }),
            });

            if (response.ok) {
              const data = await response.json();
              setUser({
                ...data.user,
                token: data.token,
              });
              setIsReady(true);
              return;
            }

            // Auth failed but we're in Telegram — show guest mode
            log.error('TMA Auth failed. Falling back to Guest Mode.');
            setMode('guest');
            setIsReady(true);
            return;
          }
        }

        // 2. Check for existing browser session (e.g. page refresh after OAuth login)
        try {
          const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
          if (stored) {
            const session = JSON.parse(stored);
            const ageMs = Date.now() - (session.timestamp || 0);
            const MAX_AGE_MS = 23 * 60 * 60 * 1000; // 23 hours (token lasts 24h)

            if (session.user && ageMs < MAX_AGE_MS) {
              log.info('Restoring browser auth session');
              setUser(session.user);
              setMode('browser');
              setIsReady(true);
              return;
            }
            // Session expired, clear it
            sessionStorage.removeItem(AUTH_STORAGE_KEY);
          }
        } catch (e) {
          log.warn('Failed to restore auth session:', e);
        }

        // 3. Dev mode: use mock user
        if (import.meta.env.DEV) {
          log.warn('Running outside Telegram (Dev). Using mock user.');
          setUser({ id: 'mock-user-123', first_name: 'DevFarmer', language_code: 'en' });
          setMode('telegram');
          setIsReady(true);
          return;
        }

        // 4. No auth context — show login screen
        log.info('No auth context found. Showing login screen.');
        setMode('login');
        setIsReady(true);
      } catch (err) {
        log.error('TMA Initialization Error:', err);
        setMode('login');
        setIsReady(true);
      }
    };

    initTMA();
  }, [authEndpoint]);

  // Listen for "skip login" event from LoginScreen
  useEffect(() => {
    const handleSkipLogin = () => {
      log.info('User skipped login, entering Guest Mode');
      setMode('guest');
    };

    window.addEventListener('tma-skip-login', handleSkipLogin);
    return () => window.removeEventListener('tma-skip-login', handleSkipLogin);
  }, []);

  return (
    <TMAContext.Provider value={{
      user,
      isReady,
      error,
      mode,
      WebApp,
      loginWithTelegramOAuth,
      logout,
    }}>
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
