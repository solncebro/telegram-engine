import type { Context } from "telegraf";

const CAPTION_EDIT_MISMATCH_MARKER_LIST = [
  "there is no text in the message to edit",
  "there is no caption in the message to edit",
];

async function editMessageWithFallback(
  ctx: Context,
  text: string,
  extra?: Record<string, unknown>,
): Promise<void> {
  const options = extra ?? { parse_mode: "MarkdownV2" };

  try {
    await ctx.editMessageCaption(text, options);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    const isCaptionEditMismatch = CAPTION_EDIT_MISMATCH_MARKER_LIST.some(
      (marker) => message.includes(marker),
    );

    if (!isCaptionEditMismatch) {
      throw error;
    }

    await ctx.editMessageText(text, options);
  }
}

export { editMessageWithFallback };
