import { useState } from 'react';
import pests from '../data/pests.json';
import { LanguageText, useLanguage } from '@shared/i18n/LanguageContext';

export default function PestGallery() {
  const { isBangla } = useLanguage();
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
          placeholder={isBangla ? 'অনুসন্ধান করুন...' : 'Search...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="pest-grid">
        {filteredPests.map(pest => (
          <article key={pest.id} className="pest-card">
            <div className="pest-placeholder" role="img" aria-label={`${pest.name_bn} / ${pest.name_en}`}>🐛</div>
            <div className="info">
              <h3>
                <span className="bn">{pest.name_bn}</span>
                <span className="en">{pest.name_en}</span>
              </h3>
              <p className={isBangla ? 'bn' : 'en'}><strong><LanguageText bn="লক্ষণ:" en="Symptoms:" /></strong> {isBangla ? pest.symptoms_bn : pest.symptoms_en}</p>
              <p className="affected">
                <span>{isBangla ? 'আক্রান্ত ফসল: ' : 'Affected crops: '}</span>
                {isBangla ? pest.crops_affected_bn.join(', ') : pest.crops_affected_en.join(', ')}
              </p>
              <div className="treatment-tag">Treatment: {pest.treatment_primary}</div>
            </div>
          </article>
        ))}
      </div>
      
      {filteredPests.length === 0 && (
          <p className="error"><LanguageText bn="কোনো তথ্য পাওয়া যায়নি" en="No information found" /></p>
      )}
    </div>
  );
}
