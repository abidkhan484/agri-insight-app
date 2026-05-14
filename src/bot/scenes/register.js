import { Scenes } from 'telegraf';
import logger from '../../config/logger.js';
import db from '../../db/connection.js';

/**
 * Plot Registration Wizard
 * 1. Plot Name
 * 2. Area (Bigha or Decimal)
 * 3. Primary Crop
 * 4. Planting Date (DD-MM-YYYY)
 */
export const registerWizard = new Scenes.WizardScene(
  'REGISTER_PLOT_SCENE',
  // Step 1: Name
  async (ctx) => {
    ctx.wizard.state.plotData = {};
    await ctx.reply(
      'জমির নাম লিখুন (যেমন: উত্তরের মাঠ):\nPlease enter the plot name (e.g., North Field):',
    );
    return ctx.wizard.next();
  },
  // Step 2: Area
  async (ctx) => {
    ctx.wizard.state.plotData.name = ctx.message.text;
    await ctx.reply(
      'জমির পরিমাণ লিখুন (যেমন: ২ বিঘা বা ৬৬ শতাংশ):\nPlease enter the area (e.g., 2 bigha or 66 decimal):',
    );
    return ctx.wizard.next();
  },
  // Step 3: Crop
  async (ctx) => {
    const input = ctx.message.text;
    let areaDecimal = 0;

    // Simple parser for bigha/decimal
    if (input.includes('বিঘা') || input.toLowerCase().includes('bigha')) {
      const value = parseFloat(input.replace(/[^\d.]/g, ''));
      areaDecimal = value * 33;
    } else {
      areaDecimal = parseFloat(input.replace(/[^\d.]/g, ''));
    }

    if (isNaN(areaDecimal) || areaDecimal <= 0) {
      await ctx.reply(
        'দুঃখিত, পরিমাণটি সঠিক নয়। আবার চেষ্টা করুন:\nSorry, the quantity is invalid. Please try again:',
      );
      return;
    }

    ctx.wizard.state.plotData.area_decimal = areaDecimal;
    await ctx.reply('প্রধান ফসলের নাম লিখুন:\nPlease enter the primary crop name:');
    return ctx.wizard.next();
  },
  // Step 4: Planting Date
  async (ctx) => {
    ctx.wizard.state.plotData.crop = ctx.message.text;
    await ctx.reply(
      'রোপণের তারিখ লিখুন (দিন-মাস-বছর, যেমন: ১২-০৫-২০২৪):\nPlease enter the planting date (DD-MM-YYYY, e.g., 12-05-2024):',
    );
    return ctx.wizard.next();
  },
  // Final Step: Save
  async (ctx) => {
    const dateStr = ctx.message.text;
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = dateStr.match(dateRegex);

    if (!match) {
      await ctx.reply(
        'তারিখের ফরম্যাট সঠিক নয় (দিন-মাস-বছর)। আবার চেষ্টা করুন:\nInvalid date format (DD-MM-YYYY). Please try again:',
      );
      return;
    }

    const [_, d, m, y] = match;
    const plantingDate = `${y}-${m}-${d}`; // ISO format for SQLite

    ctx.wizard.state.plotData.start_date = plantingDate;

    // Get farmer from DB
    const telegramId = ctx.from.id.toString();
    const farmer = db.prepare('SELECT id FROM farmers WHERE telegram_id = ?').get(telegramId);

    if (!farmer) {
      await ctx.reply(
        'আপনি এখনও নিবন্ধিত নন। অনুগ্রহ করে আগে /start ব্যবহার করুন।\nYou are not registered yet. Please use /start first.',
      );
      return ctx.scene.leave();
    }

    try {
      const { name, area_decimal, crop, start_date } = ctx.wizard.state.plotData;

      const info = db
        .prepare(
          `
        INSERT INTO plots (farmer_id, name, area_decimal, crop, start_date)
        VALUES (?, ?, ?, ?, ?)
      `,
        )
        .run(farmer.id, name, area_decimal, crop, start_date);

      const plotId = info.lastInsertRowid;

      // Create default reminders
      const defaultReminders = [
        { type: 'jeevamrutha', interval_days: 15 },
        { type: 'neemastra', interval_days: 14 },
        { type: 'mulch', interval_days: 7 },
        { type: 'irrigation', interval_days: 3 }, // Default check interval
      ];

      const stmt = db.prepare(`
        INSERT INTO reminders (plot_id, type, interval_days, next_due)
        VALUES (?, ?, ?, ?)
      `);

      for (const r of defaultReminders) {
        const nextDue = new Date();
        nextDue.setDate(nextDue.getDate() + r.interval_days);
        stmt.run(plotId, r.type, r.interval_days, nextDue.toISOString().split('T')[0]);
      }

      logger.info('Plot registered successfully', { farmerId: farmer.id, plotName: name });
      await ctx.reply(
        `অভিনন্দন! "${name}" জমিটি নিবন্ধিত হয়েছে। আমরা আপনাকে নিয়মিত জীবামৃত এবং অন্যান্য যত্ন নেওয়ার কথা মনে করিয়ে দেব।\nCongratulations! "${name}" plot has been registered. We will regularly remind you about Jeevamrutha and other care.`,
      );
    } catch (error) {
      logger.error('Failed to register plot', { error, telegramId });
      await ctx.reply(
        'দুঃখিত, কোনো সমস্যা হয়েছে। পরে চেষ্টা করুন।\nSorry, something went wrong. Please try again later.',
      );
    }

    return ctx.scene.leave();
  },
);
