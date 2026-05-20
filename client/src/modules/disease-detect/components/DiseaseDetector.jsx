import { useState, useRef } from 'react';
import log from 'loglevel';
import { identifyDisease } from '../services/plantnet.js';
import { classifyDisease } from '../services/tfjs-fallback.js';
import { lookupTreatment } from '../utils/lookup-treatment.js';

log.setLevel(import.meta.env.PROD ? 'warn' : 'debug');

export default function DiseaseDetector() {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const imgRef = useRef(null);

  async function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    // Set preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      let detections;
      try {
        // Step 1: Try PlantNet API (Phase 1 MVP)
        detections = await identifyDisease(file);
      } catch (err) {
        // Step 2: Fallback to TF.js if rate limited or offline (Phase 4)
        if (err.message === 'RATE_LIMIT' || err.message === 'NETWORK_ERROR' || !navigator.onLine) {
          log.warn('plantnet_unavailable_using_tfjs', err.message);
          
          const imgEl = imgRef.current;
          imgEl.src = url;
          await new Promise((resolve) => {
            imgEl.onload = resolve;
          });
          
          detections = await classifyDisease(imgEl);
          
          if (detections.length === 0) {
            throw new Error('FALLBACK_FAILED');
          }
        } else {
          throw err;
        }
      }

      const topResult = detections[0];
      const scientificName = topResult.scientificName || topResult.label || '';
      const treatment = lookupTreatment(scientificName);
      
      setResult({ detections, treatment });
      log.info('disease_detected', { 
        topResult: scientificName, 
        confidence: topResult.confidence 
      });
    } catch (err) {
      log.error('detection_failed', { error: err.message });
      setError('শনাক্তকরণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।\nDetection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="detector-container">
      <h1 className="main-title">
        <span className="bn">ফসলের রোগ শনাক্তকরণ</span>
        <span className="en">Crop Disease Detection</span>
      </h1>

      <div className="upload-section">
        <label className="upload-btn">
          <span className="bn">ছবি তুলুন বা আপলোড করুন</span>
          <span className="en">Take Photo or Upload</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div className="preview-container">
        {previewUrl && (
          <img 
            ref={imgRef} 
            src={previewUrl} 
            alt="Captured plant" 
            className="image-preview"
          />
        )}
      </div>

      {loading && (
        <div className="loading-spinner">
          <p className="bn">শনাক্ত করা হচ্ছে...</p>
          <p className="en">Identifying...</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {result && (
        <div className="result-card fade-in">
          <div className="result-header">
            <h2 className="disease-name">
              <span className="bn">{result.treatment.name_bn}</span>
              <span className="en">{result.treatment.name_en}</span>
            </h2>
            <div className="confidence-badge">
              {result.detections[0].confidence}% Confidence
            </div>
          </div>

          <div className="result-section">
            <h3>
              <span className="bn">উপসর্গ</span> / <span className="en">Symptoms</span>
            </h3>
            <p className="bn">{result.treatment.symptoms_bn}</p>
            <p className="en">{result.treatment.symptoms_en}</p>
          </div>

          <div className="result-section treatment">
            <h3>
              <span className="bn">প্রাকৃতিক চিকিৎসা (ZBNF)</span> / <span className="en">Treatment</span>
            </h3>
            <div className="treatment-details">
              <p className="treatment-step bn">
                <strong>প্রধান ব্যবস্থা:</strong> {result.treatment.treatment.schedule_bn}
              </p>
              <p className="treatment-step en">
                <strong>Action:</strong> {result.treatment.treatment.schedule_en}
              </p>
              {result.treatment.treatment.secondary && (
                <p className="secondary-hint">
                  Secondary formulation: {result.treatment.treatment.secondary}
                </p>
              )}
            </div>
          </div>
          
          <div className="detection-metadata">
            <p>Scientific ID: {result.detections[0].scientificName || result.detections[0].label}</p>
          </div>
        </div>
      )}
    </div>
  );
}
