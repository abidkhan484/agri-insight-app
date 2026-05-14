import log from 'loglevel';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

let model = null;

export async function loadModel() {
  if (model) return model;
  log.info('tfjs_model_loading');
  try {
    // Placeholder model URL - in a real app, this would be a valid path to model.json
    model = await tf.loadLayersModel('/models/plant-disease/model.json');
    log.info('tfjs_model_loaded');
    return model;
  } catch (error) {
    log.error('tfjs_model_load_failed', error);
    throw error;
  }
}

/**
 * Classify disease from image element using on-device model.
 * @param {HTMLImageElement|HTMLCanvasElement} imgEl
 * @returns {Promise<{label: string, confidence: number}[]>}
 */
export async function classifyDisease(imgEl) {
  try {
    const m = await loadModel();
    const tensor = tf.browser.fromPixels(imgEl)
      .resizeBilinear([224, 224])
      .expandDims(0)
      .div(255.0);

    const predictions = await m.predict(tensor).data();
    tensor.dispose();

    // Placeholder for labels - in a real app, these would match the model classes
    let LABELS = [];
    try {
      LABELS = await fetch('/models/plant-disease/labels.json').then((r) => r.json());
    } catch (e) {
      log.warn('labels_load_failed', e);
      LABELS = ['Rice Blast', 'Leaf Blight', 'Bacterial Wilt', 'Powdery Mildew']; // Mock
    }

    return Array.from(predictions)
      .map((score, i) => ({ 
        label: LABELS[i] || `Unknown Class ${i}`, 
        confidence: Math.round(score * 100) 
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  } catch (error) {
    log.error('tfjs_classification_failed', error);
    // Return empty results on failure to allow UI handling
    return [];
  }
}
