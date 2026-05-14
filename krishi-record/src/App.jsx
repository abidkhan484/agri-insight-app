import { useState } from 'react';
import PlotManager from './components/PlotManager';
import InputLogger from './components/InputLogger';
import ObservationTracker from './components/ObservationTracker';
import HarvestRecorder from './components/HarvestRecorder';
import Reports from './components/Reports';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('plots');

  const tabs = [
    { id: 'plots', label: 'জমি (Plots)' },
    { id: 'inputs', label: 'উপকরণ (Inputs)' },
    { id: 'observations', label: 'পর্যবেক্ষণ (Observations)' },
    { id: 'harvests', label: 'ফসল সংগ্রহ (Harvests)' },
    { id: 'reports', label: 'রিপোর্ট (Reports)' }
  ];

  return (
    <div className="app-container">
      <header>
        <h1>কৃষি রেকর্ড (Krishi Record)</h1>
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
  );
}

export default App;
