import knowledge from '../data/knowledge.json';

export const KNOWLEDGE_CATEGORIES = [
  { id: 'all', label_bn: 'সব বিষয়', label_en: 'All topics' },
  { id: 'formulation', label_bn: 'দ্রবণ তৈরি', label_en: 'Formulations' },
  { id: 'pest', label_bn: 'পোকা দমন', label_en: 'Pest control' },
  { id: 'field', label_bn: 'জমির যত্ন', label_en: 'Field care' },
  { id: 'schedule', label_bn: 'সময়সূচি', label_en: 'Schedules' },
];

export function searchKnowledge(query = '', category = 'all') {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return knowledge.filter((item) => {
    const categoryMatches = category === 'all' || item.category === category;
    const text = [item.title_bn, item.title_en, item.summary_bn, item.summary_en, item.body_bn, item.body_en].join(' ').toLocaleLowerCase();
    return categoryMatches && (!normalizedQuery || text.includes(normalizedQuery));
  });
}

export { knowledge };
