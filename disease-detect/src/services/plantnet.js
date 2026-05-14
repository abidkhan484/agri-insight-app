import log from 'loglevel';

// Use production level if in production
log.setLevel(import.meta.env.PROD ? 'warn' : 'debug');

const PLANTNET_BASE = 'https://my.plantnet.org/v2/identify/all';
// Default key is PlantNet's public demo key — replace with own key for production
const PLANTNET_API_KEY = import.meta.env.VITE_PLANTNET_API_KEY || '2b10xE7EOOO0yPO1Cx5piB1Dg';

/**
 * Identify plant disease from an image file.
 * @param {File} imageFile - Image captured from camera or gallery
 * @returns {Promise<Object[]>} Ranked results with confidence scores
 */
export async function identifyDisease(imageFile) {
  log.info('plantnet_identify_start', { fileName: imageFile.name, size: imageFile.size });

  const formData = new FormData();
  formData.append('images', imageFile);
  formData.append('organs', 'leaf');

  const url = `${PLANTNET_BASE}?api-key=${PLANTNET_API_KEY}&lang=en&include-related-images=false`;

  try {
    const response = await fetch(url, { method: 'POST', body: formData });

    if (response.status === 429) {
      log.warn('plantnet_rate_limit_hit');
      throw new Error('RATE_LIMIT');
    }
    if (!response.ok) {
      log.error('plantnet_api_error', { status: response.status });
      throw new Error(`PlantNet error: ${response.status}`);
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
    if (error.message === 'RATE_LIMIT') throw error;
    log.error('plantnet_fetch_failed', error);
    throw new Error('NETWORK_ERROR');
  }
}
