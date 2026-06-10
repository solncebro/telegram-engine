import type { Context } from "telegraf";

import { createMenuReplacer } from "../../src/menu/menuReplacer";
import type { MenuSurface } from "../../src/types/lifecycle.types";

interface MockTracker {
  cleanup: jest.Mock;
  set: jest.Mock;
  delete: jest.Mock;
  get: jest.Mock;
}

interface MockTelegram {
  deleteMessage: jest.Mock;
  sendMessage: jest.Mock;
  sendPhoto: jest.Mock;
}

function createMockSurface(trackedIdList: number[]): {
  surface: MenuSurface;
  tracker: MockTracker;
  telegram: MockTelegram;
} {
  const tracker: MockTracker = {
    cleanup: jest.fn(() => trackedIdList),
    set: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(() => trackedIdList),
  };
  const telegram: MockTelegram = {
    deleteMessage: jest.fn(async () => true),
    sendMessage: jest.fn(async () => ({ message_id: 500 })),
    sendPhoto: jest.fn(async () => ({ message_id: 700 })),
  };
  const surface = {
    telegram,
    chatId: "123",
    tracker,
  } as unknown as MenuSurface;

  return { surface, tracker, telegram };
}

function createMockCtx(callbackMessageId?: number): {
  ctx: Context;
  reply: jest.Mock;
  editMessageText: jest.Mock;
} {
  const reply = jest.fn(async () => ({ message_id: 999 }));
  const editMessageText = jest.fn(async () => true);
  const ctx = {
    reply,
    editMessageText,
    callbackQuery:
      callbackMessageId === undefined
        ? undefined
        : { message: { message_id: callbackMessageId } },
  } as unknown as Context;

  return { ctx, reply, editMessageText };
}

describe("createMenuReplacer.replaceMenu", () => {
  it("shouldCloseOnly deletes tracked + callback message and returns null", async () => {
    const { surface, telegram } = createMockSurface([10, 20]);
    const replacer = createMenuReplacer({ resolveSurface: () => surface });
    const { ctx } = createMockCtx(99);

    const result = await replacer.replaceMenu(ctx, { shouldCloseOnly: true });

    expect(result).toBeNull();
    expect(telegram.deleteMessage).toHaveBeenCalledTimes(3);
    expect(telegram.deleteMessage).toHaveBeenCalledWith(123, 10);
    expect(telegram.deleteMessage).toHaveBeenCalledWith(123, 20);
    expect(telegram.deleteMessage).toHaveBeenCalledWith(123, 99);
  });

  it("deletes old tracked, sends new with MarkdownV2 + reply_markup, sets tracker", async () => {
    const { surface, tracker, telegram } = createMockSurface([10]);
    const replacer = createMenuReplacer({ resolveSurface: () => surface });
    const { ctx, reply } = createMockCtx();

    const result = await replacer.replaceMenu(ctx, {
      text: "hi",
      replyMarkup: { inline_keyboard: [[{ text: "x", callback_data: "c" }]] },
    });

    expect(telegram.deleteMessage).toHaveBeenCalledWith(123, 10);
    expect(reply).toHaveBeenCalledWith("hi", {
      parse_mode: "MarkdownV2",
      reply_markup: { inline_keyboard: [[{ text: "x", callback_data: "c" }]] },
    });
    expect(tracker.set).toHaveBeenCalledWith("123", [999]);
    expect(result).toBe(999);
  });

  it("omits parse_mode when isPlainText is true", async () => {
    const { surface } = createMockSurface([]);
    const replacer = createMenuReplacer({ resolveSurface: () => surface });
    const { ctx, reply } = createMockCtx();

    await replacer.replaceMenu(ctx, { text: "plain", isPlainText: true });

    expect(reply).toHaveBeenCalledWith("plain", {});
  });

  it("re-sends charts, tracks chart ids before text, reports new chart ids", async () => {
    const { surface, tracker, telegram } = createMockSurface([10]);
    const replacer = createMenuReplacer({ resolveSurface: () => surface });
    const { ctx } = createMockCtx();
    const reportedList: number[][] = [];

    await replacer.replaceMenu(ctx, {
      text: "with chart",
      chartFileIdList: ["file-a"],
      onChartMessagesUpdated: (idList) => reportedList.push(idList),
    });

    expect(telegram.sendPhoto).toHaveBeenCalledWith("123", "file-a");
    expect(tracker.set).toHaveBeenCalledWith("123", [700, 999]);
    expect(reportedList).toEqual([[700]]);
  });

  it("uses telegram.sendMessage when ctx is null", async () => {
    const { surface, telegram } = createMockSurface([]);
    const replacer = createMenuReplacer({ resolveSurface: () => surface });

    const result = await replacer.replaceMenu(null, { text: "no ctx" });

    expect(telegram.sendMessage).toHaveBeenCalledWith("123", "no ctx", {
      parse_mode: "MarkdownV2",
    });
    expect(result).toBe(500);
  });

  it("returns null and does nothing when surface is null", async () => {
    const replacer = createMenuReplacer({ resolveSurface: () => null });
    const { ctx, reply } = createMockCtx();

    const result = await replacer.replaceMenu(ctx, { text: "x" });

    expect(result).toBeNull();
    expect(reply).not.toHaveBeenCalled();
  });
});

describe("createMenuReplacer.deleteTrackedMessages", () => {
  it("cleans up and deletes tracked messages", async () => {
    const { surface, tracker, telegram } = createMockSurface([1, 2]);
    const replacer = createMenuReplacer({ resolveSurface: () => surface });

    await replacer.deleteTrackedMessages(null, 5);

    expect(tracker.cleanup).toHaveBeenCalledWith("123", 5);
    expect(telegram.deleteMessage).toHaveBeenCalledTimes(2);
  });

  it("no-ops when surface is null", async () => {
    const replacer = createMenuReplacer({ resolveSurface: () => null });

    await expect(replacer.deleteTrackedMessages(null)).resolves.toBeUndefined();
  });

  it("logs non-benign delete failures and swallows benign ones", async () => {
    const { surface, telegram } = createMockSurface([1, 2]);
    telegram.deleteMessage
      .mockRejectedValueOnce(new Error("message to delete not found"))
      .mockRejectedValueOnce(new Error("network down"));
    const onLog = jest.fn();
    const replacer = createMenuReplacer({ resolveSurface: () => surface, onLog });

    await replacer.deleteTrackedMessages(null);

    expect(onLog).toHaveBeenCalledTimes(1);
    expect(onLog).toHaveBeenCalledWith(
      "warn",
      expect.stringContaining("failed to delete message 2"),
      expect.objectContaining({ messageId: 2 }),
    );
  });
});

describe("createMenuReplacer.sendMenuResult", () => {
  it("edits the callback message in place and tracks it", async () => {
    const { surface, tracker } = createMockSurface([10]);
    const replacer = createMenuReplacer({ resolveSurface: () => surface });
    const { ctx, editMessageText } = createMockCtx(55);

    const result = await replacer.sendMenuResult(ctx, "edited");

    expect(editMessageText).toHaveBeenCalledWith("edited", undefined);
    expect(tracker.set).toHaveBeenCalledWith("123", [55]);
    expect(result).toBe(55);
  });

  it("keeps the callback message on 'message is not modified'", async () => {
    const { surface, tracker } = createMockSurface([]);
    const replacer = createMenuReplacer({ resolveSurface: () => surface });
    const { ctx, editMessageText } = createMockCtx(55);
    editMessageText.mockRejectedValueOnce(
      new Error("Bad Request: message is not modified"),
    );

    const result = await replacer.sendMenuResult(ctx, "same");

    expect(tracker.set).toHaveBeenCalledWith("123", [55]);
    expect(result).toBe(55);
  });

  it("falls back to reply when the edit fails for another reason", async () => {
    const { surface, tracker } = createMockSurface([]);
    const replacer = createMenuReplacer({ resolveSurface: () => surface });
    const { ctx, editMessageText, reply } = createMockCtx(55);
    editMessageText.mockRejectedValueOnce(new Error("message can't be edited"));

    const result = await replacer.sendMenuResult(ctx, "new");

    expect(reply).toHaveBeenCalledWith("new", undefined);
    expect(tracker.set).toHaveBeenCalledWith("123", [999]);
    expect(result).toBe(999);
  });

  it("deletes tracked and replies when there is no callback message", async () => {
    const { surface, tracker } = createMockSurface([10]);
    const replacer = createMenuReplacer({ resolveSurface: () => surface });
    const { ctx, reply } = createMockCtx();

    const result = await replacer.sendMenuResult(ctx, "fresh");

    expect(reply).toHaveBeenCalledWith("fresh", undefined);
    expect(tracker.set).toHaveBeenCalledWith("123", [999]);
    expect(result).toBe(999);
  });
});
