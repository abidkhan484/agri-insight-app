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
import './App.css';

// Lazy load modules
const KrishiRecord = lazy(() => import('@modules/krishi-record/App'));
const DiseaseDetect = lazy(() => import('@modules/disease-detect/App'));
const MapPWA = lazy(() => import('@modules/map/App'));
const ZBNFKnowledge = lazy(() => import('@modules/knowledge/App'));

const dashboardModules = [
  { id: 'records', label: 'দ্রুত রেকর্ড', sub: 'আজকের জমির কাজ লিখুন', icon: '📒', path: '/records' },
  { id: 'disease', label: 'রোগ ও পোকা', sub: 'ছবি দিয়ে জানুন', icon: '🔍', path: '/disease' },
  { id: 'knowledge', label: 'জ্ঞানভাণ্ডার', sub: 'ZBNF পরামর্শ ও হিসাব', icon: '📚', path: '/knowledge' },
  { id: 'map', label: 'কমিউনিটি ম্যাপ', sub: 'কাছের কৃষক খুঁজুন', icon: '📍', path: '/map' },
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
  const [showOnboarding, setShowOnboarding] = useState(true);

  return (
    <main className="dashboard" aria-labelledby="dashboard-title">
      <header className="dashboard-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">🌾</span>
          <div>
            <p className="eyebrow">AGRI INSIGHT</p>
            <h1 id="dashboard-title">কৃষি সহকারী</h1>
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
                লগআউট (Logout)
              </button>
            )}
          </div>
        ) : (
          mode === 'guest' && (
            <div className="guest-status" role="status" aria-label="অতিথি মোড">
              <div className="guest-status-icon" aria-hidden="true">✓</div>
              <div>
                <strong>অতিথি মোড</strong>
                <p>আপনার রেকর্ড এই ডিভাইসেই সংরক্ষিত থাকবে।</p>
              </div>
              <button
                className="guest-login-btn button button--quiet"
                onClick={logout}
                type="button"
              >
                লগইন করুন
              </button>
            </div>
          )
        )}
      </header>

      <section className="dashboard-intro" aria-labelledby="intro-title">
        <p className="section-kicker">আজকের কৃষি সহায়তা</p>
        <h2 id="intro-title">আপনার জমির যত্ন, আরও সহজে</h2>
        <p>রেকর্ড রাখুন, রোগের লক্ষণ দেখুন এবং ZBNF পদ্ধতি সম্পর্কে জানুন।</p>
      </section>

      {showOnboarding && mode === 'guest' && (
        <section className="onboarding-card" aria-labelledby="onboarding-title">
          <div>
            <p className="section-kicker">প্রথমবার ব্যবহার করছেন?</p>
            <h2 id="onboarding-title">কীভাবে শুরু করবেন</h2>
            <ol>
              <li><span>১</span> প্রথমে আপনার জমির রেকর্ড যোগ করুন</li>
              <li><span>২</span> কাজের হিসাব নিয়মিত লিখে রাখুন</li>
              <li><span>৩</span> লগইন করলে রেকর্ড সিঙ্ক করা যাবে</li>
            </ol>
          </div>
          <button className="button button--outline" type="button" onClick={() => setShowOnboarding(false)}>
            বুঝেছি
          </button>
        </section>
      )}

      <section aria-labelledby="tools-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">আপনার সরঞ্জাম</p>
            <h2 id="tools-title">কী করতে চান?</h2>
          </div>
          <span className="tool-count">৪টি সেবা</span>
        </div>
        <div className="module-grid">
          {dashboardModules.map((module) => (
            <Link key={module.id} to={module.path} className="module-card">
              <span className="module-icon" aria-hidden="true">{module.icon}</span>
              <span className="module-card-copy">
                <h3>{module.label}</h3>
                <p>{module.sub}</p>
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

  if (location.pathname === '/') return null;

  return (
    <div className="module-header">
      <button className="back-button" type="button" onClick={() => navigate('/')}>← <span>হোমে ফিরুন</span></button>
      <span className="module-path" aria-label="বর্তমান সেবা">কৃষি সহকারী</span>
    </div>
  );
}

function AppNavigation() {
  return (
    <nav className="bottom-nav" aria-label="প্রধান নেভিগেশন">
      {navigationItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
        >
          <span className="nav-icon" aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function App() {
  const { isReady, error, mode } = useTMA();

  if (!isReady) {
    return <div className="app-loading">কৃষি সহকারী লোড হচ্ছে...</div>;
  }

  if (error) {
    return <div className="app-error">Error: {error}</div>;
  }

  // Show login screen when user is not authenticated and not in guest mode
  if (mode === 'login') {
    return (
      <TMATheme>
        <LoginScreen />
      </TMATheme>
    );
  }

  return (
    <TMATheme>
      <Router>
        <div className="app-shell">
          <ModuleHeader />
          <Suspense fallback={<div className="module-loading">লোড হচ্ছে...</div>}>
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
