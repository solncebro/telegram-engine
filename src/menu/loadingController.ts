import type { Context } from "telegraf";

import type {
  CreateLoadingControllerArgs,
  LoadingController,
  LoadingHandle,
  LoadingMode,
} from "../types/lifecycle.types";
import { editMessageWithFallback } from "../message/editMessageWithFallback";
import { isBenignTelegramEditError } from "../message/telegramEditError";

function createLoadingController(
  args: CreateLoadingControllerArgs,
): LoadingController {
  const { menuReplacer, resolveSurface, defaultLoadingText, onLog } = args;

  const startCallbackLoading = async (
    ctx: Context,
    mode: LoadingMode,
    loadingText: string = defaultLoadingText,
  ): Promise<LoadingHandle> => {
    try {
      await ctx.answerCbQuery();
    } catch (error: unknown) {
      onLog?.("warn", "answerCbQuery failed", { error });
    }

    if (mode === "strip-keyboard") {
      try {
        await ctx.editMessageReplyMarkup(undefined);
      } catch (error: unknown) {
        if (!isBenignTelegramEditError(error)) {
          onLog?.("warn", "failed to strip inline keyboard", { error });
        }
      }
    } else {
      try {
        await editMessageWithFallback(ctx, loadingText, {});
      } catch (error: unknown) {
        if (!isBenignTelegramEditError(error)) {
          onLog?.("warn", "failed to show loading state", { error });
        }
      }
    }

    const callbackMessage = ctx.callbackQuery?.message;
    const callbackMessageId =
      callbackMessage && "message_id" in callbackMessage
        ? callbackMessage.message_id
        : null;

    return {
      finalize: async (text, extra) => {
        try {
          await editMessageWithFallback(ctx, text, extra);

          return callbackMessageId;
        } catch (error: unknown) {
          if (isBenignTelegramEditError(error)) {
            return callbackMessageId;
          }

          onLog?.("warn", "finalize edit failed — falling back to reply", {
            error,
          });

          try {
            const sent = await ctx.reply(
              text,
              extra as Parameters<typeof ctx.reply>[1],
            );

            return sent.message_id;
          } catch (replyError: unknown) {
            onLog?.("error", "finalize reply fallback failed", {
              error: replyError,
            });

            return null;
          }
        }
      },
      fail: async (errorText, extra) => {
        try {
          await editMessageWithFallback(ctx, errorText, extra);
        } catch (error: unknown) {
          if (isBenignTelegramEditError(error)) {
            return;
          }

          onLog?.("warn", "fail edit failed — falling back to reply", { error });
          await ctx
            .reply(errorText, extra as Parameters<typeof ctx.reply>[1])
            .catch((replyError: unknown) => {
              onLog?.("error", "fail reply fallback failed", {
                error: replyError,
              });
            });
        }
      },
      clear: async () => {},
    };
  };

  const startHearsLoading = async (
    ctx: Context,
    loadingText: string = defaultLoadingText,
  ): Promise<LoadingHandle> => {
    const surface = resolveSurface(ctx);
    await menuReplacer.deleteTrackedMessages(ctx);

    let loadingMessageId: number | null = null;

    try {
      const sent = await ctx.reply(loadingText);
      loadingMessageId = sent.message_id;

      if (surface !== null) {
        surface.tracker.set(surface.chatId, [loadingMessageId]);
      }
    } catch (error: unknown) {
      onLog?.("warn", "failed to send hears loading message", { error });
    }

    return {
      finalize: async (text, extra) => {
        try {
          return await menuReplacer.sendMenuResult(ctx, text, extra);
        } catch (error: unknown) {
          onLog?.("error", "hears finalize failed", { error });

          return null;
        }
      },
      fail: async (errorText, extra) => {
        await menuReplacer.deleteTrackedMessages(ctx);

        try {
          const sent = await ctx.reply(
            errorText,
            extra as Parameters<typeof ctx.reply>[1],
          );

          if (surface !== null) {
            surface.tracker.set(surface.chatId, [sent.message_id]);
          }
        } catch (error: unknown) {
          onLog?.("error", "hears fail reply failed", { error });
        }
      },
      clear: async () => {
        if (loadingMessageId === null || surface === null) {
          return;
        }

        try {
          await surface.telegram.deleteMessage(
            Number(surface.chatId),
            loadingMessageId,
          );
          surface.tracker.delete(surface.chatId);
        } catch {
          // best-effort cleanup
        }
      },
    };
  };

  return { startCallbackLoading, startHearsLoading };
}

export { createLoadingController };
