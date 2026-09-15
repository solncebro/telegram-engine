import { createBroadcaster } from "../../src/broadcast/broadcaster";
import type { TelegramSender } from "../../src/types/bot.types";
import type { RawInlineKeyboardMarkup } from "../../src/types/keyboard.types";

const createMockSender = (): TelegramSender => ({
  sendMessage: jest.fn().mockResolvedValue(undefined),
  pinMessage: jest.fn().mockResolvedValue(undefined),
  unpinMessage: jest.fn().mockResolvedValue(undefined),
  editMessage: jest.fn().mockResolvedValue(undefined),
  editMessageReplyMarkup: jest.fn().mockResolvedValue(undefined),
  deleteMessage: jest.fn().mockResolvedValue(undefined),
});

describe("createBroadcaster", () => {
  describe("sendToAll", () => {
    it("should send message to all recipients", async () => {
      const sender = createMockSender();
      const broadcaster = createBroadcaster({
        sender,
        recipientList: ["user1", "user2"],
      });

      await broadcaster.sendToAll("hello");

      expect(sender.sendMessage).toHaveBeenCalledTimes(2);
      expect(sender.sendMessage).toHaveBeenCalledWith({
        message: "hello",
        peer: "user1",
        useMarkdownV2: false,
      });
    });

    it("should log errors without throwing", async () => {
      const onLog = jest.fn();
      const sender = createMockSender();

      (sender.sendMessage as jest.Mock).mockRejectedValueOnce(
        new Error("fail"),
      );

      const broadcaster = createBroadcaster({
        sender,
        recipientList: ["user1"],
        onLog,
      });

      await broadcaster.sendToAll("hello");

      expect(onLog).toHaveBeenCalled();
    });

    // rubber needs an "entry retry" inline button under the rejection alert
    // it broadcasts to every chat (KATUSDT 09.09.2026); sendToAll had no way
    // to carry a keyboard until now.
    // Deliberately distinct from "should send message to all recipients" above:
    // that test never passes a third argument at all, so it stays green even if
    // the whole `extra` feature were deleted (found in review round 1, KATUSDT
    // 09.09.2026). This one passes an `extra` with no `replyMarkup` and checks
    // with toStrictEqual (which, unlike toEqual/toHaveBeenCalledWith, treats an
    // explicit `undefined` key as different from a missing one) that the call
    // to sendMessage carries no `replyMarkup` key at all — proving `extra` truly
    // has no effect on the call shape when it carries nothing.
    it("should not attach a replyMarkup key when extra carries none", async () => {
      const sender = createMockSender();
      const broadcaster = createBroadcaster({
        sender,
        recipientList: ["user1"],
      });

      await broadcaster.sendToAll("hello", false, {});

      const callArgs = (sender.sendMessage as jest.Mock).mock.calls[0][0];

      expect(callArgs).toStrictEqual({
        message: "hello",
        peer: "user1",
        useMarkdownV2: false,
      });
    });

    it("should forward replyMarkup to every recipient when given as the third argument", async () => {
      const sender = createMockSender();
      const broadcaster = createBroadcaster({
        sender,
        recipientList: ["user1", "user2"],
      });
      const replyMarkup: RawInlineKeyboardMarkup = {
        inline_keyboard: [[{ text: "Retry entry", callback_data: "retry_entry" }]],
      };

      await broadcaster.sendToAll("entry rejected", false, { replyMarkup });

      expect(sender.sendMessage).toHaveBeenCalledWith({
        message: "entry rejected",
        peer: "user1",
        useMarkdownV2: false,
        replyMarkup,
      });
      expect(sender.sendMessage).toHaveBeenCalledWith({
        message: "entry rejected",
        peer: "user2",
        useMarkdownV2: false,
        replyMarkup,
      });
    });
  });

  describe("sendChunkedToAll", () => {
    it("should send multiple messages to all recipients", async () => {
      const sender = createMockSender();
      const broadcaster = createBroadcaster({
        sender,
        recipientList: ["user1"],
      });

      await broadcaster.sendChunkedToAll(["msg1", "msg2"], 0);

      expect(sender.sendMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe("sendAndPin", () => {
    it("should send, pin, and track pinned messages", async () => {
      const sender = createMockSender();

      (sender.sendMessage as jest.Mock).mockResolvedValue(42);

      const broadcaster = createBroadcaster({
        sender,
        recipientList: ["user1"],
      });

      const pinnedMap = new Map<string, number[]>();

      await broadcaster.sendAndPin({
        message: "report",
        pinnedMessageIdListByChatId: pinnedMap,
        maxPinnedCount: 10,
        useMarkdownV2: true,
      });

      expect(sender.sendMessage).toHaveBeenCalledWith({
        message: "report",
        peer: "user1",
        returnMessageId: true,
        useMarkdownV2: true,
      });
      expect(sender.pinMessage).toHaveBeenCalledWith("user1", 42);
      expect(pinnedMap.get("user1")).toEqual([42]);
    });

    it("should unpin oldest when exceeding max count", async () => {
      const sender = createMockSender();

      (sender.sendMessage as jest.Mock).mockResolvedValue(99);

      const broadcaster = createBroadcaster({
        sender,
        recipientList: ["user1"],
      });

      const pinnedMap = new Map<string, number[]>();

      pinnedMap.set("user1", [1, 2, 3]);

      await broadcaster.sendAndPin({
        message: "report",
        pinnedMessageIdListByChatId: pinnedMap,
        maxPinnedCount: 3,
      });

      expect(sender.unpinMessage).toHaveBeenCalledWith("user1", 1);
      expect(pinnedMap.get("user1")).toEqual([2, 3, 99]);
    });

    it("should skip pin when sendResult is undefined", async () => {
      const sender = createMockSender();

      (sender.sendMessage as jest.Mock).mockResolvedValue(undefined);

      const broadcaster = createBroadcaster({
        sender,
        recipientList: ["user1"],
      });

      const pinnedMap = new Map<string, number[]>();

      await broadcaster.sendAndPin({
        message: "report",
        pinnedMessageIdListByChatId: pinnedMap,
      });

      expect(sender.pinMessage).not.toHaveBeenCalled();
      expect(pinnedMap.has("user1")).toBe(false);
    });

    it("should log error when sendAndPin fails", async () => {
      const onLog = jest.fn();
      const sender = createMockSender();

      (sender.sendMessage as jest.Mock).mockRejectedValue(new Error("send fail"));

      const broadcaster = createBroadcaster({
        sender,
        recipientList: ["user1"],
        onLog,
      });

      await broadcaster.sendAndPin({
        message: "report",
        pinnedMessageIdListByChatId: new Map(),
      });

      expect(onLog).toHaveBeenCalledWith(
        "Failed to send and pin message",
        expect.objectContaining({ peer: "user1", error: "send fail" }),
      );
    });
  });

  describe("sendChunkedToAll", () => {
    it("should log error when chunk send fails", async () => {
      const onLog = jest.fn();
      const sender = createMockSender();

      (sender.sendMessage as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("chunk fail"));

      const broadcaster = createBroadcaster({
        sender,
        recipientList: ["user1"],
        onLog,
      });

      await broadcaster.sendChunkedToAll(["msg1", "msg2"], 0);

      expect(onLog).toHaveBeenCalledWith(
        "Failed to send message part to peer",
        expect.objectContaining({ peer: "user1", messageIndex: 1 }),
      );
    });

    it("should send with MarkdownV2", async () => {
      const sender = createMockSender();
      const broadcaster = createBroadcaster({
        sender,
        recipientList: ["user1"],
      });

      await broadcaster.sendChunkedToAll(["msg1"], 0, true);

      expect(sender.sendMessage).toHaveBeenCalledWith({
        message: "msg1",
        peer: "user1",
        useMarkdownV2: true,
      });
    });
  });
});
