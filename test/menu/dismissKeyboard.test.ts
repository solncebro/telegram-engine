import type { Context } from "telegraf";

import {
  buildDismissReplyMarkup,
  dismissKeyboard,
} from "../../src/menu/dismissKeyboard";

describe("buildDismissReplyMarkup", () => {
  it("defaults the callback data to 'dismiss'", () => {
    expect(buildDismissReplyMarkup({ text: "Close" })).toEqual({
      inline_keyboard: [[{ text: "Close", callback_data: "dismiss" }]],
    });
  });

  it("uses a custom callback data", () => {
    expect(
      buildDismissReplyMarkup({ text: "Close", callbackData: "close_menu" }),
    ).toEqual({
      inline_keyboard: [[{ text: "Close", callback_data: "close_menu" }]],
    });
  });
});

describe("dismissKeyboard", () => {
  it("answers the query and strips the inline keyboard", async () => {
    const answerCbQuery = jest.fn(async () => true);
    const editMessageReplyMarkup = jest.fn(async () => true);
    const ctx = {
      answerCbQuery,
      editMessageReplyMarkup,
    } as unknown as Context;

    await dismissKeyboard(ctx);

    expect(answerCbQuery).toHaveBeenCalledTimes(1);
    expect(editMessageReplyMarkup).toHaveBeenCalledWith(undefined);
  });
});
