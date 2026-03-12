import { Telegraf } from "telegraf";
import type { CreateBotArgs, BotInstance } from "../types/bot.types";

const createBot = ({ botToken, botName, onError }: CreateBotArgs): BotInstance => {
  const bot = new Telegraf(botToken);

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
