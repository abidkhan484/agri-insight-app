/* global clearTimeout, FormData */
import { Scenes } from 'telegraf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../../config/logger.js';
import { config } from '../../config/index.js';
import { dbService } from '../../db/service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const treatmentsPath = path.join(__dirname, '../../data/disease-treatments.json');

// Read disease treatments
let treatments = {};
try {
  treatments = JSON.parse(fs.readFileSync(treatmentsPath, 'utf8'));
} catch (error) {
  logger.error('Failed to read disease-treatments.json in bot command', { error: error.message });
}

// In-memory rate limiting map
// Keys: telegramId, Values: { count: number, dateStr: string }
const dailyLimits = new Map();

/**
 * Checks and updates the daily rate limit for a farmer.
 * @param {string} telegramId 
 * @returns {{ limited: boolean, count: number }}
 */
export function checkRateLimit(telegramId) {
  const today = new Date().toISOString().split('T')[0];
  const limit = dailyLimits.get(telegramId);
  
  if (!limit || limit.dateStr !== today) {
    dailyLimits.set(telegramId, { count: 1, dateStr: today });
    return { limited: false, count: 1 };
  }
  
  if (limit.count >= 5) {
    return { limited: true, count: limit.count };
  }
  
  limit.count += 1;
  return { limited: false, count: limit.count };
}

/**
 * Translates an integer to Bangla digits.
 * @param {number|string} num 
 * @returns {string}
 */
export function toBanglaDigits(num) {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => bnDigits[d]);
}

/**
 * Lookup treatment information based on scientific name.
 * @param {string} scientificName 
 * @returns {Object|null} Treatment information or null
 */
export function lookupTreatment(scientificName = '') {
  if (!scientificName) return null;

  const genus = scientificName.split(' ')[0];
  const match = Object.entries(treatments).find(([key]) =>
    scientificName.toLowerCase().includes(key.toLowerCase()) ||
    genus.toLowerCase() === key.toLowerCase()
  );
  
  return match ? match[1] : null;
}

// Clear the scene's timeout safely
const clearSceneTimeout = (ctx) => {
  if (ctx.scene.state.timeoutId) {
    clearTimeout(ctx.scene.state.timeoutId);
    ctx.scene.state.timeoutId = null;
  }
};

/**
 * Enter Scene handler
 */
export async function handleDiseaseEnter(ctx) {
  const telegramId = ctx.from.id.toString();
  logger.info('Disease scene entered', { telegramId: 'id:' + telegramId });

  // 1. Verify farmer registration
  try {
    const farmer = await dbService.getFarmerByTelegramId(telegramId);
    if (!farmer) {
      await ctx.reply(
        '❌ আপনি নিবন্ধিত নন। অনুগ্রহ করে প্রথমে /register ব্যবহার করে জমি নিবন্ধন করুন।\n' +
        'You are not registered. Please register your plot using /register first.'
      );
      return ctx.scene.leave();
    }
  } catch (error) {
    logger.error('Error validating registration in disease scene', { error: error.message, telegramId: 'id:' + telegramId });
    await ctx.reply(
      'দুঃখিত, কোনো সমস্যা হয়েছে। পরে চেষ্টা করুন।\n' +
      'Sorry, something went wrong. Please try again later.'
    );
    return ctx.scene.leave();
  }

  // 2. Enforce per-user rate limit (5 requests per day)
  const limitCheck = checkRateLimit(telegramId);
  if (limitCheck.limited) {
    logger.warn('Farmer hit disease command rate limit', { telegramId: 'id:' + telegramId });
    await ctx.reply(
      'আজকের জন্য শনাক্তকরণ সীমা শেষ। আগামীকাল চেষ্টা করুন।\n' +
      'Daily identification limit reached. Please try again tomorrow.'
    );
    return ctx.scene.leave();
  }

  await ctx.reply(
    'আক্রান্ত পাতার ছবি পাঠান। অথবা বাতিল করতে /cancel লিখুন।\n' +
    'Send a photo of the affected leaf. Or type /cancel to cancel.'
  );

  // 3. Set a 60-second timeout reminder
  const timeoutId = setTimeout(async () => {
    if (ctx.scene.current?.id === 'DISEASE_SCENE') {
      try {
        await ctx.reply(
          'ছবি পাঠাতে অনেক সময় লেগেছে। রোগ শনাক্তকরণ বাতিল করা হয়েছে। আবার শুরু করতে /disease লিখুন।\n' +
          'Photo request timed out. Identification cancelled. Type /disease to start again.'
        );
      } catch (err) {
        logger.error('Failed to send timeout response', { error: err.message });
      }
      ctx.scene.leave();
    }
  }, 60000);

  ctx.scene.state.timeoutId = timeoutId;
}

/**
 * Leave Scene handler
 */
export async function handleDiseaseLeave(ctx) {
  const telegramId = ctx.from.id.toString();
  logger.info('Disease scene left', { telegramId: 'id:' + telegramId });
  clearSceneTimeout(ctx);
}

/**
 * Cancel command handler
 */
export async function handleDiseaseCancel(ctx) {
  await ctx.reply('শনাক্তকরণ বাতিল করা হয়েছে।\nIdentification cancelled.');
  return ctx.scene.leave();
}

/**
 * Handle photo uploads
 */
export async function handleDiseasePhoto(ctx) {
  // Clear the timeout early to prevent triggering timeout message
  clearSceneTimeout(ctx);

  const telegramId = ctx.from.id.toString();
  logger.info('Photo received for disease detection', { telegramId: 'id:' + telegramId });

  const photo = ctx.message.photo[ctx.message.photo.length - 1]; // Highest resolution photo
  const thinking = await ctx.reply(
    '🔍 ছবি বিশ্লেষণ করা হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন।\n' +
    'Analyzing photo... Please wait.'
  );

  try {
    // 1. Download photo from Telegram
    const fileUrl = await ctx.telegram.getFileLink(photo.file_id);
    const imgResponse = await fetch(fileUrl.href);
    if (!imgResponse.ok) {
      throw new Error(`Failed to fetch photo from Telegram: ${imgResponse.statusText}`);
    }
    const blob = await imgResponse.blob();

    // 2. Prepare FormData for PlantNet
    const formData = new FormData();
    formData.append('images', blob, 'image.jpg');
    formData.append('organs', 'leaf');

    const plantnetUrl = `https://my.plantnet.org/v2/identify/all?api-key=${config.plantnetApiKey}&lang=en&include-related-images=false`;
    
    // 3. Request PlantNet API for identification
    const apiResponse = await fetch(plantnetUrl, {
      method: 'POST',
      body: formData,
    });

    if (apiResponse.status === 429) {
      logger.warn('PlantNet API rate limit reached', { telegramId: 'id:' + telegramId });
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        thinking.message_id,
        null,
        'আজকের জন্য শনাক্তকরণ সীমা শেষ। আগামীকাল চেষ্টা করুন।\n' +
        'Daily identification limit reached. Please try again tomorrow.'
      );
      return ctx.scene.leave();
    }

    if (!apiResponse.ok) {
      logger.error('PlantNet API error', { status: apiResponse.status, telegramId: 'id:' + telegramId });
      throw new Error(`PlantNet error: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    const results = data.results || [];

    // 4. No Match Case (Low confidence < 20% or no results)
    if (results.length === 0) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        thinking.message_id,
        null,
        '❌ দুঃখিত, এই ছবি থেকে রোগ শনাক্ত করা যায়নি।\n' +
        'Sorry, unable to identify the disease from this photo.\n\n' +
        '📱 আরো ভালো ফলাфলের জন্য Disease Detector অ্যাপ ব্যবহার করুন।\n' +
        'For better results, use the Disease Detector app.'
      );
      return ctx.scene.leave();
    }

    const topResult = results[0];
    const confidence = Math.round((topResult.score || 0) * 100);

    if (confidence < 20) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        thinking.message_id,
        null,
        '❌ দুঃখিত, এই ছবি থেকে রোগ শনাক্ত করা যায়নি।\n' +
        'Sorry, unable to identify the disease from this photo.\n\n' +
        '📱 আরো ভালো ফলাфলের জন্য Disease Detector অ্যাপ ব্যবহার করুন।\n' +
        'For better results, use the Disease Detector app.'
      );
      return ctx.scene.leave();
    }

    const scientificName = topResult.species?.scientificNameWithoutAuthor || '';
    const confidenceBn = toBanglaDigits(confidence);

    // 5. Look up matching treatment
    const treatment = lookupTreatment(scientificName);

    if (treatment) {
      const message = `🔍 *রোগ শনাক্তকরণ / Disease Identification*\n\n` +
        `🦠 *রোগের নাম:* ${treatment.name_bn} (${treatment.name_en})\n` +
        `📊 *আত্মविश्वास:* ${confidenceBn}%\n\n` +
        `🌿 *ZBNF প্রতিকার / ZBNF Treatment:*\n` +
        `${treatment.treatment.schedule_bn}\n` +
        `${treatment.treatment.schedule_en}`;

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        thinking.message_id,
        null,
        message,
        { parse_mode: 'Markdown' }
      );
      logger.info('Disease identified and mapped successfully', { telegramId: 'id:' + telegramId, scientificName, confidence });
    } else {
      const message = `🔍 *রোগ শনাক্তকরণ / Disease Identification*\n\n` +
        `🦠 *রোগের নাম:* ${scientificName}\n` +
        `📊 *আত্মविश्वास:* ${confidenceBn}%\n\n` +
        `🌿 *ZBNF প্রতিকার / ZBNF Treatment:*\n` +
        `দুঃখিত, এই রোগের জন্য নির্দিষ্ট ZBNF প্রতিকার উপলব্ধ নেই।\n` +
        `Sorry, specific ZBNF treatment is not available for this disease.`;

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        thinking.message_id,
        null,
        message,
        { parse_mode: 'Markdown' }
      );
      logger.info('Disease identified but treatment mapping not found', { telegramId: 'id:' + telegramId, scientificName, confidence });
    }
    await ctx.scene.leave();

  } catch (error) {
    logger.error('Error during disease identification', { error: error.message, telegramId: 'id:' + telegramId });
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      thinking.message_id,
      null,
      'দুঃখিত, সার্ভারে সমস্যা। পরে চেষ্টা করুন।\n' +
      'Sorry, server error. Please try again later.'
    );
    await ctx.scene.leave();
  }
}

/**
 * Handle other types of messages (text, document, etc.)
 */
export async function handleDiseaseMessage(ctx) {
  if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/')) {
    if (ctx.message.text === '/cancel') return;
    
    // User triggered another command, cancel the scene gracefully
    clearSceneTimeout(ctx);
    await ctx.reply('শনাক্তকরণ বাতিল করা হয়েছে।\nIdentification cancelled.');
    ctx.scene.leave();
    
    // Suggest running the command again outside the scene context
    await ctx.reply(`অনুগ্রহ করে আবার ${ctx.message.text} লিখুন।\nPlease type ${ctx.message.text} again.`);
    return;
  }

  // Not a command and not a photo, ask for a photo
  await ctx.reply(
    'অনুগ্রহ করে আক্রান্ত পাতার একটি ছবি পাঠান অথবা বাতিল করতে /cancel লিখুন।\n' +
    'Please send a photo of the affected leaf or type /cancel to cancel.'
  );
}

// Define the Disease BaseScene
export const diseaseScene = new Scenes.BaseScene('DISEASE_SCENE');

// Register modular handlers
diseaseScene.enter(handleDiseaseEnter);
diseaseScene.leave(handleDiseaseLeave);
diseaseScene.command('cancel', handleDiseaseCancel);
diseaseScene.on('photo', handleDiseasePhoto);
diseaseScene.on('message', handleDiseaseMessage);
