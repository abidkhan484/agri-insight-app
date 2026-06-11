import { useEffect, useRef, useState } from 'react';
import { useTMA } from './TMAProvider';
import log from 'loglevel';
import './LoginScreen.css';

/**
 * LoginScreen renders two auth methods side by side:
 * 1. Email / Password sign-up and login (for web users)
 * 2. Telegram Login Widget (OAuth) for browser-based Telegram auth
 */
export const LoginScreen = () => {
  const { loginWithEmail, registerWithEmail, loginWithTelegramOAuth, mode } = useTMA();

  // ---- Tab state ----
  const [activeTab, setActiveTab] = useState('email'); // 'email' | 'telegram'
  const [emailSubTab, setEmailSubTab] = useState('login'); // 'login' | 'register'

  // ---- Form state ----
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ---- Telegram widget state ----
  const widgetRef = useRef(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [widgetError, setWidgetError] = useState(null);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const botName = import.meta.env.VITE_BOT_USERNAME || 'agri_insight_bot';

  // ---- Form handlers ----

  function handleInput(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError(null);
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsLoading(true);

    try {
      if (emailSubTab === 'login') {
        await loginWithEmail({ email: formData.email, password: formData.password });
      } else {
        if (formData.password.length < 8) {
          setFormError('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে। (Password must be at least 8 chars.)');
          return;
        }
        const result = await registerWithEmail({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });
        // If Supabase requires email confirmation, user might be null
        if (!result?.token) {
          setFormSuccess(
            'নিবন্ধন সফল! আপনার ইমেইল নিশ্চিত করুন তারপর লগইন করুন। (Registration successful! Please confirm your email.)',
          );
          setEmailSubTab('login');
        }
      }
    } catch (err) {
      log.error('Email auth error:', err);
      setFormError(err.message || 'একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন। (An error occurred.)');
    } finally {
      setIsLoading(false);
    }
  }

  // ---- Telegram widget loader ----

  useEffect(() => {
    if (activeTab !== 'telegram' || mode !== 'login' || !widgetRef.current) return;

    setWidgetLoaded(false);
    setLoadTimeout(false);
    setWidgetError(null);
    widgetRef.current.innerHTML = '';

    const timer = setTimeout(() => {
      if (!widgetLoaded) setLoadTimeout(true);
    }, 8000);

    window.__onTelegramAuth = async (telegramUser) => {
      log.info('Telegram OAuth callback received');
      setWidgetError(null);
      try {
        await loginWithTelegramOAuth(telegramUser);
      } catch (err) {
        log.error('Telegram OAuth login failed:', err);
        setWidgetError('লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন। (Login failed. Please try again.)');
      }
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-onauth', '__onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    script.onload = () => {
      log.info('Telegram Widget script loaded');
      setWidgetLoaded(true);
    };
    script.onerror = () => {
      log.error('Failed to load Telegram Login Widget script');
      setWidgetLoaded(true);
      setWidgetError('টেলিগ্রাম উইজেট লোড করা যায়নি। (Failed to load Telegram Widget.)');
    };

    widgetRef.current.appendChild(script);

    return () => {
      clearTimeout(timer);
      delete window.__onTelegramAuth;
    };
  }, [activeTab, mode, botName, loginWithTelegramOAuth, retryCount]);

  // ---- Render ----

  return (
    <div className="login-screen">
      <div className="login-card">
        {/* Header */}
        <div className="login-icon-wrapper">
          <span className="login-icon">🌾</span>
        </div>
        <h1 className="login-title">কৃষি সহকারী</h1>
        <p className="login-subtitle">Agriculture Assistant</p>

        <div className="login-divider" />

        {/* Method Tabs */}
        <div className="login-tabs" role="tablist">
          <button
            id="tab-email"
            role="tab"
            aria-selected={activeTab === 'email'}
            className={`login-tab${activeTab === 'email' ? ' login-tab--active' : ''}`}
            onClick={() => setActiveTab('email')}
            type="button"
          >
            ✉️ ইমেইল
          </button>
          <button
            id="tab-telegram"
            role="tab"
            aria-selected={activeTab === 'telegram'}
            className={`login-tab${activeTab === 'telegram' ? ' login-tab--active' : ''}`}
            onClick={() => setActiveTab('telegram')}
            type="button"
          >
            ✈️ টেলিগ্রাম
          </button>
        </div>

        {/* ── Email/Password Panel ── */}
        {activeTab === 'email' && (
          <div className="login-panel" role="tabpanel" aria-labelledby="tab-email">
            {/* Sub-tabs: Login / Register */}
            <div className="login-subtabs">
              <button
                id="subtab-login"
                className={`login-subtab${emailSubTab === 'login' ? ' login-subtab--active' : ''}`}
                onClick={() => {
                  setEmailSubTab('login');
                  setFormError(null);
                  setFormSuccess(null);
                }}
                type="button"
              >
                লগইন
              </button>
              <button
                id="subtab-register"
                className={`login-subtab${emailSubTab === 'register' ? ' login-subtab--active' : ''}`}
                onClick={() => {
                  setEmailSubTab('register');
                  setFormError(null);
                  setFormSuccess(null);
                }}
                type="button"
              >
                নিবন্ধন
              </button>
            </div>

            {formError && (
              <div className="login-error" role="alert">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="login-success" role="status">
                {formSuccess}
              </div>
            )}

            <form className="login-form" onSubmit={handleEmailSubmit} noValidate>
              {emailSubTab === 'register' && (
                <div className="login-field">
                  <label htmlFor="login-name" className="login-label">
                    নাম (Name)
                  </label>
                  <input
                    id="login-name"
                    className="login-input"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInput}
                    placeholder="আপনার নাম লিখুন"
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="login-field">
                <label htmlFor="login-email" className="login-label">
                  ইমেইল (Email)
                </label>
                <input
                  id="login-email"
                  className="login-input"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInput}
                  placeholder="example@email.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="login-field">
                <label htmlFor="login-password" className="login-label">
                  পাসওয়ার্ড (Password)
                </label>
                <input
                  id="login-password"
                  className="login-input"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInput}
                  placeholder={emailSubTab === 'register' ? 'কমপক্ষে ৮ অক্ষর' : '••••••••'}
                  autoComplete={emailSubTab === 'register' ? 'new-password' : 'current-password'}
                  required
                />
              </div>

              <button
                id="email-submit-btn"
                className="login-submit-btn"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="login-btn-content">
                    <span className="login-spinner login-spinner--small" />
                    লোড হচ্ছে...
                  </span>
                ) : emailSubTab === 'login' ? (
                  'লগইন করুন'
                ) : (
                  'নিবন্ধন করুন'
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── Telegram Panel ── */}
        {activeTab === 'telegram' && (
          <div className="login-panel" role="tabpanel" aria-labelledby="tab-telegram">
            <p className="login-description">
              টেলিগ্রাম দিয়ে লগইন করুন আপনার কৃষি ডেটা সিঙ্ক করতে।
            </p>
            <p className="login-description-en">
              Sign in with Telegram to sync your farm data.
            </p>

            {widgetError && (
              <div className="login-error" role="alert">
                {widgetError}
              </div>
            )}

            <a
              href={`https://t.me/${botName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="login-telegram-link-btn"
            >
              <span className="login-telegram-icon">✈️</span>
              টেলিগ্রাম অ্যাপে খুলুন (Open in Telegram)
            </a>

            <div className="login-or-divider">
              <span>অথবা (or)</span>
            </div>

            <div className="login-widget-container" ref={widgetRef} />

            {!widgetLoaded && !loadTimeout && (
              <div className="login-widget-loader">
                <div className="login-spinner" />
                <span>লোড হচ্ছে...</span>
              </div>
            )}

            {loadTimeout && !widgetLoaded && (
              <div className="login-timeout">
                <p>উইজেট লোড হতে দেরি হচ্ছে...</p>
                <button
                  className="login-retry-btn"
                  onClick={() => setRetryCount((prev) => prev + 1)}
                >
                  আবার চেষ্টা করুন (Retry)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Info strip */}
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

        {/* Guest mode */}
        <button
          id="guest-mode-btn"
          className="login-skip-btn"
          onClick={() => {
            log.info('User chose to continue as guest');
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
