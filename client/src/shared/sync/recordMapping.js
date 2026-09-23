import { generateId } from '../../modules/krishi-record/db';

export const REMOTE_TABLES = {
  plots: 'plots',
  inputs: 'input_logs',
  observations: 'observations',
  harvests: 'harvests',
};

export function getRemoteTableName(localTableName) {
  if (!REMOTE_TABLES[localTableName]) throw new Error(`Unsupported sync table: ${localTableName}`);
  return REMOTE_TABLES[localTableName];
}

function withoutUndefined(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

export function toRemoteRecord(localTableName, record, { farmerId, plotRemoteId } = {}) {
  const base = {
    ...(record.remote_id ? { id: record.remote_id } : {}),
    created_at: record.created_at,
    updated_at: record.updated_at,
    is_deleted: record.sync_status === 'deleted',
  };

  switch (localTableName) {
    case 'plots':
      return withoutUndefined({
        ...base, farmer_id: farmerId, name: record.name, area_decimal: record.area,
        soil_type: record.soilType, latitude: record.latitude, longitude: record.longitude,
        crop: record.crop, start_date: record.startDate,
      });
    case 'inputs':
      return withoutUndefined({
        ...base, plot_id: plotRemoteId, date: record.date, type: record.type,
        quantity: record.quantity, quantity_unit: record.quantityUnit, cost: record.cost,
      });
    case 'observations':
      return withoutUndefined({
        ...base, plot_id: plotRemoteId, date: record.date, title: record.title,
        description: record.description,
      });
    case 'harvests':
      return withoutUndefined({
        ...base, plot_id: plotRemoteId, date: record.date, crop: record.crop,
        quantity: record.quantity, quantity_unit: record.quantityUnit, revenue: record.revenue,
      });
    default:
      throw new Error(`Unsupported sync table: ${localTableName}`);
  }
}

export function fromRemoteRecord(localTableName, remote, localPlotId) {
  const common = {
    id: localTableName === 'plots' ? generateId() : remote.id,
    remote_id: remote.id,
    created_at: remote.created_at,
    updated_at: remote.updated_at,
    sync_status: 'synced',
  };

  switch (localTableName) {
    case 'plots':
      return {
        ...common, name: remote.name, area: remote.area_decimal, areaUnit: 'Decimal',
        soilType: remote.soil_type, latitude: remote.latitude, longitude: remote.longitude,
        crop: remote.crop, startDate: remote.start_date,
      };
    case 'inputs':
      return {
        ...common, plotId: localPlotId ?? remote.plot_id, date: remote.date, type: remote.type,
        quantity: remote.quantity, quantityUnit: remote.quantity_unit, cost: remote.cost,
      };
    case 'observations':
      return {
        ...common, plotId: localPlotId ?? remote.plot_id, date: remote.date, title: remote.title,
        description: remote.description,
      };
    case 'harvests':
      return {
        ...common, plotId: localPlotId ?? remote.plot_id, date: remote.date, crop: remote.crop,
        quantity: remote.quantity, quantityUnit: remote.quantity_unit, revenue: remote.revenue,
      };
    default:
      throw new Error(`Unsupported sync table: ${localTableName}`);
  }
}
