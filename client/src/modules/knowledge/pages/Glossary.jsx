import glossary from '../data/glossary.json';
import log from 'loglevel';

export default function Glossary() {
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
            <p className="definition">{item.definition_bn}</p>
            <p className="definition-en">{item.definition_en}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
