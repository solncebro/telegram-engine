import type { Context } from "telegraf";

import { createLoadingController } from "../../src/menu/loadingController";
import type {
  MenuReplacer,
  MenuSurface,
} from "../../src/types/lifecycle.types";

function createMockMenuReplacer(): MenuReplacer {
  return {
    replaceMenu: jest.fn(async () => null),
    sendMenuResult: jest.fn(async () => 777),
    deleteTrackedMessages: jest.fn(async () => undefined),
  };
}

function createMockSurface(): {
  surface: MenuSurface;
  trackerSet: jest.Mock;
  trackerDelete: jest.Mock;
  deleteMessage: jest.Mock;
} {
  const trackerSet = jest.fn();
  const trackerDelete = jest.fn();
  const deleteMessage = jest.fn(async () => true);
  const surface = {
    telegram: { deleteMessage },
    chatId: "123",
    tracker: { set: trackerSet, delete: trackerDelete, cleanup: jest.fn(), get: jest.fn() },
  } as unknown as MenuSurface;

  return { surface, trackerSet, trackerDelete, deleteMessage };
}

function createMockCtx(callbackMessageId?: number): {
  ctx: Context;
  answerCbQuery: jest.Mock;
  editMessageReplyMarkup: jest.Mock;
  editMessageCaption: jest.Mock;
  editMessageText: jest.Mock;
  reply: jest.Mock;
} {
  const answerCbQuery = jest.fn(async () => true);
  const editMessageReplyMarkup = jest.fn(async () => true);
  const editMessageCaption = jest.fn(async () => true);
  const editMessageText = jest.fn(async () => true);
  const reply = jest.fn(async () => ({ message_id: 999 }));
  const ctx = {
    answerCbQuery,
    editMessageReplyMarkup,
    editMessageCaption,
    editMessageText,
    reply,
    callbackQuery:
      callbackMessageId === undefined
        ? undefined
        : { message: { message_id: callbackMessageId } },
  } as unknown as Context;

  return {
    ctx,
    answerCbQuery,
    editMessageReplyMarkup,
    editMessageCaption,
    editMessageText,
    reply,
  };
}

describe("createLoadingController.startCallbackLoading", () => {
  it("strip-keyboard answers the query and removes the inline keyboard", async () => {
    const { surface } = createMockSurface();
    const controller = createLoadingController({
      menuReplacer: createMockMenuReplacer(),
      resolveSurface: () => surface,
      defaultLoadingText: "Loading...",
    });
    const { ctx, answerCbQuery, editMessageReplyMarkup, editMessageCaption } =
      createMockCtx(42);

    await controller.startCallbackLoading(ctx, "strip-keyboard");

    expect(answerCbQuery).toHaveBeenCalledTimes(1);
    expect(editMessageReplyMarkup).toHaveBeenCalledWith(undefined);
    expect(editMessageCaption).not.toHaveBeenCalled();
  });

  it("replace-text shows the loading placeholder via caption edit", async () => {
    const { surface } = createMockSurface();
    const controller = createLoadingController({
      menuReplacer: createMockMenuReplacer(),
      resolveSurface: () => surface,
      defaultLoadingText: "Loading...",
    });
    const { ctx, editMessageCaption } = createMockCtx(42);

    await controller.startCallbackLoading(ctx, "replace-text");

    expect(editMessageCaption).toHaveBeenCalledWith("Loading...", {});
  });

  it("finalize edits the message and returns the callback message id", async () => {
    const { surface } = createMockSurface();
    const controller = createLoadingController({
      menuReplacer: createMockMenuReplacer(),
      resolveSurface: () => surface,
      defaultLoadingText: "Loading...",
    });
    const { ctx, editMessageCaption } = createMockCtx(42);

    const handle = await controller.startCallbackLoading(ctx, "strip-keyboard");
    const finalizedId = await handle.finalize("done");

    expect(editMessageCaption).toHaveBeenCalledWith("done", {
      parse_mode: "MarkdownV2",
    });
    expect(finalizedId).toBe(42);
  });

  it("fail swallows benign edit errors", async () => {
    const { surface } = createMockSurface();
    const controller = createLoadingController({
      menuReplacer: createMockMenuReplacer(),
      resolveSurface: () => surface,
      defaultLoadingText: "Loading...",
    });
    const { ctx, editMessageCaption, reply } = createMockCtx(42);
    const handle = await controller.startCallbackLoading(ctx, "strip-keyboard");
    editMessageCaption.mockRejectedValueOnce(
      new Error("message to edit not found"),
    );

    await expect(handle.fail("oops")).resolves.toBeUndefined();
    expect(reply).not.toHaveBeenCalled();
  });
});

describe("createLoadingController.startHearsLoading", () => {
  it("clears tracked menu, shows placeholder, tracks it", async () => {
    const menuReplacer = createMockMenuReplacer();
    const { surface, trackerSet } = createMockSurface();
    const controller = createLoadingController({
      menuReplacer,
      resolveSurface: () => surface,
      defaultLoadingText: "Loading...",
    });
    const { ctx, reply } = createMockCtx();

    await controller.startHearsLoading(ctx);

    expect(menuReplacer.deleteTrackedMessages).toHaveBeenCalledWith(ctx);
    expect(reply).toHaveBeenCalledWith("Loading...");
    expect(trackerSet).toHaveBeenCalledWith("123", [999]);
  });

  it("finalize delegates to menuReplacer.sendMenuResult", async () => {
    const menuReplacer = createMockMenuReplacer();
    const { surface } = createMockSurface();
    const controller = createLoadingController({
      menuReplacer,
      resolveSurface: () => surface,
      defaultLoadingText: "Loading...",
    });
    const { ctx } = createMockCtx();

    const handle = await controller.startHearsLoading(ctx);
    const result = await handle.finalize("ready", { parse_mode: "MarkdownV2" });

    expect(menuReplacer.sendMenuResult).toHaveBeenCalledWith(ctx, "ready", {
      parse_mode: "MarkdownV2",
    });
    expect(result).toBe(777);
  });

  it("clear removes the placeholder message", async () => {
    const menuReplacer = createMockMenuReplacer();
    const { surface, deleteMessage, trackerDelete } = createMockSurface();
    const controller = createLoadingController({
      menuReplacer,
      resolveSurface: () => surface,
      defaultLoadingText: "Loading...",
    });
    const { ctx } = createMockCtx();

    const handle = await controller.startHearsLoading(ctx);
    await handle.clear();

    expect(deleteMessage).toHaveBeenCalledWith(123, 999);
    expect(trackerDelete).toHaveBeenCalledWith("123");
  });
});
