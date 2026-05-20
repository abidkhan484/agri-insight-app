import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { createClient } from '@supabase/supabase-js';
import log from 'loglevel';
import 'leaflet/dist/leaflet.css';

log.setLevel(import.meta.env.PROD ? 'warn' : 'debug');

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const BANGLADESH_CENTER = [23.685, 90.356];
const BANGLADESH_BOUNDS = [[20.5, 88.0], [26.7, 92.7]];

export default function FarmerMap() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFarmers() {
      log.info('farmer_map_loading');
      const { data, error } = await supabase
        .from('farmer_locations')
        .select('display_name, district, upazila, latitude, longitude, crops, joined_at')
        .limit(500);

      if (error) {
        log.error('farmer_map_load_failed', { error: error.message });
      } else {
        setFarmers(data || []);
        log.info('farmer_map_loaded', { count: data?.length });
      }
      setLoading(false);
    }
    loadFarmers();
  }, []);

  if (loading) return <div>Loading map...</div>;

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer center={BANGLADESH_CENTER} zoom={7} maxBounds={BANGLADESH_BOUNDS} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {farmers.map((farmer, i) => (
          <CircleMarker
            key={i}
            center={[farmer.latitude, farmer.longitude]}
            radius={8}
            pathOptions={{ color: '#2d6a4f', fillColor: '#52b788', fillOpacity: 0.8 }}
          >
            <Popup>
              <strong>{farmer.display_name}</strong><br />
              {farmer.district}, {farmer.upazila}<br />
              {farmer.crops?.join(', ')}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
