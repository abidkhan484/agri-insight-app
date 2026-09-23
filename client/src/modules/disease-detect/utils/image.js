const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function validateImageFile(file) {
  if (!file) {
    throw new Error('IMAGE_REQUIRED');
  }

  if (!file.type?.startsWith('image/')) {
    throw new Error('INVALID_IMAGE_TYPE');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('IMAGE_TOO_LARGE');
  }

  return file;
}

/**
 * Validate a captured image before sending it to PlantNet.
 * Browser-side resizing is deliberately avoided here so camera images retain
 * diagnostic detail; PlantNet performs its own request-side preparation.
 */
export async function prepareImage(file) {
  return validateImageFile(file);
}

export const imageLimits = {
  maxBytes: MAX_IMAGE_BYTES,
};
