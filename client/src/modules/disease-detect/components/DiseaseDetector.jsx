import { useRef, useState } from 'react';
import log from 'loglevel';
import { LanguageText, useLanguage } from '@shared/i18n/LanguageContext';
import { identifyDisease } from '../services/plantnet.js';
import { saveDiseaseObservation } from '../services/observation.js';
import { prepareImage } from '../utils/image.js';
import { lookupTreatment } from '../utils/lookup-treatment.js';

log.setLevel(import.meta.env.PROD ? 'warn' : 'debug');

const CONFIDENCE_THRESHOLD = 30;
const crops = [
  { value: 'rice', label: 'ধান', en: 'Rice' },
  { value: 'tomato', label: 'টমেটো', en: 'Tomato' },
  { value: 'potato', label: 'আলু', en: 'Potato' },
  { value: 'maize', label: 'ভুট্টা', en: 'Maize' },
  { value: 'other', label: 'অন্যান্য', en: 'Other' },
];

const errorCopy = {
  IMAGE_REQUIRED: ['ছবি নির্বাচন করুন।', 'Please choose an image.'],
  INVALID_IMAGE_TYPE: ['শুধু ছবি ফাইল ব্যবহার করুন।', 'Please choose an image file.'],
  IMAGE_TOO_LARGE: ['ছবির আকার ১০ MB-এর কম হতে হবে।', 'The image must be smaller than 10 MB.'],
  CONFIG_ERROR: ['রোগ শনাক্তকরণ এখনো সেটআপ করা হয়নি।', 'PlantNet is not configured for this deployment.'],
  RATE_LIMIT: ['আজকের শনাক্তকরণ সীমা শেষ। পরে আবার চেষ্টা করুন।', 'The daily identification limit has been reached. Try again later.'],
  NETWORK_ERROR: ['ইন্টারনেট সংযোগ নেই বা অনলাইন সেবা পাওয়া যাচ্ছে না।', 'The online service is unavailable. Check your internet connection.'],
  API_ERROR: ['অনলাইন শনাক্তকরণ সেবা সাময়িকভাবে ব্যস্ত। পরে আবার চেষ্টা করুন।', 'The online identification service is temporarily unavailable.'],
};

function getErrorCopy(error) {
  const code = error?.message?.startsWith('API_ERROR') ? 'API_ERROR' : error?.message;
  return errorCopy[code] || ['শনাক্তকরণ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', 'Detection failed. Please try again.'];
}

function confidenceLabel(confidence) {
  if (confidence >= 60) return ['উচ্চ আত্মবিশ্বাস', 'Higher confidence'];
  if (confidence >= CONFIDENCE_THRESHOLD) return ['মাঝারি আত্মবিশ্বাস', 'Moderate confidence'];
  return ['কম আত্মবিশ্বাস — নিশ্চিত নয়', 'Low confidence — not confirmed'];
}

export default function DiseaseDetector() {
  const { isBangla } = useLanguage();
  const [crop, setCrop] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef(null);

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      if (!navigator.onLine) throw new Error('NETWORK_ERROR');
      const detections = await identifyDisease(await prepareImage(file));
      const topResult = detections[0];
      if (!topResult || topResult.confidence < CONFIDENCE_THRESHOLD) {
        setResult({ detections, uncertain: true });
        return;
      }
      const treatment = lookupTreatment(topResult.scientificName);
      setResult({ detections, treatment, uncertain: false });
      log.info('disease_detected', { crop, confidence: topResult.confidence, resultCount: detections.length });
    } catch (detectionError) {
      log.error('detection_failed', { code: detectionError.message });
      setError(getErrorCopy(detectionError));
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveObservation() {
    if (!result?.detections?.[0]) return;
    try {
      await saveDiseaseObservation({
        result: result.detections[0],
        treatment: result.treatment || lookupTreatment(''),
        date: new Date().toISOString().split('T')[0],
      });
      setSaved(true);
    } catch (saveError) {
      log.error('disease_observation_save_failed', { code: saveError.message });
      setError(['পর্যবেক্ষণ সংরক্ষণ করা যায়নি।', 'The observation could not be saved.']);
    }
  }

  const topResult = result?.detections?.[0];
  const confidence = topResult?.confidence || 0;
  const confidenceText = confidenceLabel(confidence);

  return (
    <main className="detector-container">
      <header>
        <h1 className="main-title"><span className="bn">ফসলের রোগ ও পোকা শনাক্তকরণ</span><span className="en">Online crop health check</span></h1>
        <p className="online-note"><span className="bn">এই সেবা ব্যবহার করতে ইন্টারনেট সংযোগ প্রয়োজন।</span><span className="en">Internet connection is required.</span></p>
      </header>

      <section className="guidance-card" aria-labelledby="photo-guidance-title">
        <h2 id="photo-guidance-title"><span className="bn">ভালো ছবি তোলার নিয়ম</span><span className="en">Photo guidance</span></h2>
        <ul>
          <li><span className="bn">পাতার দুই পাশের পরিষ্কার ছবি তুলুন</span><span className="en">Photograph both sides of the leaf clearly</span></li>
          <li><span className="bn">ছায়া ও ঝাপসা এড়িয়ে দিনের আলো ব্যবহার করুন</span><span className="en">Use daylight and avoid shadows or blur</span></li>
          <li><span className="bn">একটি গাছের আক্রান্ত অংশ ফ্রেমে রাখুন</span><span className="en">Keep the affected part of one plant in frame</span></li>
        </ul>
      </section>

      <section className="upload-section" aria-label="Disease photo upload">
        <label htmlFor="crop-select"><span className="bn">ফসল নির্বাচন করুন</span><span className="en">Select crop</span></label>
        <select id="crop-select" value={crop} onChange={(event) => setCrop(event.target.value)}>
          <option value="">{isBangla ? 'ফসল বেছে নিন (ঐচ্ছিক)' : 'Select crop (optional)'}</option>
          {crops.map((item) => <option key={item.value} value={item.value}>{isBangla ? item.label : item.en}</option>)}
        </select>
        <label className="upload-btn" htmlFor="disease-photo"><span className="bn">ছবি তুলুন বা আপলোড করুন</span><span className="en">Take photo or upload</span></label>
        <input ref={inputRef} id="disease-photo" type="file" accept="image/*" capture="environment" onChange={handleImageChange} />
      </section>

      {previewUrl && <img src={previewUrl} alt={isBangla ? 'আপলোড করা গাছের ছবি' : 'Uploaded plant'} className="image-preview" />}
      {loading && <div className="loading-spinner" role="status"><span className="bn">ছবি বিশ্লেষণ করা হচ্ছে...</span><span className="en">Checking photo online...</span></div>}
      {error && <div className="error-message" role="alert"><span className="bn">{error[0]}</span><span className="en">{error[1]}</span></div>}

      {result?.uncertain && <div className="uncertain-message" role="status"><h2><span className="bn">ছবি থেকে নিশ্চিত শনাক্ত করা যায়নি</span><span className="en">No qualified result</span></h2><p><span className="bn">আরও পরিষ্কার ছবি তুলে আবার চেষ্টা করুন। এই ফলকে নিশ্চিত রোগ ধরে কোনো চিকিৎসা শুরু করবেন না।</span><span className="en">Retake a clearer photo. Do not start treatment based on this result.</span></p><button type="button" onClick={() => inputRef.current?.click()}><LanguageText bn="আবার ছবি তুলুন" en="Try another photo" /></button></div>}

      {result && !result.uncertain && topResult && (
        <article className="result-card fade-in">
          <div className="result-header"><div><h2 className="disease-name"><span className="bn">{result.treatment.name_bn}</span><span className="en">{result.treatment.name_en}</span></h2><p className="qualified-note"><span className="bn">PlantNet-এর সম্ভাব্য মিল — রোগ নিশ্চিত নয়</span><span className="en">PlantNet qualified match — not a confirmed diagnosis</span></p></div><div className="confidence-badge"><span className="bn">{confidenceText[0]}</span><span className="en">{confidence}% · {confidenceText[1]}</span></div></div>
          <div className="result-section"><h3><span className="bn">সম্ভাব্য উপসর্গ</span><span className="en">Possible symptoms</span></h3><p className="bn">{result.treatment.symptoms_bn}</p><p className="en">{result.treatment.symptoms_en}</p></div>
          <div className="result-section treatment"><h3><span className="bn">নথিভুক্ত ZBNF নির্দেশনা</span><span className="en">Documented ZBNF guidance</span></h3><p className="treatment-step bn">{result.treatment.treatment.schedule_bn}</p><p className="treatment-step en">{result.treatment.treatment.schedule_en}</p>{result.treatment.treatment.secondary && <p className="secondary-hint">{isBangla ? 'Secondary formulation' : 'Secondary formulation'}: {result.treatment.treatment.secondary}</p>}</div>
          <p className="detection-metadata">PlantNet: {topResult.scientificName || 'Unknown'} · {confidence}%</p>
          <button type="button" className="save-observation" onClick={handleSaveObservation} disabled={saved}><LanguageText bn={saved ? 'সংরক্ষিত হয়েছে' : 'পর্যবেক্ষণ হিসেবে সংরক্ষণ করুন'} en={saved ? 'Saved' : 'Save observation'} /></button>
        </article>
      )}
    </main>
  );
}
