import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { KNOWLEDGE_CATEGORIES, searchKnowledge } from '../utils/knowledge';

export default function Home() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const results = useMemo(() => searchKnowledge(query, category), [query, category]);

  return (
    <div className="page home">
      <section className="card welcome-card">
        <h2><span className="bn">স্বাগতম!</span><span className="en">Welcome!</span></h2>
        <p className="bn">জিরো বাজেট প্রাকৃতিক কৃষি (ZBNF) পদ্ধতিতে চাষাবাদ করুন। এই অ্যাপটি আপনাকে প্রয়োজনীয় সার ও কীটনাশক তৈরি করতে সাহায্য করবে।</p>
        <p className="en">Cultivate using Zero Budget Natural Farming (ZBNF). This app helps you prepare necessary fertilizers and pesticides.</p>
      </section>

      <section className="card knowledge-search" aria-labelledby="knowledge-search-title">
        <h2 id="knowledge-search-title"><span className="bn">যা জানতে চান খুঁজুন</span><span className="en">Search the knowledge base</span></h2>
        <label className="sr-only" htmlFor="knowledge-query">জ্ঞানভাণ্ডারে খুঁজুন / Search knowledge</label>
        <input
          id="knowledge-query"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="জীবামৃত, নীমাস্ত্র, ওয়াপাসা..."
        />
        <div className="category-filters" aria-label="জ্ঞানভাণ্ডারের বিষয় / Knowledge topics">
          {KNOWLEDGE_CATEGORIES.map((item) => (
            <button type="button" key={item.id} className={category === item.id ? 'filter-button active' : 'filter-button'} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>
              <span className="bn">{item.label_bn}</span><span className="en">{item.label_en}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="knowledge-results" aria-live="polite">
        <div className="section-heading">
          <h2><span className="bn">কাজ অনুযায়ী নির্দেশনা</span><span className="en">Guidance by task</span></h2>
          <span className="result-count">{results.length}টি</span>
        </div>
        {results.map((item) => (
          <article className="card knowledge-card" key={item.id}>
            <div className="knowledge-card-heading"><span className="knowledge-icon" aria-hidden="true">{item.icon}</span><h3><span className="bn">{item.title_bn}</span><span className="en">{item.title_en}</span></h3></div>
            <p className="bn">{item.summary_bn}</p><p className="en">{item.summary_en}</p>
            <details><summary><span className="bn">বিস্তারিত নির্দেশনা</span><span className="en">Read guidance</span></summary><p className="bn">{item.body_bn}</p><p className="en">{item.body_en}</p></details>
            <div className="related-links"><span className="related-label bn">সম্পর্কিত:</span>{item.links.map((link) => <Link key={link.to} to={link.to.replace(/^\//, '')}><span className="bn">{link.label_bn}</span><span className="en">{link.label_en}</span></Link>)}</div>
          </article>
        ))}
        {results.length === 0 && <p className="empty-state bn">এই বিষয়ের কোনো নির্দেশনা পাওয়া যায়নি। অন্য শব্দ দিয়ে খুঁজুন।</p>}
      </section>

      <div className="quick-links">
        <Link to="calculator" className="card link-card">
          <span className="icon">🧮</span>
          <div>
            <span className="bn">ক্যালকুলেটর</span>
            <span className="en">Calculator</span>
          </div>
        </Link>
        <Link to="pests" className="card link-card">
          <span className="icon">🐛</span>
          <div>
            <span className="bn">পোকামাকড় ও রোগ</span>
            <span className="en">Pests & Diseases</span>
          </div>
        </Link>
        <Link to="calendar" className="card link-card">
          <span className="icon">📅</span>
          <div>
            <span className="bn">ফসল পঞ্জিকা</span>
            <span className="en">Crop Calendar</span>
          </div>
        </Link>
        <Link to="glossary" className="card link-card">
          <span className="icon">📖</span>
          <div>
            <span className="bn">শব্দকোষ</span>
            <span className="en">Glossary</span>
          </div>
        </Link>
      </div>

      <section className="card note-card">
        <h3><span className="bn">সতর্কতা</span><span className="en">Caution</span></h3>
        <ul className="bn">
          <li>সব সময় দেশি গরুর গোবর ও গোমূত্র ব্যবহার করুন।</li>
          <li>কীটনাশক বিকেলে স্প্রে করা ভালো।</li>
          <li>বৃষ্টির সম্ভাবনা থাকলে স্প্রে করবেন না।</li>
        </ul>
      </section>
    </div>
  );
}
