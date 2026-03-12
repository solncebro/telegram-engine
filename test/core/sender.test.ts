import { createSender } from "../../src/core/sender";
import { createAccessControl } from "../../src/core/accessControl";

const createMockTelegram = () => ({
  sendMessage: jest.fn().mockResolvedValue({ message_id: 42 }),
  pinChatMessage: jest.fn().mockResolvedValue(true),
  unpinChatMessage: jest.fn().mockResolvedValue(true),
  editMessageText: jest.fn().mockResolvedValue(true),
  deleteMessage: jest.fn().mockResolvedValue(true),
});

const createMockBot = (telegram: ReturnType<typeof createMockTelegram>) =>
  ({ telegram }) as never;

describe("createSender", () => {
  it("should send message", async () => {
    const telegram = createMockTelegram();
    const bot = createMockBot(telegram);
    const sender = createSender({ getBot: () => bot });

    await sender.sendMessage({ message: "hello", peer: "123" });

    expect(telegram.sendMessage).toHaveBeenCalledWith("123", "hello", {
      disable_notification: false,
    });
  });

  it("should return message id when requested", async () => {
    const telegram = createMockTelegram();
    const bot = createMockBot(telegram);
    const sender = createSender({ getBot: () => bot });

    const result = await sender.sendMessage({
      message: "hello",
      peer: "123",
      returnMessageId: true,
    });

    expect(result).toBe(42);
  });

  it("should use MarkdownV2 parse mode", async () => {
    const telegram = createMockTelegram();
    const bot = createMockBot(telegram);
    const sender = createSender({ getBot: () => bot });

    await sender.sendMessage({
      message: "hello",
      peer: "123",
      useMarkdownV2: true,
    });

    expect(telegram.sendMessage).toHaveBeenCalledWith("123", "hello", {
      disable_notification: false,
      parse_mode: "MarkdownV2",
    });
  });

  it("should skip when peer is not allowed", async () => {
    const telegram = createMockTelegram();
    const bot = createMockBot(telegram);
    const ac = createAccessControl({ allowedPeerList: ["456"] });
    const sender = createSender({ getBot: () => bot, accessControl: ac });

    await sender.sendMessage({ message: "hello", peer: "123" });

    expect(telegram.sendMessage).not.toHaveBeenCalled();
  });

  it("should log when bot is not available", async () => {
    const onLog = jest.fn();
    const sender = createSender({ getBot: () => undefined, onLog });

    await sender.sendMessage({ message: "hello", peer: "123" });

    expect(onLog).toHaveBeenCalledWith(
      expect.stringContaining("Bot not available"),
    );
  });

  it("should pin message", async () => {
    const telegram = createMockTelegram();
    const bot = createMockBot(telegram);
    const sender = createSender({ getBot: () => bot });

    await sender.pinMessage("123", 42);

    expect(telegram.pinChatMessage).toHaveBeenCalledWith("123", 42);
  });

  it("should unpin message", async () => {
    const telegram = createMockTelegram();
    const bot = createMockBot(telegram);
    const sender = createSender({ getBot: () => bot });

    await sender.unpinMessage("123", 42);

    expect(telegram.unpinChatMessage).toHaveBeenCalledWith("123", 42);
  });

  it("should edit message", async () => {
    const telegram = createMockTelegram();
    const bot = createMockBot(telegram);
    const sender = createSender({ getBot: () => bot });

    await sender.editMessage({ chatId: "123", messageId: 42, text: "updated" });

    expect(telegram.editMessageText).toHaveBeenCalledWith(
      "123",
      42,
      undefined,
      "updated",
      undefined,
    );
  });

  it("should edit message with MarkdownV2", async () => {
    const telegram = createMockTelegram();
    const bot = createMockBot(telegram);
    const sender = createSender({ getBot: () => bot });

    await sender.editMessage({
      chatId: "123",
      messageId: 42,
      text: "updated",
      useMarkdownV2: true,
    });

    expect(telegram.editMessageText).toHaveBeenCalledWith(
      "123",
      42,
      undefined,
      "updated",
      { parse_mode: "MarkdownV2" },
    );
  });

  it("should delete message", async () => {
    const telegram = createMockTelegram();
    const bot = createMockBot(telegram);
    const sender = createSender({ getBot: () => bot });

    await sender.deleteMessage("123", 42);

    expect(telegram.deleteMessage).toHaveBeenCalledWith("123", 42);
  });

  it("should not throw when bot is undefined for pin/unpin/edit/delete", async () => {
    const sender = createSender({ getBot: () => undefined });

    await expect(sender.pinMessage("123", 42)).resolves.toBeUndefined();
    await expect(sender.unpinMessage("123", 42)).resolves.toBeUndefined();
    await expect(
      sender.editMessage({ chatId: "123", messageId: 42, text: "text" }),
    ).resolves.toBeUndefined();
    await expect(sender.deleteMessage("123", 42)).resolves.toBeUndefined();
  });
});
