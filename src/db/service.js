import supabase from './connection.js';
import logger from '../config/logger.js';

/**
 * Service to handle data persistence, abstracting the underlying DB provider.
 * Currently uses Supabase, but designed to be easily swapped.
 */
export const dbService = {
  // Farmers
  async getFarmerByTelegramId(telegramId) {
    const { data, error } = await supabase
      .from('farmers')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();
    if (error && error.code !== 'PGRST116')
      logger.error('DB Error: getFarmerByTelegramId', { error, telegramId });
    return data;
  },

  async registerFarmer(telegramId, name) {
    const { data, error } = await supabase
      .from('farmers')
      .upsert({ telegram_id: telegramId, name }, { onConflict: 'telegram_id' })
      .select()
      .single();
    if (error) logger.error('DB Error: registerFarmer', { error, telegramId });
    return data;
  },

  // Plots
  async createPlot(farmerId, plotData) {
    const { data, error } = await supabase
      .from('plots')
      .insert({ farmer_id: farmerId, ...plotData })
      .select()
      .single();
    if (error) logger.error('DB Error: createPlot', { error, farmerId });
    return data;
  },

  async getPlotsByFarmerId(farmerId) {
    const { data, error } = await supabase.from('plots').select('*').eq('farmer_id', farmerId);
    if (error) logger.error('DB Error: getPlotsByFarmerId', { error, farmerId });
    return data || [];
  },

  async getPlotsByFarmerIdFromTelegram(telegramId) {
    const { data, error } = await supabase
      .from('plots')
      .select('*, farmers!inner(telegram_id)')
      .eq('farmers.telegram_id', telegramId);
    if (error) logger.error('DB Error: getPlotsByFarmerIdFromTelegram', { error, telegramId });
    return data || [];
  },

  async deletePlotByTelegramId(telegramId, plotName) {
    // Check ownership first
    const { data: plot } = await supabase
      .from('plots')
      .select('id, farmers!inner(telegram_id)')
      .eq('farmers.telegram_id', telegramId)
      .eq('name', plotName)
      .single();

    if (!plot) return false;

    // Supabase will handle related reminders if ON DELETE CASCADE is set in Postgres,
    // otherwise we delete them manually. Let's assume manual for safety.
    await supabase.from('reminders').delete().eq('plot_id', plot.id);
    const { error } = await supabase.from('plots').delete().eq('id', plot.id);

    if (error) logger.error('DB Error: deletePlotByTelegramId', { error, telegramId, plotName });
    return !error;
  },

  async deletePlot(farmerId, plotName) {
    const { error } = await supabase
      .from('plots')
      .delete()
      .eq('farmer_id', farmerId)
      .eq('name', plotName);
    if (error) logger.error('DB Error: deletePlot', { error, farmerId, plotName });
    return !error;
  },

  // Reminders
  async createReminder(plotId, reminderData) {
    const { data, error } = await supabase
      .from('reminders')
      .insert({ plot_id: plotId, ...reminderData })
      .select()
      .single();
    if (error) logger.error('DB Error: createReminder', { error, plotId });
    return data;
  },

  async getRemindersByFarmerId(farmerId) {
    const { data, error } = await supabase
      .from('reminders')
      .select('*, plots!inner(*)')
      .eq('plots.farmer_id', farmerId);
    if (error) logger.error('DB Error: getRemindersByFarmerId', { error, farmerId });
    return data || [];
  },

  async getRemindersByTelegramId(telegramId) {
    const { data, error } = await supabase
      .from('reminders')
      .select('*, plots!inner(name, farmers!inner(telegram_id))')
      .eq('plots.farmers.telegram_id', telegramId)
      .eq('active', true);
    if (error) logger.error('DB Error: getRemindersByTelegramId', { error, telegramId });
    return data || [];
  },

  async cancelReminderByTelegramId(telegramId, reminderId) {
    // Check ownership first
    const { data: reminder } = await supabase
      .from('reminders')
      .select('id, plots!inner(farmers!inner(telegram_id))')
      .eq('id', reminderId)
      .eq('plots.farmers.telegram_id', telegramId)
      .single();

    if (!reminder) return false;

    const { error } = await supabase
      .from('reminders')
      .update({ active: false })
      .eq('id', reminderId);

    if (error) logger.error('DB Error: cancelReminderByTelegramId', { error, reminderId });
    return !error;
  },

  async cancelReminder(farmerId, reminderId) {
    // Complex join delete is tricky in Supabase RLS, simpler to check ownership first
    const { data: reminder } = await supabase
      .from('reminders')
      .select('id, plots!inner(farmer_id)')
      .eq('id', reminderId)
      .eq('plots.farmer_id', farmerId)
      .single();

    if (!reminder) return false;

    const { error } = await supabase
      .from('reminders')
      .update({ active: false })
      .eq('id', reminderId);

    if (error) logger.error('DB Error: cancelReminder', { error, reminderId });
    return !error;
  },

  // Soil Readings
  async getLatestSoilReading(plotId) {
    const { data, error } = await supabase
      .from('soil_readings')
      .select('*')
      .eq('plot_id', plotId)
      .order('ts', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116')
      logger.error('DB Error: getLatestSoilReading', { error, plotId });
    return data;
  },

  // Map Registrations
  async isFarmerOnMap(telegramId) {
    const { data, error } = await supabase
      .from('map_registrations')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
    if (error && error.code !== 'PGRST116')
      logger.error('DB Error: isFarmerOnMap', { error, telegramId });
    return !!data;
  },

  async recordMapRegistration(telegramId) {
    const { error } = await supabase
      .from('map_registrations')
      .upsert({ telegram_id: telegramId }, { onConflict: 'telegram_id' });
    if (error) logger.error('DB Error: recordMapRegistration', { error, telegramId });
    return !error;
  },

  // Updates & Community
  async updateFarmer(telegramId, updateData) {
    const { error } = await supabase
      .from('farmers')
      .update(updateData)
      .eq('telegram_id', telegramId);
    if (error) logger.error('DB Error: updateFarmer', { error, telegramId });
    return !error;
  },

  async findCowSuppliers(district) {
    const { data, error } = await supabase
      .from('farmers')
      .select('name, district, upazila')
      .eq('has_desi_cow', true)
      .ilike('district', `%${district}%`);
    if (error) logger.error('DB Error: findCowSuppliers', { error, district });
    return data || [];
  },

  async getNeighborsInUpazila(upazila, excludeTelegramId) {
    const { data, error } = await supabase
      .from('farmers')
      .select('telegram_id')
      .eq('upazila', upazila)
      .neq('telegram_id', excludeTelegramId);
    if (error) logger.error('DB Error: getNeighborsInUpazila', { error, upazila });
    return data || [];
  },

  // Engine & Cron Helpers
  async getDueReminders() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('reminders')
      .select('*, plots!inner(name, area_decimal, farmer_id, farmers!inner(telegram_id))')
      .eq('active', true)
      .lte('next_due', today);
    if (error) logger.error('DB Error: getDueReminders', { error });
    return data || [];
  },

  async logReminder(reminderId, message) {
    const { error } = await supabase
      .from('reminder_logs')
      .insert({ reminder_id: reminderId, message });
    if (error) logger.error('DB Error: logReminder', { error, reminderId });
    return !error;
  },

  async updateReminderNextDue(reminderId, intervalDays) {
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + intervalDays);
    const { error } = await supabase
      .from('reminders')
      .update({ next_due: nextDue.toISOString().split('T')[0] })
      .eq('id', reminderId);
    if (error) logger.error('DB Error: updateReminderNextDue', { error, reminderId });
    return !error;
  },

  async deactivateReminder(reminderId) {
    const { error } = await supabase
      .from('reminders')
      .update({ active: false })
      .eq('id', reminderId);
    if (error) logger.error('DB Error: deactivateReminder', { error, reminderId });
    return !error;
  },

  // Weather Helpers
  async getPlotsWithGPS() {
    const { data, error } = await supabase
      .from('plots')
      .select('*, farmers!inner(telegram_id)')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);
    if (error) logger.error('DB Error: getPlotsWithGPS', { error });
    return data || [];
  },

  async logWeatherAlert(plotId, alertType, message, forecastData) {
    const { error } = await supabase.from('weather_alerts').insert({
      plot_id: plotId,
      alert_type: alertType,
      message: message,
      forecast_data: JSON.stringify(forecastData),
    });
    if (error) logger.error('DB Error: logWeatherAlert', { error, plotId });
    return !error;
  },
};
