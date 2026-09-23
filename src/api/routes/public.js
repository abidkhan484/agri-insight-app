/* global Blob, Buffer, FormData */
import { getFarmerLocations } from '../../services/supabase.js';
import { config } from '../../config/index.js';
import logger from '../../config/logger.js';

const PLANTNET_URL = 'https://my.plantnet.org/v2/identify/all';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function decodeImage(dataUrl) {
  const match = /^data:(image\/[\w.+-]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) throw new Error('INVALID_IMAGE');
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw new Error('INVALID_IMAGE');
  return { mimeType: match[1], buffer };
}

export async function publicMapLocations(_req, res) {
  const locations = await getFarmerLocations();
  res.json(200, { locations });
}

export async function publicDiseaseIdentify(req, res) {
  if (!config.plantnetApiKey) {
    res.json(503, { error: 'DISEASE_SERVICE_NOT_CONFIGURED' });
    return;
  }

  const { mimeType, buffer } = decodeImage(req.body?.image);
  const formData = new FormData();
  formData.append('images', new Blob([buffer], { type: mimeType }), 'plant-image');
  formData.append('organs', req.body?.organ || 'leaf');

  const response = await fetch(
    `${PLANTNET_URL}?api-key=${config.plantnetApiKey}&lang=en&include-related-images=false`,
    {
      method: 'POST',
      body: formData,
    },
  );
  if (response.status === 429) {
    res.json(429, { error: 'RATE_LIMIT' });
    return;
  }
  if (!response.ok) {
    logger.error('public_disease_api_failed', { status: response.status });
    res.json(502, { error: 'API_ERROR' });
    return;
  }
  res.json(200, await response.json());
}
