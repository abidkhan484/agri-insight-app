import { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useTMA } from '@shared/tma/TMAProvider';
import { TMATheme } from '@shared/tma/TMATheme';
import './App.css';

// Lazy load modules
const KrishiRecord = lazy(() => import('@modules/krishi-record/App'));
const DiseaseDetect = lazy(() => import('@modules/disease-detect/App'));
const MapPWA = lazy(() => import('@modules/map/App'));
const ZBNFKnowledge = lazy(() => import('@modules/knowledge/App'));

function Dashboard() {
  const { user, mode } = useTMA();
  
  const modules = [
    { id: 'records', label: 'কৃষি রেকর্ড', sub: 'Krishi Record', icon: '📈', path: '/records' },
    { id: 'disease', label: 'রোগ শনাক্তকরণ', sub: 'Disease Detection', icon: '🔍', path: '/disease' },
    { id: 'map', label: 'কৃষক ম্যাপ', sub: 'Farmer Map', icon: '📍', path: '/map' },
    { id: 'knowledge', label: 'জ্ঞানভাণ্ডার', sub: 'Knowledge Base', icon: '📚', path: '/knowledge' },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Agriculture Assistant</h1>
        {user ? (
          <p className="welcome-text">স্বাগতম, {user.first_name}!</p>
        ) : (
          mode === 'guest' && (
            <div className="guest-notice">
              ⚠️ আপনি টেলিগ্রামের বাইরে আছেন। সিঙ্ক ফিচার কাজ করবে না।
              <br />
              (Running in Guest Mode. Sync disabled.)
            </div>
          )
        )}
      </header>
      <div className="module-grid">
        {modules.map(module => (
          <Link key={module.id} to={module.path} className="module-card">
            <span className="module-icon">{module.icon}</span>
            <h3>{module.label}</h3>
            <p>{module.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function App() {
  const { isReady, error } = useTMA();

  if (!isReady) {
    return <div className="app-loading">কৃষি সহকারী লোড হচ্ছে...</div>;
  }

  if (error) {
    return <div className="app-error">Error: {error}</div>;
  }

  return (
    <TMATheme>
      <Router>
        <div className="app-shell">
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
          
          <nav className="bottom-nav">
            <Link to="/" className="nav-item">🏠<span>Home</span></Link>
            <Link to="/records" className="nav-item">📈<span>Records</span></Link>
            <Link to="/disease" className="nav-item">🔍<span>Detect</span></Link>
            <Link to="/map" className="nav-item">📍<span>Map</span></Link>
            <Link to="/knowledge" className="nav-item">📚<span>ZBNF</span></Link>
          </nav>
        </div>
      </Router>
    </TMATheme>
  );
}

export default App;
