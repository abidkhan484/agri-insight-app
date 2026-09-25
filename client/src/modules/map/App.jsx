import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import log from 'loglevel';
import 'leaflet/dist/leaflet.css';
import { filterFarmerLocations, normalizeFarmerLocation, uniqueSorted } from './mapData';
import { getPublicApiBaseUrl } from '../../shared/public-api.js';
import { useLanguage } from '../../shared/i18n/LanguageContext';
import './index.css';

log.setLevel(import.meta.env.PROD ? 'warn' : 'debug');
const BANGLADESH_CENTER = [23.685, 90.356];
const BANGLADESH_BOUNDS = [[20.5, 88.0], [26.7, 92.7]];
const PUBLIC_LOCATION_FIELDS = 'id, display_name, district, upazila, crop_type, method, latitude, longitude, created_at';

export async function fetchPublicFarmerLocations(client) {
  if (!client) {
    const response = await fetch(`${getPublicApiBaseUrl()}/api/map/locations`);
    if (!response.ok) throw new Error(`Map service failed (${response.status})`);
    return ((await response.json()).locations || []).map(normalizeFarmerLocation).filter(Boolean);
  }
  const { data, error } = await client.from('farmer_locations').select(PUBLIC_LOCATION_FIELDS).limit(500);
  if (error) throw error;
  return (data || []).map(normalizeFarmerLocation).filter(Boolean);
}

function JoinMapGuidance() {
  const { isBangla } = useLanguage();
  return <aside className="map-join-guidance" aria-labelledby="join-map-title">
    <span className="map-guidance-icon" aria-hidden="true">🗺️</span>
    <div><h2 id="join-map-title">{isBangla ? 'মানচিত্রে যোগ দিতে চান?' : 'Want to join the map?'}</h2><p>{isBangla ? <>Telegram-এ <strong>/joinmap</strong> কমান্ড লিখে আপনার জেলা ও অবস্থান শেয়ার করুন।</> : <>Send <strong>/joinmap</strong> in Telegram to share your district and location.</>}</p></div>
  </aside>;
}

function MapState({ title, message, action }) {
  return <section className="map-state" role="status" aria-live="polite">
    <span className="map-state-icon" aria-hidden="true">🗺️</span><h2>{title}</h2>{message && <p>{message}</p>}{action}
  </section>;
}

export default function FarmerMap({ client }) {
  const { isBangla } = useLanguage();
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

  if (status === 'offline') return <div className="map-page"><MapState title={isBangla ? 'ইন্টারনেট সংযোগ নেই' : 'No internet connection'} message={isBangla ? 'কৃষক মানচিত্র দেখতে ইন্টারনেট সংযোগ চালু করুন।' : 'Connect to the internet to view the farmer map.'} /><JoinMapGuidance /></div>;
  if (status === 'loading') return <div className="map-page"><MapState title={isBangla ? 'মানচিত্র লোড হচ্ছে…' : 'Loading map…'} message={isBangla ? 'কাছের কৃষকদের তথ্য আনা হচ্ছে।' : 'Fetching nearby farmers.'} /></div>;
  if (status === 'error') return <div className="map-page"><MapState title={isBangla ? 'মানচিত্রের তথ্য আনা যায়নি' : 'Could not load map data'} message={isBangla ? 'ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।' : 'Check your internet connection and try again.'} action={<button type="button" className="map-retry-button" onClick={loadFarmers}>{isBangla ? 'আবার চেষ্টা করুন' : 'Try again'}</button>} /><JoinMapGuidance /></div>;

  return <main className="map-page" aria-labelledby="farmer-map-title">
    <header className="map-header"><div><p className="map-eyebrow">{isBangla ? 'কমিউনিটি' : 'Community'}</p><h1 id="farmer-map-title">{isBangla ? 'কৃষক মানচিত্র' : 'Farmer map'}</h1><p>{isBangla ? 'বাংলাদেশের ZBNF কৃষকদের খুঁজে দেখুন। অবস্থানগুলো নিরাপত্তার জন্য আনুমানিক।' : 'Find ZBNF farmers in Bangladesh. Locations are approximate for privacy.'}</p></div><span className="map-count" aria-label={`${visibleFarmers.length} ${isBangla ? 'জন কৃষক' : 'farmers'}`}>{visibleFarmers.length} {isBangla ? 'জন' : ''}</span></header>
    <section className="map-filters" aria-label={isBangla ? 'কৃষক মানচিত্র ফিল্টার' : 'Farmer map filters'}>
      <label>{isBangla ? 'জেলা' : 'District'}<select aria-label={isBangla ? 'জেলা' : 'District'} value={filters.district} onChange={(event) => updateFilter('district', event.target.value)}><option value="">{isBangla ? 'সব জেলা' : 'All districts'}</option>{districts.map((district) => <option key={district} value={district}>{district}</option>)}</select></label>
      <label>{isBangla ? 'উপজেলা' : 'Upazila'}<select aria-label={isBangla ? 'উপজেলা' : 'Upazila'} value={filters.upazila} onChange={(event) => updateFilter('upazila', event.target.value)}><option value="">{isBangla ? 'সব উপজেলা' : 'All upazilas'}</option>{upazilas.map((upazila) => <option key={upazila} value={upazila}>{upazila}</option>)}</select></label>
      <label>{isBangla ? 'ফসল' : 'Crop'}<select aria-label={isBangla ? 'ফসল' : 'Crop'} value={filters.crop} onChange={(event) => updateFilter('crop', event.target.value)}><option value="">{isBangla ? 'সব ফসল' : 'All crops'}</option>{crops.map((crop) => <option key={crop} value={crop}>{crop}</option>)}</select></label>
    </section>
    {farmers.length === 0 ? <MapState title={isBangla ? 'এখনও কোনো কৃষক মানচিত্রে নেই' : 'No farmers on the map yet'} message={isBangla ? 'আপনার এলাকার কৃষকদের সঙ্গে যুক্ত হতে মানচিত্রে যোগ দিন।' : 'Join the map to connect with farmers in your area.'} /> : visibleFarmers.length === 0 ? <MapState title={isBangla ? 'এই ফিল্টারে কোনো কৃষক পাওয়া যায়নি' : 'No farmers match this filter'} message={isBangla ? 'অন্য জেলা, উপজেলা বা ফসল নির্বাচন করে দেখুন।' : 'Try another district, upazila, or crop.'} /> : <div className="map-canvas" aria-label={isBangla ? 'কৃষক মানচিত্র' : 'Farmer map'}><MapContainer center={BANGLADESH_CENTER} zoom={7} maxBounds={BANGLADESH_BOUNDS}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />{visibleFarmers.map((farmer) => <CircleMarker key={farmer.id} center={[farmer.latitude, farmer.longitude]} radius={8} pathOptions={{ color: '#2d6a4f', fillColor: '#52b788', fillOpacity: 0.8 }}><Popup><strong>{farmer.displayName}</strong><br />{farmer.district}{farmer.upazila ? `, ${farmer.upazila}` : ''}<br />{farmer.crops.length ? `${isBangla ? 'ফসল' : 'Crops'}: ${farmer.crops.join(', ')}` : (isBangla ? 'ফসলের তথ্য নেই' : 'No crop data')}<br /><small>{isBangla ? 'আনুমানিক অবস্থান' : 'Approximate location'}</small></Popup></CircleMarker>)}</MapContainer></div>}
    <JoinMapGuidance />
  </main>;
}
