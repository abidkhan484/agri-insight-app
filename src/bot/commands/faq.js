import logger from '../../config/logger.js';
import { searchFAQ } from '../../services/supabase.js';

export function registerFaqCommand(bot) {
  bot.command('faq', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const query = ctx.message.text.replace('/faq', '').trim();

    logger.info('FAQ command received', { telegramId: `id:${telegramId}`, query });

    if (!query) {
      return ctx.reply(
        '❓ প্রশ্ন লিখুন: /faq জীবামৃত কী?\n' + 'Type your question: /faq What is Jeevamrutha?',
      );
    }

    try {
      const results = await searchFAQ(query);

      if (!results.length) {
        return ctx.reply(
          'এই বিষয়ে FAQ পাওয়া যায়নি। /ask দিয়ে AI-কে জিজ্ঞেস করুন।\n' +
            'No FAQ found. Try /ask to ask our AI assistant.',
        );
      }

      const lines = results.map((faq, i) => `*${i + 1}. ${faq.question_bn}*\n${faq.answer_bn}`);

      await ctx.replyWithMarkdown(lines.join('\n\n'));
      logger.info('FAQ response sent', { query, resultCount: results.length });
    } catch (err) {
      logger.error('FAQ failed', { error: err.message });
      await ctx.reply(
        'দুঃখিত, সমস্যা হয়েছে। আবার চেষ্টা করুন।\nSorry, an error occurred. Please try again.',
      );
    }
  });
}
