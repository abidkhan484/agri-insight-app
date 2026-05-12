import logger from '../../config/logger.js';
import { config } from '../../config/index.js';

const AI_API_URL = config.aiApiUrl;

/**
 * Registers the /ask command with the bot.
 * @param {import('telegraf').Telegraf} bot
 * @param {any} db
 */
export function registerAskCommand(bot, db) {
  bot.command('ask', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const question = ctx.message.text.replace('/ask', '').trim();

    logger.info('Ask command received', { telegramId: `id:${telegramId}` });

    if (!question) {
      return ctx.reply(
        '❓ প্রশ্ন লিখুন: /ask জীবামৃত কীভাবে তৈরি করব?\n' +
        'Type your question: /ask How do I make Jeevamrutha?'
      );
    }

    if (question.length > 500) {
      return ctx.reply('প্রশ্ন ৫০০ অক্ষরের বেশি হবে না।\nQuestion must be under 500 characters.');
    }

    const thinking = await ctx.reply('🤔 ভাবছি...\nThinking...');

    try {
      const response = await fetch(`${AI_API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, language: 'bn' }),
        signal: AbortSignal.timeout(90000), // 90s timeout
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }
      
      const data = await response.json();

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        thinking.message_id,
        null,
        `🌾 *AI উত্তর / AI Answer*\n\n${data.answer}`,
        { parse_mode: 'Markdown' }
      );
      logger.info('Ask response sent', { telegramId: `id:${telegramId}`, sources: data.sources });
    } catch (err) {
      logger.error('Ask command failed', { error: err.message });
      await ctx.telegram.editMessageText(
        ctx.chat.id, 
        thinking.message_id, 
        null,
        'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না।\nSorry, unable to answer right now.'
      );
    }
  });
}
