import { Scenes } from 'telegraf';
import { dbService } from '../../db/service.js';
import logger from '../../config/logger.js';

export const logWizard = new Scenes.WizardScene(
  'LOG_ACTIVITY_SCENE',
  // Step 1: Choose activity type
  async (ctx) => {
    ctx.wizard.state.logData = {};
    const telegramId = ctx.from.id.toString();

    try {
      const farmer = await dbService.getFarmerByTelegramId(telegramId);
      if (!farmer) {
        await ctx.reply(
          '❌ আপনি নিবন্ধিত নন। অনুগ্রহ করে প্রথমে /start ব্যবহার করে জমি নিবন্ধন করুন।\n' +
            'You are not registered. Please register using /start first.',
        );
        return ctx.scene.leave();
      }
      ctx.wizard.state.farmer = farmer;

      const plots = await dbService.getPlotsByFarmerIdFromTelegram(telegramId);
      if (plots.length === 0) {
        await ctx.reply(
          'আপনার কোনো জমি নিবন্ধিত নেই। অনুগ্রহ করে প্রথমে /register ব্যবহার করে জমি যোগ করুন।\n' +
            'You have no registered plots. Use /register to add one first.',
        );
        return ctx.scene.leave();
      }
      ctx.wizard.state.plots = plots;

      // Ask for activity type using inline buttons
      await ctx.reply(
        'কী ধরনের কার্যক্রম লিপিবদ্ধ করতে চান?\nWhat type of activity do you want to log?',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📥 উপকরণ (Input)', callback_data: 'type:input' },
                { text: '👁️ পর্যবেক্ষণ (Observation)', callback_data: 'type:observation' },
                { text: '🌾 ফসল (Harvest)', callback_data: 'type:harvest' },
              ],
            ],
          },
        },
      );
      return ctx.wizard.next();
    } catch (err) {
      logger.error('Error in logWizard Step 1', { error: err.message, telegramId });
      await ctx.reply('দুঃখিত, কোনো সমস্যা হয়েছে।\nSorry, something went wrong.');
      return ctx.scene.leave();
    }
  },

  // Step 2: Choose Plot
  async (ctx) => {
    let selectedType = '';
    if (ctx.callbackQuery?.data && ctx.callbackQuery.data.startsWith('type:')) {
      selectedType = ctx.callbackQuery.data.split(':')[1];
      await ctx.answerCbQuery();
    } else {
      const text = ctx.message?.text?.toLowerCase();
      if (text?.includes('উপকরণ') || text?.includes('input')) selectedType = 'input';
      else if (text?.includes('পর্যবেক্ষণ') || text?.includes('observation'))
        selectedType = 'observation';
      else if (text?.includes('ফসল') || text?.includes('harvest')) selectedType = 'harvest';
    }

    if (!selectedType) {
      await ctx.reply('অনুগ্রহ করে একটি সঠিক অপশন নির্বাচন করুন:\nPlease select a valid option:', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📥 উপকরণ (Input)', callback_data: 'type:input' },
              { text: '👁️ পর্যবেক্ষণ (Observation)', callback_data: 'type:observation' },
              { text: '🌾 ফসল (Harvest)', callback_data: 'type:harvest' },
            ],
          ],
        },
      });
      return;
    }

    ctx.wizard.state.logData.type = selectedType;

    // Show plots as inline buttons
    const plots = ctx.wizard.state.plots;
    const inline_keyboard = plots.map((plot) => [
      { text: plot.name, callback_data: `plot:${plot.id}:${plot.name}` },
    ]);

    await ctx.reply('কোন জমিতে? / Which plot?', {
      reply_markup: {
        inline_keyboard,
      },
    });
    return ctx.wizard.next();
  },

  // Step 3: Depending on type, ask first question
  async (ctx) => {
    let plotId = '';
    let plotName = '';

    if (ctx.callbackQuery?.data && ctx.callbackQuery.data.startsWith('plot:')) {
      const parts = ctx.callbackQuery.data.split(':');
      plotId = parseInt(parts[1], 10);
      plotName = parts[2];
      await ctx.answerCbQuery();
    } else {
      const text = ctx.message?.text;
      const plot = ctx.wizard.state.plots.find((p) => p.name.toLowerCase() === text?.toLowerCase());
      if (plot) {
        plotId = plot.id;
        plotName = plot.name;
      }
    }

    if (!plotId) {
      await ctx.reply('অনুগ্রহ করে সঠিক জমিটি নির্বাচন করুন। / Please select a valid plot.');
      return;
    }

    ctx.wizard.state.logData.plotId = plotId;
    ctx.wizard.state.logData.plotName = plotName;

    const activityType = ctx.wizard.state.logData.type;

    if (activityType === 'input') {
      await ctx.reply(
        'উপকরণের নাম লিখুন (যেমন: জীবামৃত, নীমাস্ত্র):\nPlease enter the name of the input (e.g., Jeevamrutha, Neemastra):',
      );
    } else if (activityType === 'observation') {
      await ctx.reply(
        'পর্যবেক্ষণের শিরোনাম লিখুন (যেমন: কেঁচো দেখা গেছে):\nPlease enter a title for the observation (e.g., Earthworms spotted):',
      );
    } else if (activityType === 'harvest') {
      await ctx.reply(
        'ফসলের নাম লিখুন (যেমন: ধান, আলু):\nPlease enter the crop name (e.g., Rice, Potato):',
      );
    }
    return ctx.wizard.next();
  },

  // Step 4: Save answer from Step 3, and ask next question
  async (ctx) => {
    const inputVal = ctx.message?.text;
    if (!inputVal) {
      await ctx.reply('অনুগ্রহ করে সঠিক তথ্য দিন। / Please provide valid text input.');
      return;
    }

    const activityType = ctx.wizard.state.logData.type;

    if (activityType === 'input') {
      ctx.wizard.state.logData.inputName = inputVal;
      await ctx.reply(
        'পরিমাণ লিখুন (শুধু সংখ্যা, যেমন: ২০০):\nEnter the quantity (numbers only, e.g., 200):',
      );
    } else if (activityType === 'observation') {
      ctx.wizard.state.logData.obsTitle = inputVal;
      await ctx.reply(
        'বিস্তারিত বর্ণনা লিখুন (যেমন: জমিতে কেঁচো বেড়েছে):\nEnter details/description:',
      );
    } else if (activityType === 'harvest') {
      ctx.wizard.state.logData.cropName = inputVal;
      await ctx.reply(
        'ফসল সংগ্রহের পরিমাণ লিখুন (শুধু সংখ্যা, যেমন: ৫০০):\nEnter harvest quantity (numbers only, e.g., 500):',
      );
    }
    return ctx.wizard.next();
  },

  // Step 5: Save answer from Step 4, ask unit/proceed
  async (ctx) => {
    const inputVal = ctx.message?.text;
    if (!inputVal) {
      await ctx.reply('অনুগ্রহ করে সঠিক তথ্য দিন। / Please provide valid text input.');
      return;
    }

    const activityType = ctx.wizard.state.logData.type;

    if (activityType === 'input') {
      const qty = parseFloat(inputVal.replace(/[^\d.]/g, ''));
      if (isNaN(qty) || qty <= 0) {
        await ctx.reply('অনুগ্রহ করে সঠিক সংখ্যা দিন: / Please enter a valid number:');
        return;
      }
      ctx.wizard.state.logData.quantity = qty;
      await ctx.reply('একক লিখুন (যেমন: লিটার, কেজি):\nEnter unit (e.g., Liters, Kg):');
      return ctx.wizard.next();
    } else if (activityType === 'observation') {
      ctx.wizard.state.logData.obsDescription = inputVal;
      // Observations are complete, jump to confirmation step (Step 8)
      return showConfirmation(ctx);
    } else if (activityType === 'harvest') {
      const qty = parseFloat(inputVal.replace(/[^\d.]/g, ''));
      if (isNaN(qty) || qty <= 0) {
        await ctx.reply('অনুগ্রহ করে সঠিক সংখ্যা দিন: / Please enter a valid number:');
        return;
      }
      ctx.wizard.state.logData.quantity = qty;
      await ctx.reply('একক লিখুন (যেমন: কেজি, মন):\nEnter unit (e.g., Kg, Mon):');
      return ctx.wizard.next();
    }
  },

  // Step 6: Save unit, ask cost/revenue
  async (ctx) => {
    const inputVal = ctx.message?.text;
    if (!inputVal) {
      await ctx.reply('অনুগ্রহ করে সঠিক তথ্য দিন। / Please provide valid text input.');
      return;
    }

    const activityType = ctx.wizard.state.logData.type;
    ctx.wizard.state.logData.unit = inputVal;

    if (activityType === 'input') {
      await ctx.reply(
        'খরচ লিখুন (টাকা, যেমন: ৫০০, না থাকলে ০):\nEnter cost (Taka, e.g., 500, or 0 if none):',
      );
    } else if (activityType === 'harvest') {
      await ctx.reply(
        'রাজস্ব/বিক্রয় মূল্য লিখুন (টাকা, যেমন: ১৫০০০, না থাকলে ০):\nEnter revenue (Taka, e.g., 15000, or 0 if none):',
      );
    }
    return ctx.wizard.next();
  },

  // Step 7: Save cost/revenue and show confirmation
  async (ctx) => {
    const inputVal = ctx.message?.text;
    if (!inputVal) {
      await ctx.reply('অনুগ্রহ করে সঠিক তথ্য দিন। / Please provide valid text input.');
      return;
    }

    const val = parseFloat(inputVal.replace(/[^\d.]/g, ''));
    if (isNaN(val) || val < 0) {
      await ctx.reply('অনুগ্রহ করে সঠিক সংখ্যা দিন: / Please enter a valid number:');
      return;
    }

    const activityType = ctx.wizard.state.logData.type;
    if (activityType === 'input') {
      ctx.wizard.state.logData.cost = val;
    } else if (activityType === 'harvest') {
      ctx.wizard.state.logData.revenue = val;
    }

    return showConfirmation(ctx);
  },

  // Step 8: Process confirmation response
  async (ctx) => {
    let confirmed = false;
    if (ctx.callbackQuery?.data) {
      confirmed = ctx.callbackQuery.data === 'confirm:yes';
      await ctx.answerCbQuery();
    } else {
      const text = ctx.message?.text?.toLowerCase();
      confirmed = text?.includes('হ্যাঁ') || text?.includes('yes') || text?.includes('sothik');
    }

    const telegramId = ctx.from.id.toString();

    if (!confirmed) {
      logger.info('Logging cancelled by user', { telegramId });
      await ctx.reply('লিপিবদ্ধকরণ বাতিল করা হয়েছে।\nLogging cancelled.');
      return ctx.scene.leave();
    }

    try {
      const { type, plotId, plotName } = ctx.wizard.state.logData;
      const todayStr = new Date().toISOString().split('T')[0];

      if (type === 'input') {
        const { inputName, quantity, unit, cost } = ctx.wizard.state.logData;
        await dbService.createInputLog({
          plot_id: plotId,
          date: todayStr,
          type: inputName,
          quantity,
          quantity_unit: unit,
          cost,
        });
        logger.info('Input log created successfully', { telegramId, plotName, inputName });
        await ctx.reply(
          `✅ উপকরণের তথ্য সফলভাবে সংরক্ষণ করা হয়েছে।\nInput log saved successfully for plot "${plotName}".`,
        );
      } else if (type === 'observation') {
        const { obsTitle, obsDescription } = ctx.wizard.state.logData;
        await dbService.createObservation({
          plot_id: plotId,
          date: todayStr,
          title: obsTitle,
          description: obsDescription,
        });
        logger.info('Observation created successfully', { telegramId, plotName, obsTitle });
        await ctx.reply(
          `✅ পর্যবেক্ষণ সফলভাবে সংরক্ষণ করা হয়েছে।\nObservation saved successfully for plot "${plotName}".`,
        );
      } else if (type === 'harvest') {
        const { cropName, quantity, unit, revenue } = ctx.wizard.state.logData;
        await dbService.createHarvest({
          plot_id: plotId,
          date: todayStr,
          crop: cropName,
          quantity,
          quantity_unit: unit,
          revenue,
        });
        logger.info('Harvest record created successfully', { telegramId, plotName, cropName });
        await ctx.reply(
          `✅ ফসল সংগ্রহের তথ্য সফলভাবে সংরক্ষণ করা হয়েছে।\nHarvest log saved successfully for plot "${plotName}".`,
        );
      }
    } catch (err) {
      logger.error('Failed to save log in wizard', { error: err.message, telegramId });
      await ctx.reply('দুঃখিত, তথ্য সংরক্ষণ করতে সমস্যা হয়েছে।\nSorry, failed to save data.');
    }

    return ctx.scene.leave();
  },
);

/**
 * Show summary and confirm.
 */
async function showConfirmation(ctx) {
  const { type, plotName } = ctx.wizard.state.logData;
  let summary =
    `📝 *নিশ্চিতকরণ / Confirm Details*\n\n` +
    `📍 জমি / Plot: ${plotName}\n` +
    `📋 ধরণ / Type: ${type === 'input' ? 'উপকরণ প্রয়োগ' : type === 'observation' ? 'পর্যবেক্ষণ' : 'ফসল সংগ্রহ'}\n`;

  if (type === 'input') {
    const { inputName, quantity, unit, cost } = ctx.wizard.state.logData;
    summary += `🔹 উপকরণ / Input: ${inputName}\n🔹 পরিমাণ / Qty: ${quantity} ${unit}\n🔹 খরচ / Cost: ${cost} টাকা (Taka)\n`;
  } else if (type === 'observation') {
    const { obsTitle, obsDescription } = ctx.wizard.state.logData;
    summary += `🔹 বিষয় / Title: ${obsTitle}\n🔹 বিবরণ / Desc: ${obsDescription}\n`;
  } else if (type === 'harvest') {
    const { cropName, quantity, unit, revenue } = ctx.wizard.state.logData;
    summary += `🔹 ফসল / Crop: ${cropName}\n🔹 পরিমাণ / Qty: ${quantity} ${unit}\n🔹 বিক্রয় মূল্য / Revenue: ${revenue} টাকা (Taka)\n`;
  }

  summary += '\nসব তথ্য সঠিক কি? / Is everything correct?';

  // Force wizard state to go to step 8 (index 7) for confirmation checking
  ctx.wizard.selectStep(7);

  await ctx.replyWithMarkdown(summary, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ হ্যাঁ (Yes)', callback_data: 'confirm:yes' },
          { text: '❌ না (No)', callback_data: 'confirm:no' },
        ],
      ],
    },
  });
}
