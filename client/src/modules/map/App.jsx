import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { createClient } from '@supabase/supabase-js';
import log from 'loglevel';
import 'leaflet/dist/leaflet.css';
import { filterFarmerLocations, normalizeFarmerLocation, uniqueSorted } from './mapData';
import './index.css';

log.setLevel(import.meta.env.PROD ? 'warn' : 'debug');
const BANGLADESH_CENTER = [23.685, 90.356];
const BANGLADESH_BOUNDS = [[20.5, 88.0], [26.7, 92.7]];
const PUBLIC_LOCATION_FIELDS = 'id, display_name, district, upazila, crop_type, method, latitude, longitude, created_at';

function createPublicMapClient() {
  const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = import.meta.env;
  return url && key ? createClient(url, key) : null;
}

const supabase = createPublicMapClient();

export async function fetchPublicFarmerLocations(client = supabase) {
  if (!client) throw new Error('Map service is not configured');
  const { data, error } = await client.from('farmer_locations').select(PUBLIC_LOCATION_FIELDS).limit(500);
  if (error) throw error;
  return (data || []).map(normalizeFarmerLocation).filter(Boolean);
}

function JoinMapGuidance() {
  return <aside className="map-join-guidance" aria-labelledby="join-map-title">
    <span className="map-guidance-icon" aria-hidden="true">🗺️</span>
    <div><h2 id="join-map-title">মানচিত্রে যোগ দিতে চান?</h2><p>Telegram-এ <strong>/joinmap</strong> কমান্ড লিখে আপনার জেলা ও অবস্থান শেয়ার করুন।</p></div>
  </aside>;
}

function MapState({ title, message, action }) {
  return <section className="map-state" role="status" aria-live="polite">
    <span className="map-state-icon" aria-hidden="true">🗺️</span><h2>{title}</h2>{message && <p>{message}</p>}{action}
  </section>;
}

export default function FarmerMap({ client = supabase }) {
  const [farmers, setFarmers] = useState([]);
  const [status, setStatus] = useState(navigator.onLine ? 'loading' : 'offline');
  const [filters, setFilters] = useState({ district: '', upazila: '', crop: '' });

  const loadFarmers = useCallback(async () => {
    if (!navigator.onLine) return setStatus('offline');
    setStatus('loading');
    log.info('farmer_map_loading');
    try {
      const locations = await fetchPublicFarmerLocations(client);
      setFarmers(locations); setStatus('ready'); log.info('farmer_map_loaded', { count: locations.length });
    } catch (error) {
      setStatus('error'); log.error('farmer_map_load_failed', { error: error.message });
    }
  }, [client]);

  useEffect(() => {
    loadFarmers();
    const handleOffline = () => setStatus('offline');
    const handleOnline = () => loadFarmers();
    window.addEventListener('offline', handleOffline); window.addEventListener('online', handleOnline);
    return () => { window.removeEventListener('offline', handleOffline); window.removeEventListener('online', handleOnline); };
  }, [loadFarmers]);

  const districts = useMemo(() => uniqueSorted(farmers.map((farmer) => farmer.district)), [farmers]);
  const upazilas = useMemo(() => uniqueSorted(farmers.filter((farmer) => !filters.district || farmer.district === filters.district).map((farmer) => farmer.upazila)), [farmers, filters.district]);
  const crops = useMemo(() => uniqueSorted(farmers.flatMap((farmer) => farmer.crops)), [farmers]);
  const visibleFarmers = useMemo(() => filterFarmerLocations(farmers, filters), [farmers, filters]);

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value, ...(name === 'district' ? { upazila: '' } : {}) }));
  }

  if (status === 'offline') return <div className="map-page"><MapState title="ইন্টারনেট সংযোগ নেই" message="কৃষক মানচিত্র দেখতে ইন্টারনেট সংযোগ চালু করুন।" /><JoinMapGuidance /></div>;
  if (status === 'loading') return <div className="map-page"><MapState title="মানচিত্র লোড হচ্ছে…" message="কাছের কৃষকদের তথ্য আনা হচ্ছে।" /></div>;
  if (status === 'error') return <div className="map-page"><MapState title="মানচিত্রের তথ্য আনা যায়নি" message="ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।" action={<button type="button" className="map-retry-button" onClick={loadFarmers}>আবার চেষ্টা করুন</button>} /><JoinMapGuidance /></div>;

  return <main className="map-page" aria-labelledby="farmer-map-title">
    <header className="map-header"><div><p className="map-eyebrow">কমিউনিটি</p><h1 id="farmer-map-title">কৃষক মানচিত্র</h1><p>বাংলাদেশের ZBNF কৃষকদের খুঁজে দেখুন। অবস্থানগুলো নিরাপত্তার জন্য আনুমানিক।</p></div><span className="map-count" aria-label={`${visibleFarmers.length} জন কৃষক`}>{visibleFarmers.length} জন</span></header>
    <section className="map-filters" aria-label="কৃষক মানচিত্র ফিল্টার">
      <label>জেলা<select aria-label="জেলা" value={filters.district} onChange={(event) => updateFilter('district', event.target.value)}><option value="">সব জেলা</option>{districts.map((district) => <option key={district} value={district}>{district}</option>)}</select></label>
      <label>উপজেলা<select aria-label="উপজেলা" value={filters.upazila} onChange={(event) => updateFilter('upazila', event.target.value)}><option value="">সব উপজেলা</option>{upazilas.map((upazila) => <option key={upazila} value={upazila}>{upazila}</option>)}</select></label>
      <label>ফসল<select aria-label="ফসল" value={filters.crop} onChange={(event) => updateFilter('crop', event.target.value)}><option value="">সব ফসল</option>{crops.map((crop) => <option key={crop} value={crop}>{crop}</option>)}</select></label>
    </section>
    {farmers.length === 0 ? <MapState title="এখনও কোনো কৃষক মানচিত্রে নেই" message="আপনার এলাকার কৃষকদের সঙ্গে যুক্ত হতে মানচিত্রে যোগ দিন।" /> : visibleFarmers.length === 0 ? <MapState title="এই ফিল্টারে কোনো কৃষক পাওয়া যায়নি" message="অন্য জেলা, উপজেলা বা ফসল নির্বাচন করে দেখুন।" /> : <div className="map-canvas" aria-label="কৃষক মানচিত্র"><MapContainer center={BANGLADESH_CENTER} zoom={7} maxBounds={BANGLADESH_BOUNDS}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />{visibleFarmers.map((farmer) => <CircleMarker key={farmer.id} center={[farmer.latitude, farmer.longitude]} radius={8} pathOptions={{ color: '#2d6a4f', fillColor: '#52b788', fillOpacity: 0.8 }}><Popup><strong>{farmer.displayName}</strong><br />{farmer.district}{farmer.upazila ? `, ${farmer.upazila}` : ''}<br />{farmer.crops.length ? `ফসল: ${farmer.crops.join(', ')}` : 'ফসলের তথ্য নেই'}<br /><small>আনুমানিক অবস্থান</small></Popup></CircleMarker>)}</MapContainer></div>}
    <JoinMapGuidance />
  </main>;
}
