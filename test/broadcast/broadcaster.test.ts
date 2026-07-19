import { createBroadcaster } from "../../src/broadcast/broadcaster";
import type { TelegramSender } from "../../src/types/bot.types";

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
