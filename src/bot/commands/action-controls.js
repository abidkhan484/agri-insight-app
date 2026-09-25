import logger from '../../config/logger.js';

const CANCEL_MESSAGE =
  'চলমান কাজটি বাতিল করা হয়েছে। কোনো তথ্য সংরক্ষণ করা হয়নি।\n' +
  'The current action was cancelled. No information was saved.';

const NO_ACTION_MESSAGE = 'এখন কোনো চলমান কাজ নেই।\nThere is no active action to reset.';

export async function cancelActiveAction(ctx) {
  if (!ctx.scene?.current) {
    return false;
  }

  if (ctx.wizard?.state) {
    for (const key of Object.keys(ctx.wizard.state)) delete ctx.wizard.state[key];
  }
  await ctx.scene.leave();
  return true;
}

export async function resetActiveAction(ctx) {
  const sceneId = ctx.scene?.current?.id;
  const cancelled = await cancelActiveAction(ctx);

  if (cancelled && sceneId) {
    await ctx.scene.enter(sceneId);
  }

  return cancelled;
}

export function registerActionControls(bot) {
  const respond = (message) => async (ctx) => {
    const cancelled = await message.action(ctx);

    if (cancelled) {
      logger.info('Interactive action cancelled', { telegramId: `id:${ctx.from.id}` });
    }

    return ctx.reply(cancelled ? message.success : NO_ACTION_MESSAGE);
  };

  const cancel = respond({
    action: cancelActiveAction,
    success: CANCEL_MESSAGE,
  });
  const reset = respond({
    action: resetActiveAction,
    success:
      'চলমান কাজটি নতুন করে শুরু করা হয়েছে। আগের তথ্য সংরক্ষণ করা হয়নি।\n' +
      'The current action has been restarted. Previous information was not saved.',
  });

  bot.command('cancel', cancel);
  bot.command('reset', reset);
}
