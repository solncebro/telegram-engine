import type { Context, Telegraf } from "telegraf";

import type { MenuLogFunction } from "../types/lifecycle.types";
import { isBenignTelegramEditError } from "./telegramEditError";

interface ApplyIncomingMessageCleanupArgs {
  bot: Telegraf;
  isAllowedChat: (chatId: string) => boolean;
  onLog?: MenuLogFunction;
}

/**
 * Register a middleware that deletes every incoming user message (commands, text
 * replies, reply-keyboard presses) in allowed chats, so the chat keeps only the
 * bot's "live menu" and its alerts. Apply it BEFORE other handlers; it always
 * calls next(), so downstream bot.command/hears/on still see ctx.message (the
 * server-side delete does not mutate the in-memory update). Errors are swallowed
 * when benign (message already gone / too old / can't be deleted), logged otherwise.
 */
function applyIncomingMessageCleanup({
  bot,
  isAllowedChat,
  onLog,
}: ApplyIncomingMessageCleanupArgs): void {
  bot.use(async (ctx: Context, next: () => Promise<void>) => {
    const chatId = ctx.chat?.id;
    const message = ctx.message;

    if (chatId !== undefined && message !== undefined && isAllowedChat(String(chatId))) {
      try {
        await ctx.telegram.deleteMessage(chatId, message.message_id);
      } catch (error) {
        if (!isBenignTelegramEditError(error)) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          onLog?.("warn", `failed to delete incoming message: ${errorMessage}`, {
            chatId,
            messageId: message.message_id,
          });
        }
      }
    }

    return next();
  });
}

export { applyIncomingMessageCleanup };
export type { ApplyIncomingMessageCleanupArgs };
