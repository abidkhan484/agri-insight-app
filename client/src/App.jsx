import { lazy, Suspense, useState } from 'react';
import {
  HashRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useTMA } from '@shared/tma/TMAProvider';
import { TMATheme } from '@shared/tma/TMATheme';
import { LoginScreen } from '@shared/tma/LoginScreen';
import { LanguageSwitcher, useLanguage } from '@shared/i18n/LanguageContext';
import './App.css';

// Lazy load modules
const KrishiRecord = lazy(() => import('@modules/krishi-record/App'));
const DiseaseDetect = lazy(() => import('@modules/disease-detect/App'));
const MapPWA = lazy(() => import('@modules/map/App'));
const ZBNFKnowledge = lazy(() => import('@modules/knowledge/App'));

const dashboardModules = [
  { id: 'records', label: 'দ্রুত রেকর্ড', labelEn: 'Quick records', sub: 'আজকের জমির কাজ লিখুন', subEn: 'Record today’s farm work', icon: '📒', path: '/records' },
  { id: 'disease', label: 'রোগ ও পোকা', labelEn: 'Pests & diseases', sub: 'ছবি দিয়ে জানুন', subEn: 'Check from a photo', icon: '🔍', path: '/disease' },
  { id: 'knowledge', label: 'জ্ঞানভাণ্ডার', labelEn: 'Knowledge base', sub: 'ZBNF পরামর্শ ও হিসাব', subEn: 'ZBNF guidance and calculators', icon: '📚', path: '/knowledge' },
  { id: 'map', label: 'কমিউনিটি ম্যাপ', labelEn: 'Community map', sub: 'কাছের কৃষক খুঁজুন', subEn: 'Find nearby farmers', icon: '📍', path: '/map' },
];

const navigationItems = [
  { label: 'হোম', path: '/', icon: '⌂' },
  { label: 'আমার রেকর্ড', path: '/records', icon: '▣' },
  { label: 'রোগ ও পোকা', path: '/disease', icon: '⌕' },
  { label: 'কমিউনিটি ম্যাপ', path: '/map', icon: '⌖' },
  { label: 'জ্ঞানভাণ্ডার', path: '/knowledge', icon: '▤' },
];

function Dashboard() {
  const { user, mode, logout } = useTMA();
  const { isBangla, t } = useLanguage();
  const [showOnboarding, setShowOnboarding] = useState(true);

  return (
    <main className="dashboard" aria-labelledby="dashboard-title">
      <header className="dashboard-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">🌾</span>
          <div>
            <p className="eyebrow">AGRI INSIGHT</p>
            <h1 id="dashboard-title">{t('appName')}</h1>
          </div>
        </div>
        {user ? (
          <div className="account-status">
            <p className="welcome-text">স্বাগতম, {user.first_name || 'কৃষক'}!</p>
            {mode === 'browser' && (
              <button
                className="logout-btn"
                onClick={logout}
                type="button"
              >
                {isBangla ? 'লগআউট' : 'Log out'}
              </button>
            )}
          </div>
        ) : (
          mode === 'guest' && (
            <div className="guest-status" role="status" aria-label="অতিথি মোড">
              <div className="guest-status-icon" aria-hidden="true">✓</div>
              <div>
                <strong>{isBangla ? 'অতিথি মোড' : 'Guest mode'}</strong>
                <p>{isBangla ? 'আপনার রেকর্ড এই ডিভাইসেই সংরক্ষিত থাকবে।' : 'Your records will stay on this device.'}</p>
              </div>
              <button
                className="guest-login-btn button button--quiet"
                onClick={logout}
                type="button"
              >
                {isBangla ? 'লগইন করুন' : 'Sign in'}
              </button>
            </div>
          )
        )}
      </header>

      <section className="dashboard-intro" aria-labelledby="intro-title">
        <p className="section-kicker">{isBangla ? 'আজকের কৃষি সহায়তা' : 'Today’s farm support'}</p>
        <h2 id="intro-title">{isBangla ? 'আপনার জমির যত্ন, আরও সহজে' : 'Care for your farm, more easily'}</h2>
        <p>{isBangla ? 'রেকর্ড রাখুন, রোগের লক্ষণ দেখুন এবং ZBNF পদ্ধতি সম্পর্কে জানুন।' : 'Keep records, check symptoms, and learn about ZBNF farming.'}</p>
      </section>

      {showOnboarding && mode === 'guest' && (
        <section className="onboarding-card" aria-labelledby="onboarding-title">
          <div>
            <p className="section-kicker">{isBangla ? 'প্রথমবার ব্যবহার করছেন?' : 'First time here?'}</p>
            <h2 id="onboarding-title">{isBangla ? 'কীভাবে শুরু করবেন' : 'How to get started'}</h2>
            <ol>
              <li><span>১</span> {isBangla ? 'প্রথমে আপনার জমির রেকর্ড যোগ করুন' : 'Add your farm record first'}</li>
              <li><span>২</span> {isBangla ? 'কাজের হিসাব নিয়মিত লিখে রাখুন' : 'Record farm work regularly'}</li>
              <li><span>৩</span> {isBangla ? 'লগইন করলে রেকর্ড সিঙ্ক করা যাবে' : 'Sign in to sync your records'}</li>
            </ol>
          </div>
          <button className="button button--outline" type="button" onClick={() => setShowOnboarding(false)}>
            {isBangla ? 'বুঝেছি' : 'Got it'}
          </button>
        </section>
      )}

      <section aria-labelledby="tools-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">{isBangla ? 'আপনার সরঞ্জাম' : 'Your tools'}</p>
            <h2 id="tools-title">{isBangla ? 'কী করতে চান?' : 'What would you like to do?'}</h2>
          </div>
          <span className="tool-count">{isBangla ? '৪টি সেবা' : '4 services'}</span>
        </div>
        <div className="module-grid">
          {dashboardModules.map((module) => (
            <Link key={module.id} to={module.path} className="module-card">
              <span className="module-icon" aria-hidden="true">{module.icon}</span>
              <span className="module-card-copy">
              <h3>{isBangla ? module.label : module.labelEn}</h3>
              <p>{isBangla ? module.sub : module.subEn}</p>
              </span>
              <span className="module-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function ModuleHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  if (location.pathname === '/') return null;

  return (
    <div className="module-header">
      <button className="back-button" type="button" onClick={() => navigate('/')}>← <span>{t('backHome')}</span></button>
      <span className="module-path" aria-label={t('appName')}>{t('appName')}</span>
    </div>
  );
}

function AppNavigation() {
  const { isBangla } = useLanguage();
  const englishLabels = ['Home', 'My records', 'Pests & diseases', 'Community map', 'Knowledge base'];
  return (
    <nav className="bottom-nav" aria-label={isBangla ? 'প্রধান নেভিগেশন' : 'Main navigation'}>
      {navigationItems.map((item, index) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
        >
          <span className="nav-icon" aria-hidden="true">{item.icon}</span>
          <span>{isBangla ? item.label : englishLabels[index]}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function App() {
  const { isReady, error, mode } = useTMA();
  const { t } = useLanguage();

  if (!isReady) {
    return <><LanguageSwitcher /><div className="app-loading">{t('loading')}</div></>;
  }

  if (error) {
    return <div className="app-error">Error: {error}</div>;
  }

  // Show login screen when user is not authenticated and not in guest mode
  if (mode === 'login') {
    return (
      <TMATheme><LanguageSwitcher /><LoginScreen /></TMATheme>
    );
  }

  return (
    <TMATheme>
      <LanguageSwitcher />
      <Router>
        <div className="app-shell">
          <ModuleHeader />
          <Suspense fallback={<div className="module-loading">{t('loading')}</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/records/*" element={<KrishiRecord />} />
              <Route path="/disease/*" element={<DiseaseDetect />} />
              <Route path="/map/*" element={<MapPWA />} />
              <Route path="/knowledge/*" element={<ZBNFKnowledge />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>

          <AppNavigation />
        </div>
      </Router>
    </TMATheme>
  );
}

export default App;
