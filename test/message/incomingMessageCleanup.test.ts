import type { Context, Telegraf } from "telegraf";

import { applyIncomingMessageCleanup } from "../../src/message/incomingMessageCleanup";

type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void>;

const createMockBot = () => {
  let middleware: Middleware | undefined;

  const bot = {
    use: jest.fn((fn: Middleware) => {
      middleware = fn;
    }),
  } as unknown as Telegraf;

  return { bot, getMiddleware: () => middleware as Middleware };
};

const createMockContext = (chatId: number | undefined, messageId?: number) => {
  const deleteMessage = jest.fn().mockResolvedValue(true);

  const ctx = {
    chat: chatId === undefined ? undefined : { id: chatId },
    message: messageId === undefined ? undefined : { message_id: messageId },
    telegram: { deleteMessage },
  } as unknown as Context;

  return { ctx, deleteMessage };
};

describe("applyIncomingMessageCleanup", () => {
  it("should delete the incoming message in an allowed chat and still call next", async () => {
    const { bot, getMiddleware } = createMockBot();
    applyIncomingMessageCleanup({ bot, isAllowedChat: () => true });

    const { ctx, deleteMessage } = createMockContext(123, 42);
    const next = jest.fn().mockResolvedValue(undefined);

    await getMiddleware()(ctx, next);

    expect(deleteMessage).toHaveBeenCalledWith(123, 42);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should skip deletion for a disallowed chat but still call next", async () => {
    const { bot, getMiddleware } = createMockBot();
    applyIncomingMessageCleanup({ bot, isAllowedChat: () => false });

    const { ctx, deleteMessage } = createMockContext(123, 42);
    const next = jest.fn().mockResolvedValue(undefined);

    await getMiddleware()(ctx, next);

    expect(deleteMessage).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should swallow a benign delete error without logging", async () => {
    const { bot, getMiddleware } = createMockBot();
    const onLog = jest.fn();
    applyIncomingMessageCleanup({ bot, isAllowedChat: () => true, onLog });

    const { ctx, deleteMessage } = createMockContext(123, 42);
    deleteMessage.mockRejectedValueOnce(
      new Error("message to delete not found"),
    );
    const next = jest.fn().mockResolvedValue(undefined);

    await getMiddleware()(ctx, next);

    expect(onLog).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should log a non-benign delete error and still call next", async () => {
    const { bot, getMiddleware } = createMockBot();
    const onLog = jest.fn();
    applyIncomingMessageCleanup({ bot, isAllowedChat: () => true, onLog });

    const { ctx, deleteMessage } = createMockContext(123, 42);
    deleteMessage.mockRejectedValueOnce(new Error("unexpected failure"));
    const next = jest.fn().mockResolvedValue(undefined);

    await getMiddleware()(ctx, next);

    expect(onLog).toHaveBeenCalledWith(
      "warn",
      expect.stringContaining("failed to delete incoming message"),
      { chatId: 123, messageId: 42 },
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});
