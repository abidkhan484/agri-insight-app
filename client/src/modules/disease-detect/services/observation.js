import { db, generateId } from '../../krishi-record/db';

export async function saveDiseaseObservation({ plotId = '', date, result, treatment }) {
  const scientificName = result.scientificName || 'Unknown plant';
  const confidence = result.confidence ?? 0;
  const title = treatment.known ? treatment.name_bn : 'রোগ শনাক্তকরণ পর্যবেক্ষণ';
  const description = [
    `PlantNet: ${scientificName}`,
    `Confidence: ${confidence}%`,
    treatment.known ? `সম্ভাব্য রোগ: ${treatment.name_bn} (${treatment.name_en})` : 'নির্দিষ্ট রোগ নিশ্চিত নয়',
  ].join('\n');

  await db.observations.add({
    id: generateId(),
    plotId,
    date,
    title,
    description,
    source: 'plantnet',
    detection: {
      scientificName,
      confidence,
      treatmentKey: treatment.key,
    },
    sync_status: 'dirty',
    updated_at: new Date().toISOString(),
  });
}
