import type { Context } from "telegraf";

import type {
  CreateMenuReplacerArgs,
  MenuReplacer,
  MenuSurface,
  ReplaceMenuArgs,
} from "../types/lifecycle.types";
import { buildMessageIdListToDelete } from "./menuMessageList";
import { isBenignTelegramEditError } from "../message/telegramEditError";

function getCallbackMessageId(ctx: Context | null): number | undefined {
  const callbackMessage = ctx?.callbackQuery?.message;

  return callbackMessage && "message_id" in callbackMessage
    ? callbackMessage.message_id
    : undefined;
}

function createMenuReplacer(args: CreateMenuReplacerArgs): MenuReplacer {
  const { resolveSurface, onLog } = args;

  const deleteMessageIdList = async (
    messageIdList: number[],
    surface: MenuSurface,
  ): Promise<void> => {
    const deleteResultList = await Promise.allSettled(
      messageIdList.map((messageId) =>
        surface.telegram.deleteMessage(Number(surface.chatId), messageId),
      ),
    );

    for (let index = 0; index < deleteResultList.length; index += 1) {
      const deleteResult = deleteResultList[index];

      if (deleteResult.status === "rejected") {
        const messageId = messageIdList[index];
        const error = deleteResult.reason;

        if (!isBenignTelegramEditError(error)) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          onLog?.(
            "warn",
            `failed to delete message ${messageId}: ${errorMessage}`,
            { chatId: surface.chatId, messageId, error },
          );
        }
      }
    }
  };

  const sendReplaceMenuMessage = async (
    ctx: Context | null,
    surface: MenuSurface,
    text: string,
    replyOptions: Record<string, unknown>,
  ): Promise<number | null> => {
    try {
      if (ctx !== null) {
        const sent = await ctx.reply(
          text,
          replyOptions as Parameters<typeof ctx.reply>[1],
        );

        return sent.message_id;
      }

      const sent = await surface.telegram.sendMessage(
        surface.chatId,
        text,
        replyOptions as Parameters<typeof surface.telegram.sendMessage>[2],
      );

      return sent.message_id;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      onLog?.("error", `failed to send menu message: ${errorMessage}`, {
        chatId: surface.chatId,
        error,
      });

      return null;
    }
  };

  const deleteTrackedMessages = async (
    ctx: Context | null,
    excludeMessageId?: number,
  ): Promise<void> => {
    const surface = resolveSurface(ctx);

    if (surface === null) {
      return;
    }

    const messageIdList = surface.tracker.cleanup(
      surface.chatId,
      excludeMessageId,
    );

    if (messageIdList.length === 0) {
      return;
    }

    await deleteMessageIdList(messageIdList, surface);
  };

  const sendMenuResult = async (
    ctx: Context,
    text: string,
    extra?: Record<string, unknown>,
  ): Promise<number> => {
    const surface = resolveSurface(ctx);
    const callbackMessageId = getCallbackMessageId(ctx);

    if (surface === null) {
      const sent = await ctx.reply(
        text,
        extra as Parameters<typeof ctx.reply>[1],
      );

      return sent.message_id;
    }

    if (callbackMessageId !== undefined) {
      await deleteTrackedMessages(ctx, callbackMessageId);

      try {
        await ctx.editMessageText(text, extra);
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          error.message.includes("message is not modified")
        ) {
          surface.tracker.set(surface.chatId, [callbackMessageId]);

          return callbackMessageId;
        }

        const sent = await ctx.reply(
          text,
          extra as Parameters<typeof ctx.reply>[1],
        );
        surface.tracker.set(surface.chatId, [sent.message_id]);

        return sent.message_id;
      }

      surface.tracker.set(surface.chatId, [callbackMessageId]);

      return callbackMessageId;
    }

    await deleteTrackedMessages(ctx);
    const sent = await ctx.reply(text, extra as Parameters<typeof ctx.reply>[1]);
    surface.tracker.set(surface.chatId, [sent.message_id]);

    return sent.message_id;
  };

  const replaceMenu = async (
    ctx: Context | null,
    replaceArgs: ReplaceMenuArgs,
  ): Promise<number | null> => {
    const surface = resolveSurface(ctx);

    if (surface === null) {
      return null;
    }

    const callbackMessageId = getCallbackMessageId(ctx);
    const trackedIdList = surface.tracker.cleanup(surface.chatId);
    const messageIdList = buildMessageIdListToDelete({
      trackedIdList,
      callbackMessageId,
    });

    if (replaceArgs.shouldCloseOnly === true) {
      if (messageIdList.length > 0) {
        await deleteMessageIdList(messageIdList, surface);
      }

      return null;
    }

    const { text, replyMarkup, extra, isPlainText, chartFileIdList, onChartMessagesUpdated } =
      replaceArgs;
    const hasChartReSend =
      chartFileIdList !== undefined && chartFileIdList.length > 0;
    const replyOptions: Record<string, unknown> =
      isPlainText === true
        ? { ...(extra ?? {}) }
        : { parse_mode: "MarkdownV2", ...(extra ?? {}) };

    if (replyMarkup !== undefined) {
      replyOptions.reply_markup = replyMarkup;
    }

    if (!hasChartReSend) {
      if (messageIdList.length > 0) {
        await deleteMessageIdList(messageIdList, surface);
      }

      const sentMessageId = await sendReplaceMenuMessage(
        ctx,
        surface,
        text,
        replyOptions,
      );

      if (sentMessageId !== null) {
        surface.tracker.set(surface.chatId, [sentMessageId]);
      }

      if (onChartMessagesUpdated !== undefined) {
        onChartMessagesUpdated([]);
      }

      return sentMessageId;
    }

    const newChartIdList: number[] = [];

    for (const fileId of chartFileIdList ?? []) {
      try {
        const sentPhoto = await surface.telegram.sendPhoto(
          surface.chatId,
          fileId,
        );
        newChartIdList.push(sentPhoto.message_id);
      } catch (error: unknown) {
        onLog?.("warn", "failed to re-send chart by file_id", { error, fileId });
      }
    }

    const sentMessageId = await sendReplaceMenuMessage(
      ctx,
      surface,
      text,
      replyOptions,
    );

    if (sentMessageId !== null) {
      surface.tracker.set(surface.chatId, [...newChartIdList, sentMessageId]);
    }

    if (onChartMessagesUpdated !== undefined) {
      onChartMessagesUpdated(newChartIdList);
    }

    if (messageIdList.length > 0) {
      await deleteMessageIdList(messageIdList, surface);
    }

    return sentMessageId;
  };

  return { replaceMenu, sendMenuResult, deleteTrackedMessages };
}

export { createMenuReplacer };
