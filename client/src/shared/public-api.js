const DEFAULT_API_BASE_URL = 'https://agri-insight-app.onrender.com';

export function getPublicApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_AUTH_ENDPOINT;
  if (!configured) return DEFAULT_API_BASE_URL;
  return configured.replace(/\/api\/auth\/telegram\/?$/, '').replace(/\/$/, '');
}
