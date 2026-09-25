import glossary from '../data/glossary.json';
import log from 'loglevel';
import { useLanguage } from '@shared/i18n/LanguageContext';

export default function Glossary() {
  const { isBangla } = useLanguage();
  log.debug('glossary_rendered');

  return (
    <main className="page">
      <h1>
        <span className="bn">শব্দকোষ</span>
        <span className="en">Glossary</span>
      </h1>
      <div className="glossary-list">
        {glossary.map((item, index) => (
          <article key={index} className="glossary-item">
            <h2>
              <span className="bn">{item.term_bn}</span>
              <span className="en">{item.term_en}</span>
            </h2>
            <p className="definition">{isBangla ? item.definition_bn : item.definition_en}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
