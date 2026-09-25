import { useState, useEffect } from 'react';
import PlotManager from './components/PlotManager';
import InputLogger from './components/InputLogger';
import ObservationTracker from './components/ObservationTracker';
import HarvestRecorder from './components/HarvestRecorder';
import Reports from './components/Reports';
import QuickRecordEntry from './components/QuickRecordEntry';
import './App.css';

import { useTMA } from '@shared/tma/TMAProvider';
import { TMATheme } from '@shared/tma/TMATheme';
import { SyncManager } from '@shared/sync/SyncManager';
import { SyncStatus } from '@shared/sync/SyncStatus';
import { createClient } from '@supabase/supabase-js';
import { db } from './db';
import { LanguageText, useLanguage } from '@shared/i18n/LanguageContext';

function App() {
  const { user, isReady, error } = useTMA();
  const { isBangla } = useLanguage();
  const [activeTab, setActiveTab] = useState('quick');
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
        new SyncManager(db, supabase, 'plots', { user }),
        new SyncManager(db, supabase, 'inputs', { user }),
        new SyncManager(db, supabase, 'observations', { user }),
        new SyncManager(db, supabase, 'harvests', { user }),
      ];
      setSyncManagers(managers);
    }
  }, [user]);

  const tabs = [
    { id: 'quick', bn: 'দ্রুত রেকর্ড', en: 'Quick records' },
    { id: 'plots', bn: 'জমি', en: 'Plots' },
    { id: 'inputs', bn: 'উপকরণ', en: 'Inputs' },
    { id: 'observations', bn: 'পর্যবেক্ষণ', en: 'Observations' },
    { id: 'harvests', bn: 'ফসল সংগ্রহ', en: 'Harvests' },
    { id: 'reports', bn: 'রিপোর্ট', en: 'Reports' },
  ];

  if (!isReady) {
    return <div className="app-loading"><LanguageText bn="কৃষি সহকারী লোড হচ্ছে..." en="Loading assistant..." /></div>;
  }

  if (error) {
    return <div className="app-error">Error: {error}</div>;
  }

  return (
    <TMATheme>
      <div className="app-container">
        <header>
          <div className="header-main">
            <h1><LanguageText bn="কৃষি রেকর্ড" en="Farm records" /></h1>
            <SyncStatus syncManagers={syncManagers} />
          </div>
          {user && <div className="user-welcome"><LanguageText bn={`স্বাগতম, ${user.first_name}!`} en={`Welcome, ${user.first_name}!`} /></div>}
        </header>
        
        <nav className="tab-nav">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {isBangla ? tab.bn : tab.en}
            </button>
          ))}
        </nav>

        <main className="tab-content">
          {activeTab === 'quick' && <QuickRecordEntry />}
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
