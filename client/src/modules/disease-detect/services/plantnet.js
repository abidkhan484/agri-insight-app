import log from 'loglevel';
import { getPublicApiBaseUrl } from '../../../shared/public-api.js';

// Use production level if in production
log.setLevel(import.meta.env.PROD ? 'warn' : 'debug');

const PLANTNET_BASE = 'https://my.plantnet.org/v2/identify/all';
const getPlantNetApiKey = () => import.meta.env.VITE_PLANTNET_API_KEY;

function getPlantNetEndpoint() {
  return import.meta.env.VITE_DISEASE_API_URL || `${getPublicApiBaseUrl()}/api/disease/identify`;
}

async function fileToDataUrl(imageFile) {
  const bytes = new Uint8Array(await imageFile.arrayBuffer());
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return `data:${imageFile.type};base64,${btoa(binary)}`;
}

/**
 * Identify plant disease from an image file.
 * @param {File} imageFile - Image captured from camera or gallery
 * @returns {Promise<Object[]>} Ranked results with confidence scores
 */
export async function identifyDisease(imageFile) {
  const apiKey = getPlantNetApiKey();

  log.info('plantnet_identify_start', { fileName: imageFile.name, size: imageFile.size });

  const useBrowserPlantNet = Boolean(apiKey);
  const body = useBrowserPlantNet
    ? (() => {
        const formData = new FormData();
        formData.append('images', imageFile);
        formData.append('organs', 'leaf');
        return formData;
      })()
    : JSON.stringify({ image: await fileToDataUrl(imageFile), organ: 'leaf' });
  const url = useBrowserPlantNet
    ? `${PLANTNET_BASE}?api-key=${apiKey}&lang=en&include-related-images=false`
    : getPlantNetEndpoint();

  try {
    const response = await fetch(url, {
      method: 'POST',
      body,
      ...(useBrowserPlantNet ? {} : { headers: { 'Content-Type': 'application/json' } }),
    });

    if (response.status === 429) {
      log.warn('plantnet_rate_limit_hit');
      throw new Error('RATE_LIMIT');
    }
    if (!response.ok) {
      log.error('plantnet_api_error', { status: response.status });
      throw new Error(response.status >= 500 ? 'API_ERROR' : `API_ERROR_${response.status}`);
    }

    const data = await response.json();
    log.info('plantnet_identify_success', { resultCount: data.results?.length });

    return (data.results || []).slice(0, 5).map((r) => ({
      scientificName: r.species?.scientificNameWithoutAuthor || '',
      commonNames: r.species?.commonNames || [],
      confidence: Math.round((r.score || 0) * 100),
      family: r.species?.family?.scientificNameWithoutAuthor || '',
    }));
  } catch (error) {
    if (error.message === 'RATE_LIMIT' || error.message.startsWith('API_ERROR')) {
      throw error;
    }
    log.error('plantnet_fetch_failed', error);
    throw new Error('NETWORK_ERROR', { cause: error });
  }
}
