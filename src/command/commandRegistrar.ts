import { Context } from "telegraf";
import type { RegisterBotCommandsArgs } from "../types/command.types";

const registerBotCommands = async ({
  bot,
  accessControl,
  commandConfigList,
  callbackQueryHandler,
  messageHandler,
  onError,
}: RegisterBotCommandsArgs): Promise<void> => {
  const telegramCommandList = commandConfigList.map(({ command, description }) => ({
    command,
    description,
  }));

  await bot.telegram.setMyCommands(telegramCommandList);

  const isAllowed = (context: Context): boolean => {
    if (!accessControl) {
      return true;
    }

    const chatId = `${context.chat?.id ?? ""}`;

    return accessControl.isAllowedPeer(chatId);
  };

  for (const { command, handler } of commandConfigList) {
    bot.command(command, async (context) => {
      if (!isAllowed(context)) {
        return;
      }

      try {
        await handler(context);
      } catch (error) {
        const chatId = `${context.chat?.id ?? ""}`;

        onError?.(`Error handling /${command}`, {
          error: error instanceof Error ? error.message : String(error),
          chatId,
        });
      }
    });
  }

  if (callbackQueryHandler) {
    bot.on("callback_query", async (context) => {
      if (!isAllowed(context)) {
        return;
      }

      try {
        await callbackQueryHandler(context);
      } catch (error) {
        const chatId = `${context.chat?.id ?? ""}`;

        onError?.("Error handling callback query", {
          error: error instanceof Error ? error.message : String(error),
          chatId,
        });
      }
    });
  }

  if (messageHandler) {
    bot.on("message", async (context) => {
      if (!isAllowed(context)) {
        return;
      }

      try {
        await messageHandler(context);
      } catch (error) {
        const chatId = `${context.chat?.id ?? ""}`;

        onError?.("Error handling message", {
          error: error instanceof Error ? error.message : String(error),
          chatId,
        });
      }
    });
  }

  bot.catch((error, context) => {
    onError?.("Unhandled bot error", {
      error: error instanceof Error ? error.message : String(error),
      updateType: context.updateType,
      chatId: context.chat?.id,
    });
  });
};

export { registerBotCommands };
