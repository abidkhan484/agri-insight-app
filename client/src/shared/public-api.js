// Keep the API same-origin by default. Separate hosting can still provide
// VITE_API_BASE_URL or VITE_AUTH_ENDPOINT at build time.
const DEFAULT_API_BASE_URL = '';

export function getPublicApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_AUTH_ENDPOINT;
  if (!configured) return DEFAULT_API_BASE_URL;
  return configured.replace(/\/api\/auth\/telegram\/?$/, '').replace(/\/$/, '');
}
