import { Telegraf, Context } from "telegraf";
import type { AccessControl, LogFunction } from "./bot.types";

interface CommandConfig {
  command: string;
  description: string;
  handler: (context: Context) => Promise<void>;
}

interface RegisterBotCommandsArgs {
  bot: Telegraf;
  accessControl?: AccessControl;
  commandConfigList: CommandConfig[];
  callbackQueryHandler?: (context: Context) => Promise<void>;
  messageHandler?: (context: Context) => Promise<void>;
  onError?: LogFunction;
}

export type { CommandConfig, RegisterBotCommandsArgs };
