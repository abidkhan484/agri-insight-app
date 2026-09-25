import { useMemo, useState } from 'react';
import {
  filterMultiLayerCombinations,
  MULTI_LAYER_COMBINATIONS,
  MULTI_LAYER_CROP_LABELS,
  uniqueMultiLayerCrops,
} from '../utils/multiLayer';

function CropName({ crop }) {
  const label = MULTI_LAYER_CROP_LABELS[crop] || { bn: crop, en: crop };
  return <><span className="bn">{label.bn}</span><span className="en">{label.en}</span></>;
}

export default function MultiLayer() {
  const [filters, setFilters] = useState({ query: '', base: '', companion: '', vine: '' });
  const results = useMemo(() => filterMultiLayerCombinations(filters), [filters]);
  const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));

  return (
    <div className="page multi-layer-page">
      <section className="card multi-layer-intro">
        <p className="knowledge-eyebrow">চার স্তরের চাষ</p>
        <h2><span className="bn">একসঙ্গে মানানসই ফসল</span><span className="en">Compatible multi-layer crops</span></h2>
        <p className="bn">উচ্চতা, ছায়া এবং মাটির স্তর আলাদা রেখে একই জমিতে চাষের জন্য নিচের সমন্বয়গুলো দেখুন।</p>
        <p className="en">Browse crop combinations designed to use different heights, shade levels and growing spaces on the same plot.</p>
        <p className="multi-layer-note"><span className="bn">এগুলো পরিকল্পনার উদাহরণ—মাটি, জলবায়ু, মাচা ও রোগের ঝুঁকি দেখে স্থানীয় কৃষি বিশেষজ্ঞের পরামর্শ নিন।</span><span className="en">These are planning examples, not a guarantee. Check soil, climate, trellis space and disease risk locally before planting.</span></p>
        <a className="multi-layer-source" href="https://www.scribd.com/document/520471366/4-layer-eng-1" target="_blank" rel="noreferrer">উৎস / Source: Four Layer Farming Crop Guide</a>
      </section>

      <section className="card multi-layer-filters" aria-labelledby="multi-layer-filter-title">
        <h3 id="multi-layer-filter-title"><span className="bn">সমন্বয় খুঁজুন</span><span className="en">Search and filter combinations</span></h3>
        <label className="multi-layer-search"><span className="bn">ফসলের নাম দিয়ে খুঁজুন</span><span className="en">Search by crop name</span><input type="search" value={filters.query} onChange={(event) => updateFilter('query', event.target.value)} placeholder="যেমন: আদা, Ginger, করলা..." /></label>
        <div className="multi-layer-selects">
          {[
            ['base', 'প্রধান ফসল', 'Base crop', 'সব প্রধান ফসল'],
            ['companion', 'সঙ্গী ফসল', 'Companion crop', 'সব সঙ্গী ফসল'],
            ['vine', 'লতানো ফসল', 'Vine crop', 'সব লতানো ফসল'],
          ].map(([name, labelBn, labelEn, allLabel]) => <label key={name}><span className="bn">{labelBn}</span><span className="en">{labelEn}</span><select aria-label={`${labelBn} / ${labelEn}`} value={filters[name]} onChange={(event) => updateFilter(name, event.target.value)}><option value="">{allLabel}</option>{uniqueMultiLayerCrops(name).map((crop) => <option key={crop} value={crop}>{MULTI_LAYER_CROP_LABELS[crop] ? `${MULTI_LAYER_CROP_LABELS[crop].bn} / ${crop}` : crop}</option>)}</select></label>)}
        </div>
      </section>

      <section className="multi-layer-results" aria-live="polite">
        <div className="section-heading"><h2><span className="bn">পাওয়া গেছে</span><span className="en">Compatible combinations</span></h2><span className="result-count">{results.length} / {MULTI_LAYER_COMBINATIONS.length}</span></div>
        <div className="multi-layer-grid">
          {results.map((item) => <article className="card multi-layer-card" key={item.id}>
            <div className="multi-layer-card-heading"><span className="multi-layer-number">{item.number}</span><div><h3><span className="bn">চারটি ফসল</span><span className="en">Four crops together</span></h3><span className="multi-layer-season">বপন / Sowing: {item.season}</span></div></div>
            <ol>{item.crops.map((crop) => <li key={`${item.id}-${crop}`}><CropName crop={crop} /></li>)}</ol>
          </article>)}
        </div>
        {results.length === 0 && <p className="empty-state bn">এই খোঁজে কোনো সমন্বয় পাওয়া যায়নি। অন্য ফসল বা ফিল্টার দিয়ে চেষ্টা করুন।</p>}
      </section>
    </div>
  );
}
