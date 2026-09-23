import log from 'loglevel';

// Use production level if in production
log.setLevel(import.meta.env.PROD ? 'warn' : 'debug');

const PLANTNET_BASE = 'https://my.plantnet.org/v2/identify/all';
const getPlantNetApiKey = () => import.meta.env.VITE_PLANTNET_API_KEY;

/**
 * Identify plant disease from an image file.
 * @param {File} imageFile - Image captured from camera or gallery
 * @returns {Promise<Object[]>} Ranked results with confidence scores
 */
export async function identifyDisease(imageFile) {
  const apiKey = getPlantNetApiKey();
  if (!apiKey) {
    throw new Error('CONFIG_ERROR');
  }

  log.info('plantnet_identify_start', { fileName: imageFile.name, size: imageFile.size });

  const formData = new FormData();
  formData.append('images', imageFile);
  formData.append('organs', 'leaf');

  const url = `${PLANTNET_BASE}?api-key=${apiKey}&lang=en&include-related-images=false`;

  try {
    const response = await fetch(url, { method: 'POST', body: formData });

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
    if (error.message === 'RATE_LIMIT' || error.message === 'CONFIG_ERROR' || error.message.startsWith('API_ERROR')) {
      throw error;
    }
    log.error('plantnet_fetch_failed', error);
    throw new Error('NETWORK_ERROR', { cause: error });
  }
}
