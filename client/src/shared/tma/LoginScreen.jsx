import React, { useEffect, useRef, useState } from 'react';
import { useTMA } from './TMAProvider';
import log from 'loglevel';
import './LoginScreen.css';

/**
 * LoginScreen renders a Telegram Login Widget for users accessing
 * the PWA outside Telegram. This allows browser-based authentication
 * using Telegram OAuth.
 */
export const LoginScreen = () => {
  const { loginWithTelegramOAuth, mode } = useTMA();
  const widgetRef = useRef(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const botName = import.meta.env.VITE_BOT_USERNAME || 'zbnf_farming_bot';

  useEffect(() => {
    if (mode !== 'login' || !widgetRef.current) return;

    // Clean up any previous widget
    widgetRef.current.innerHTML = '';

    // The Telegram Login Widget callback
    window.__onTelegramAuth = async (telegramUser) => {
      log.info('Telegram OAuth callback received');
      setLoginError(null);
      try {
        await loginWithTelegramOAuth(telegramUser);
      } catch (err) {
        log.error('Telegram OAuth login failed:', err);
        setLoginError('লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন। (Login failed. Please try again.)');
      }
    };

    // Create the Telegram Login Widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-onauth', '__onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.onload = () => setWidgetLoaded(true);
    script.onerror = () => {
      log.error('Failed to load Telegram Login Widget script');
      setWidgetLoaded(true); // Mark as loaded to show fallback
    };

    widgetRef.current.appendChild(script);

    return () => {
      delete window.__onTelegramAuth;
    };
  }, [mode, botName, loginWithTelegramOAuth]);

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-icon-wrapper">
          <span className="login-icon">🌾</span>
        </div>
        <h1 className="login-title">কৃষি সহকারী</h1>
        <p className="login-subtitle">Agriculture Assistant</p>

        <div className="login-divider" />

        <p className="login-description">
          টেলিগ্রাম দিয়ে লগইন করুন আপনার কৃষি ডেটা সিঙ্ক করতে এবং সব ফিচার ব্যবহার করতে।
        </p>
        <p className="login-description-en">
          Sign in with Telegram to sync your farm data and access all features.
        </p>

        {loginError && (
          <div className="login-error" role="alert">
            {loginError}
          </div>
        )}

        <div className="login-widget-container" ref={widgetRef}>
          {!widgetLoaded && (
            <div className="login-widget-loader">
              <div className="login-spinner" />
              <span>লোড হচ্ছে...</span>
            </div>
          )}
        </div>

        <div className="login-info">
          <div className="login-info-item">
            <span className="login-info-icon">🔒</span>
            <span>আপনার তথ্য নিরাপদ</span>
          </div>
          <div className="login-info-item">
            <span className="login-info-icon">📱</span>
            <span>টেলিগ্রামে খুলুন সেরা অভিজ্ঞতার জন্য</span>
          </div>
        </div>

        <button
          className="login-skip-btn"
          onClick={() => {
            log.info('User chose to continue as guest');
            // Dispatch a custom event that TMAProvider can listen to
            window.dispatchEvent(new CustomEvent('tma-skip-login'));
          }}
          type="button"
        >
          অতিথি হিসেবে চালিয়ে যান (Continue as Guest)
        </button>
      </div>
    </div>
  );
};
