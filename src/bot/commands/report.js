import { dbService } from '../../db/service.js';
import logger from '../../config/logger.js';

const monthsMap = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
  জানুয়ারি: 1,
  ফেব্রুয়ারি: 2,
  মার্চ: 3,
  এপ্রিল: 4,
  মে: 5,
  জুন: 6,
  জুলাই: 7,
  আগস্ট: 8,
  সেপ্টেম্বর: 9,
  অক্টোবর: 10,
  নভেম্বর: 11,
  ডিসেম্বর: 12,
};

const banglaMonthNames = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const toBanglaDigits = (num) => {
  if (num === null || num === undefined) return '';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[d]);
};

const toBanglaNumber = (num) => {
  if (num === null || num === undefined) return '';
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return toBanglaDigits(parts.join('.'));
};

const toEnglishDigits = (str) => {
  const bnDigits = {
    '০': '0',
    '১': '1',
    '২': '2',
    '৩': '3',
    '৪': '4',
    '৫': '5',
    '৬': '6',
    '৭': '7',
    '৮': '8',
    '৯': '9',
  };
  return str.replace(/[০-৯]/g, (d) => bnDigits[d]);
};

export const registerReportCommand = (bot) => {
  bot.command('report', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const rawText = ctx.message.text;
    const args = rawText.split(' ').slice(1);

    logger.info('Report command received', { telegramId, args });

    try {
      // 1. Verify farmer is registered
      const farmer = await dbService.getFarmerByTelegramId(telegramId);
      if (!farmer) {
        return ctx.reply(
          '❌ আপনি নিবন্ধিত নন। /start ব্যবহার করুন।\nYou are not registered. Use /start first.',
        );
      }

      // 2. Parse arguments: plot_name and month/year
      let plotName = '';
      let targetMonth = new Date().getMonth() + 1; // 1-indexed (1-12)
      let targetYear = new Date().getFullYear();

      if (args.length > 0) {
        // Convert last arg digits to english just in case it's a year written in bangla
        const lastArg = toEnglishDigits(
          args[args.length - 1].toLowerCase().replace(/,/g, '').trim(),
        );
        const lastArgAsYear = parseInt(lastArg, 10);

        if (monthsMap[lastArg] !== undefined) {
          targetMonth = monthsMap[lastArg];
          plotName = args
            .slice(0, args.length - 1)
            .join(' ')
            .trim();
        } else if (
          !isNaN(lastArgAsYear) &&
          lastArgAsYear > 2000 &&
          lastArgAsYear < 2100 &&
          args.length > 1
        ) {
          const secondLastArg = args[args.length - 2].toLowerCase().trim();
          if (monthsMap[secondLastArg] !== undefined) {
            targetMonth = monthsMap[secondLastArg];
            targetYear = lastArgAsYear;
            plotName = args
              .slice(0, args.length - 2)
              .join(' ')
              .trim();
          } else {
            plotName = args.join(' ').trim();
          }
        } else {
          plotName = args.join(' ').trim();
        }
      }

      // 3. Fetch farmer's plots
      const plots = await dbService.getPlotsByFarmerIdFromTelegram(telegramId);

      if (plots.length === 0) {
        return ctx.reply(
          'আপনার কোনো নিবন্ধিত জমি নেই। /register ব্যবহার করে জমি যোগ করুন।\nYou have no registered plots. Use /register to add one.',
        );
      }

      // 4. Filter plots
      let targetPlots = plots;
      if (plotName) {
        targetPlots = plots.filter((p) => p.name.toLowerCase() === plotName.toLowerCase());
        if (targetPlots.length === 0) {
          return ctx.reply(
            `"${plotName}" নামে কোনো জমি খুঁজে পাওয়া যায়নি।\nNo plot found named "${plotName}".`,
          );
        }
      }

      const banglaMonth = banglaMonthNames[targetMonth - 1];
      const startDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`;
      // Use local timezone to get last day of month
      const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

      let reportMessage = `📊 *ফার্ম রিপোর্ট / Farm Report*\n📅 ${banglaMonth} ${toBanglaDigits(targetYear)}\n\n`;

      let hasAnyData = false;

      for (const plot of targetPlots) {
        // Fetch logs for this plot and month
        const inputs = await dbService.getInputLogsByPlotAndMonth(plot.id, startDate, endDate);
        const observations = await dbService.getObservationsByPlotAndMonth(
          plot.id,
          startDate,
          endDate,
        );
        const harvests = await dbService.getHarvestsByPlotAndMonth(plot.id, startDate, endDate);

        if (inputs.length === 0 && observations.length === 0 && harvests.length === 0) {
          continue;
        }

        hasAnyData = true;

        reportMessage += `📍 *${plot.name}*\n`;

        // 📥 Inputs aggregation
        if (inputs.length > 0) {
          reportMessage += `📥 উপকরণ / Inputs: ${toBanglaDigits(inputs.length)} বার (times)\n`;
          const inputSummary = {};
          let totalCost = 0;

          inputs.forEach((log) => {
            const key = `${log.type}`;
            const unit = log.quantity_unit || '';
            const sumKey = `${key}__${unit}`;

            inputSummary[sumKey] = inputSummary[sumKey] || { count: 0, qty: 0 };
            inputSummary[sumKey].count += 1;
            inputSummary[sumKey].qty += parseFloat(log.quantity) || 0;
            totalCost += parseFloat(log.cost) || 0;
          });

          Object.entries(inputSummary).forEach(([keyUnit, info]) => {
            const [key, unit] = keyUnit.split('__');
            reportMessage += `  - ${key}: ${toBanglaNumber(info.qty)} ${unit} (${toBanglaDigits(info.count)} বার)\n`;
          });

          if (totalCost > 0) {
            reportMessage += `  💰 খরচ / Cost: ${toBanglaNumber(totalCost)} টাকা (Taka)\n`;
          }
        }

        // 👁️ Observations
        if (observations.length > 0) {
          reportMessage += `👁️ পর্যবেক্ষণ / Observations: ${toBanglaDigits(observations.length)} টি (logs)\n`;
          observations.forEach((obs) => {
            const day = toBanglaDigits(parseInt(obs.date.split('-')[2], 10));
            reportMessage += `  - ${obs.title} (${day} ${banglaMonth})\n`;
          });
        }

        // 🌾 Harvests aggregation
        if (harvests.length > 0) {
          reportMessage += `🌾 ফসল / Harvests: ${toBanglaDigits(harvests.length)} বার (harvests)\n`;
          const harvestSummary = {};
          let totalRevenue = 0;

          harvests.forEach((log) => {
            const key = `${log.crop}`;
            const unit = log.quantity_unit || '';
            const sumKey = `${key}__${unit}`;

            harvestSummary[sumKey] = harvestSummary[sumKey] || { count: 0, qty: 0, revenue: 0 };
            harvestSummary[sumKey].count += 1;
            harvestSummary[sumKey].qty += parseFloat(log.quantity) || 0;
            harvestSummary[sumKey].revenue += parseFloat(log.revenue) || 0;
            totalRevenue += parseFloat(log.revenue) || 0;
          });

          Object.entries(harvestSummary).forEach(([keyUnit, info]) => {
            const [key, unit] = keyUnit.split('__');
            reportMessage += `  - ${key}: ${toBanglaNumber(info.qty)} ${unit}`;
            if (info.revenue > 0) {
              reportMessage += ` | রাজস্ব / Revenue: ${toBanglaNumber(info.revenue)} টাকা\n`;
            } else {
              reportMessage += '\n';
            }
          });

          if (totalRevenue > 0) {
            reportMessage += `  📈 মোট রাজস্ব / Total Revenue: ${toBanglaNumber(totalRevenue)} টাকা (Taka)\n`;
          }
        }

        reportMessage += '\n';
      }

      if (!hasAnyData) {
        const plotHint = plotName ? `"${plotName}" জমির জন্য` : 'কোনো জমির';
        return ctx.reply(
          `📅 ${banglaMonth} ${targetYear}-এ ${plotHint} কোনো রেকর্ড পাওয়া যায়নি।\nNo records found for ${banglaMonth} ${targetYear}.`,
        );
      }

      return ctx.replyWithMarkdown(reportMessage);
    } catch (error) {
      logger.error('Error in /report command', { error: error.message, telegramId });
      return ctx.reply('দুঃখিত, কোনো সমস্যা হয়েছে।\nSorry, something went wrong.');
    }
  });
};
