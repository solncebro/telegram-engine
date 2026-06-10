import type { Context } from "telegraf";

import type { RawInlineKeyboardMarkup } from "../types/keyboard.types";
import type { BuildDismissReplyMarkupArgs } from "../types/lifecycle.types";

function buildDismissReplyMarkup(
  args: BuildDismissReplyMarkupArgs,
): RawInlineKeyboardMarkup {
  const { text, callbackData } = args;

  return {
    inline_keyboard: [[{ text, callback_data: callbackData ?? "dismiss" }]],
  };
}

async function dismissKeyboard(ctx: Context): Promise<void> {
  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup(undefined);
}

export { buildDismissReplyMarkup, dismissKeyboard };
