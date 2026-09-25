import { useMemo, useState } from 'react';
import {
  filterMultiLayerCombinations,
  MULTI_LAYER_COMBINATIONS,
  MULTI_LAYER_CROP_LABELS,
  uniqueMultiLayerCrops,
} from '../utils/multiLayer';
import { LanguageText, useLanguage } from '@shared/i18n/LanguageContext';

const PAGE_SIZE = 12;

function CropName({ crop }) {
  const label = MULTI_LAYER_CROP_LABELS[crop] || { bn: crop, en: crop };
  return <><span className="bn">{label.bn}</span><span className="en">{label.en}</span></>;
}

export default function MultiLayer() {
  const { isBangla } = useLanguage();
  const [filters, setFilters] = useState({ query: '', base: '', companion: '', vine: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const results = useMemo(() => filterMultiLayerCombinations(filters), [filters]);
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const visibleResults = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const firstResult = results.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const lastResult = Math.min(currentPage * PAGE_SIZE, results.length);
  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setCurrentPage(1);
  };

  return (
    <div className="page multi-layer-page">
      <section className="card multi-layer-intro">
        <p className="knowledge-eyebrow"><LanguageText bn="চার স্তরের চাষ" en="Four-layer farming" /></p>
        <h2><span className="bn">একসঙ্গে মানানসই ফসল</span><span className="en">Compatible multi-layer crops</span></h2>
        <p className="bn">উচ্চতা, ছায়া এবং মাটির স্তর আলাদা রেখে একই জমিতে চাষের জন্য নিচের সমন্বয়গুলো দেখুন।</p>
        <p className="en">Browse crop combinations designed to use different heights, shade levels and growing spaces on the same plot.</p>
        <p className="multi-layer-note"><LanguageText bn="এগুলো পরিকল্পনার উদাহরণ—মাটি, জলবায়ু, মাচা ও রোগের ঝুঁকি দেখে স্থানীয় কৃষি বিশেষজ্ঞের পরামর্শ নিন।" en="These are planning examples, not a guarantee. Check soil, climate, trellis space and disease risk locally before planting." /></p>
        <a className="multi-layer-source" href="https://www.scribd.com/document/520471366/4-layer-eng-1" target="_blank" rel="noreferrer"><LanguageText bn="উৎস: Four Layer Farming Crop Guide" en="Source: Four Layer Farming Crop Guide" /></a>
      </section>

      <section className="card multi-layer-filters" aria-labelledby="multi-layer-filter-title">
        <h3 id="multi-layer-filter-title"><span className="bn">সমন্বয় খুঁজুন</span><span className="en">Search and filter combinations</span></h3>
        <label className="multi-layer-search"><LanguageText bn="ফসলের নাম দিয়ে খুঁজুন" en="Search by crop name" /><input type="search" value={filters.query} onChange={(event) => updateFilter('query', event.target.value)} placeholder={isBangla ? 'যেমন: আদা, করলা...' : 'For example: ginger, bitter gourd...'} /></label>
        <div className="multi-layer-selects">
          {[
            ['base', 'প্রধান ফসল', 'Base crop', 'সব প্রধান ফসল'],
            ['companion', 'সঙ্গী ফসল', 'Companion crop', 'সব সঙ্গী ফসল'],
            ['vine', 'লতানো ফসল', 'Vine crop', 'সব লতানো ফসল'],
          ].map(([name, labelBn, labelEn, allLabel]) => <label key={name}><LanguageText bn={labelBn} en={labelEn} /><select aria-label={`${labelBn} / ${labelEn}`} value={filters[name]} onChange={(event) => updateFilter(name, event.target.value)}><option value="">{isBangla ? allLabel : `All ${labelEn.toLowerCase()}`}</option>{uniqueMultiLayerCrops(name).map((crop) => <option key={crop} value={crop}>{MULTI_LAYER_CROP_LABELS[crop] ? (isBangla ? MULTI_LAYER_CROP_LABELS[crop].bn : MULTI_LAYER_CROP_LABELS[crop].en) : crop}</option>)}</select></label>)}
        </div>
      </section>

      <section className="multi-layer-results" aria-live="polite">
        <div className="section-heading"><h2><span className="bn">পাওয়া গেছে</span><span className="en">Compatible combinations</span></h2><span className="result-count">{results.length} / {MULTI_LAYER_COMBINATIONS.length}</span></div>
        <div className="multi-layer-grid">
          {visibleResults.map((item) => <article className="card multi-layer-card" key={item.id}>
            <div className="multi-layer-card-heading"><span className="multi-layer-number">{item.number}</span><div><h3><LanguageText bn="চারটি ফসল" en="Four crops together" /></h3><span className="multi-layer-season">{isBangla ? 'বপন' : 'Sowing'}: {item.season}</span></div></div>
            <ol>{item.crops.map((crop) => <li key={`${item.id}-${crop}`}><CropName crop={crop} /></li>)}</ol>
          </article>)}
        </div>
        {results.length > 0 && <nav className="multi-layer-pagination" aria-label={isBangla ? 'বহুস্তর ফসলের পৃষ্ঠা নেভিগেশন' : 'Multi-layer crop pagination'}>
          <button type="button" className="filter-button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}><span className="bn">আগের পৃষ্ঠা</span><span className="en">Previous</span></button>
          <span className="multi-layer-page-status"><span className="bn">পৃষ্ঠা {currentPage} / {totalPages}</span><span className="en">Showing {firstResult}–{lastResult} of {results.length}</span></span>
          <button type="button" className="filter-button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}><span className="bn">পরের পৃষ্ঠা</span><span className="en">Next</span></button>
        </nav>}
        {results.length === 0 && <p className="empty-state"><LanguageText bn="এই খোঁজে কোনো সমন্বয় পাওয়া যায়নি। অন্য ফসল বা ফিল্টার দিয়ে চেষ্টা করুন।" en="No combinations matched. Try another crop or filter." /></p>}
      </section>
    </div>
  );
}
