import { useEffect, useState } from 'react';
import log from 'loglevel';

/**
 * SyncStatus provides a visual indicator of the application's connection and 
 * synchronization state with the cloud.
 */
export const SyncStatus = ({ syncManagers = [] }) => {
  const [status, setStatus] = useState('synced'); // 'synced', 'syncing', 'offline', 'error'
  const [lastSync, setLastSync] = useState(null);

  const syncAll = async () => {
    if (!navigator.onLine || syncManagers.length === 0) return false;
    setStatus('syncing');
    try {
      // Plots must finish first: child records map local plotId to remote plot_id.
      for (const manager of syncManagers) await manager.sync();
      setStatus('synced');
      setLastSync(new Date());
      return true;
    } catch (error) {
      log.error('Auto-sync failed', error.message || error);
      setStatus('error');
      return false;
    }
  };

  useEffect(() => {
    const handleOnline = () => { setStatus('syncing'); void syncAll(); };
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    void syncAll();
    const interval = setInterval(async () => {
      await syncAll();
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [syncManagers]);

  const config = {
    synced: { icon: '✅', text: 'Cloud Synced', color: 'var(--tg-hint, #999)' },
    syncing: { icon: '🔄', text: 'Syncing...', color: 'var(--tg-link, #2481cc)' },
    offline: { icon: '📡', text: 'Offline Mode', color: '#ffa500' },
    error: { icon: '⚠️', text: 'Sync Error', color: '#ff4444' },
    guest: { icon: '👤', text: 'Guest (Local Only)', color: '#999' }
  };

  const current = syncManagers.length === 0 ? config.guest : config[status];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 8px',
      fontSize: '12px',
      color: current.color,
      opacity: 0.8
    }}>
      <span>{current.icon}</span>
      <span>{current.text}</span>
      {syncManagers.length > 0 && (
        <button type="button" onClick={syncAll} disabled={status === 'syncing'}>
          Sync
        </button>
      )}
      {lastSync && status === 'synced' && (
        <span style={{ fontSize: '10px', marginLeft: '4px' }}>
          ({lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
        </span>
      )}
    </div>
  );
};
