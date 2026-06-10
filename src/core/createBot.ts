import { Telegraf } from "telegraf";
import type { CreateBotArgs, BotInstance } from "../types/bot.types";
import { applyBotCrashGuard } from "./botCrashGuard";

const createBot = ({ botToken, botName, onError }: CreateBotArgs): BotInstance => {
  const bot = new Telegraf(botToken);

  // Keep one failing handler from aborting long polling for the whole bot (see botCrashGuard).
  applyBotCrashGuard(bot, {
    onError: onError ? (error) => onError(error, botName) : undefined,
  });

  const launch = async (): Promise<void> => {
    try {
      await bot.launch();
    } catch (error: unknown) {
      if (onError) {
        onError(error, botName);
      } else {
        throw error;
      }
    }
  };

  const stop = async (reason?: string): Promise<void> => {
    bot.stop(reason);
  };

  return { bot, botName, launch, stop };
};

export { createBot };
