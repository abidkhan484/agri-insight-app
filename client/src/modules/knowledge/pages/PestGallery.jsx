import { useState } from 'react';
import pests from '../data/pests.json';

export default function PestGallery() {
  const [search, setSearch] = useState('');

  const filteredPests = pests.filter(p => 
    p.name_bn.toLowerCase().includes(search.toLowerCase()) ||
    p.name_en.toLowerCase().includes(search.toLowerCase()) ||
    p.crops_affected_en.some(c => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page pests">
      <h2>
        <span className="bn">পোকামাকড় ও রোগ</span>
        <span className="en">Pest & Disease Gallery</span>
      </h2>

      <div className="input-row card">
        <input 
          type="text" 
          placeholder="অনুসন্ধান করুন / Search..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="pest-grid">
        {filteredPests.map(pest => (
          <article key={pest.id} className="pest-card">
            <img src={pest.image} alt={pest.name_en} loading="lazy" />
            <div className="info">
              <h3>
                <span className="bn">{pest.name_bn}</span>
                <span className="en">{pest.name_en}</span>
              </h3>
              <p className="bn"><strong>লক্ষণ:</strong> {pest.symptoms_bn}</p>
              <p className="affected">
                <span className="bn">আক্রান্ত ফসল: </span>
                {pest.crops_affected_bn.join(', ')}
              </p>
              <div className="treatment-tag">Treatment: {pest.treatment_primary}</div>
            </div>
          </article>
        ))}
      </div>
      
      {filteredPests.length === 0 && (
        <p className="error bn">কোনো তথ্য পাওয়া যায়নি</p>
      )}
    </div>
  );
}
