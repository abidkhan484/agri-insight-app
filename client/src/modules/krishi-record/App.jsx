import { useState, useEffect } from 'react';
import PlotManager from './components/PlotManager';
import InputLogger from './components/InputLogger';
import ObservationTracker from './components/ObservationTracker';
import HarvestRecorder from './components/HarvestRecorder';
import Reports from './components/Reports';
import './App.css';

import { useTMA } from '@shared/tma/TMAProvider';
import { TMATheme } from '@shared/tma/TMATheme';
import { SyncManager } from '@shared/sync/SyncManager';
import { SyncStatus } from '@shared/sync/SyncStatus';
import { createClient } from '@supabase/supabase-js';
import { db } from './db';

function App() {
  const { user, isReady, error } = useTMA();
  const [activeTab, setActiveTab] = useState('plots');
  const [syncManagers, setSyncManagers] = useState([]);

  useEffect(() => {
    if (user && user.token) {
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          },
        },
      );

      const managers = [
        new SyncManager(db, supabase, 'plots'),
        new SyncManager(db, supabase, 'inputs'),
        new SyncManager(db, supabase, 'observations'),
        new SyncManager(db, supabase, 'harvests'),
      ];
      setSyncManagers(managers);
    }
  }, [user]);

  const tabs = [
    { id: 'plots', label: 'জমি (Plots)' },
    { id: 'inputs', label: 'উপকরণ (Inputs)' },
    { id: 'observations', label: 'পর্যবেক্ষণ (Observations)' },
    { id: 'harvests', label: 'ফসল সংগ্রহ (Harvests)' },
    { id: 'reports', label: 'রিপোর্ট (Reports)' }
  ];

  if (!isReady) {
    return <div className="app-loading">কৃষি সহকারী লোড হচ্ছে... (Loading Assistant...)</div>;
  }

  if (error) {
    return <div className="app-error">Error: {error}</div>;
  }

  return (
    <TMATheme>
      <div className="app-container">
        <header>
          <div className="header-main">
            <h1>কৃষি রেকর্ড (Krishi Record)</h1>
            <SyncStatus syncManagers={syncManagers} />
          </div>
          {user && <div className="user-welcome">স্বাগতম, {user.first_name}!</div>}
        </header>
        
        <nav className="tab-nav">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main className="tab-content">
          {activeTab === 'plots' && <PlotManager />}
          {activeTab === 'inputs' && <InputLogger />}
          {activeTab === 'observations' && <ObservationTracker />}
          {activeTab === 'harvests' && <HarvestRecorder />}
          {activeTab === 'reports' && <Reports />}
        </main>
      </div>
    </TMATheme>
  );
}

export default App;
