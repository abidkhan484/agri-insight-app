import { describe, expect, it, vi } from 'vitest';
import {
  cancelActiveAction,
  registerActionControls,
  resetActiveAction,
} from '../bot/commands/action-controls.js';

describe('interactive action controls', () => {
  it('leaves an active scene when the farmer cancels', async () => {
    const leave = vi.fn();
    const state = { plotData: { name: 'wrong plot' } };
    const ctx = { scene: { current: { id: 'REGISTER_PLOT_SCENE' }, leave }, wizard: { state } };

    expect(await cancelActiveAction(ctx)).toBe(true);
    expect(leave).toHaveBeenCalledOnce();
    expect(state).toEqual({});
  });

  it('does not leave when there is no active scene', async () => {
    const ctx = { scene: { current: undefined, leave: vi.fn() } };

    expect(await cancelActiveAction(ctx)).toBe(false);
    expect(ctx.scene.leave).not.toHaveBeenCalled();
  });

  it('restarts the same scene after clearing its state', async () => {
    const ctx = {
      scene: { current: { id: 'REGISTER_PLOT_SCENE' }, leave: vi.fn(), enter: vi.fn() },
      wizard: { state: { plotData: { name: 'wrong plot' } } },
    };

    expect(await resetActiveAction(ctx)).toBe(true);
    expect(ctx.scene.enter).toHaveBeenCalledWith('REGISTER_PLOT_SCENE');
    expect(ctx.wizard.state).toEqual({});
  });

  it('registers both cancel and reset aliases', () => {
    const bot = { command: vi.fn() };

    registerActionControls(bot);

    expect(bot.command).toHaveBeenNthCalledWith(1, 'cancel', expect.any(Function));
    expect(bot.command).toHaveBeenNthCalledWith(2, 'reset', expect.any(Function));
  });
});
