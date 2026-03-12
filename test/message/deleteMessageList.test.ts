import { deleteMessageListById } from "../../src/message/deleteMessageList";

interface MockTelegram {
  deleteMessage: jest.Mock;
}

const createMockTelegram = (): MockTelegram => ({
  deleteMessage: jest.fn().mockResolvedValue(true),
});

describe("deleteMessageListById", () => {
  it("should delete all messages", async () => {
    const telegram = createMockTelegram();

    await deleteMessageListById({
      telegram: telegram as never,
      chatId: 123,
      messageIdList: [1, 2, 3],
    });

    expect(telegram.deleteMessage).toHaveBeenCalledTimes(3);
    expect(telegram.deleteMessage).toHaveBeenCalledWith(123, 1);
    expect(telegram.deleteMessage).toHaveBeenCalledWith(123, 2);
    expect(telegram.deleteMessage).toHaveBeenCalledWith(123, 3);
  });

  it("should continue on error and log", async () => {
    const onLog = jest.fn();
    const telegram = createMockTelegram();

    telegram.deleteMessage
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error("not found"))
      .mockResolvedValueOnce(true);

    await deleteMessageListById({
      telegram: telegram as never,
      chatId: 123,
      messageIdList: [1, 2, 3],
      onLog,
    });

    expect(telegram.deleteMessage).toHaveBeenCalledTimes(3);
    expect(onLog).toHaveBeenCalledWith(
      "Failed to delete message",
      expect.objectContaining({ messageId: 2 }),
    );
  });

  it("should handle non-Error throw", async () => {
    const onLog = jest.fn();
    const telegram = createMockTelegram();

    telegram.deleteMessage.mockRejectedValueOnce("string error");

    await deleteMessageListById({
      telegram: telegram as never,
      chatId: 123,
      messageIdList: [1],
      onLog,
    });

    expect(onLog).toHaveBeenCalledWith(
      "Failed to delete message",
      expect.objectContaining({ error: "string error" }),
    );
  });

  it("should handle empty list", async () => {
    const telegram = createMockTelegram();

    await deleteMessageListById({
      telegram: telegram as never,
      chatId: 123,
      messageIdList: [],
    });

    expect(telegram.deleteMessage).not.toHaveBeenCalled();
  });
});
