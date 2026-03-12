import type { MessageTracker } from "../types/message.types";

const createMessageTracker = (): MessageTracker => {
  const messageIdListByChatId = new Map<string, number[]>();

  const get = (chatId: string): number[] =>
    messageIdListByChatId.get(chatId) ?? [];

  const set = (chatId: string, messageIdList: number[]): void => {
    messageIdListByChatId.set(chatId, messageIdList);
  };

  const deleteChat = (chatId: string): void => {
    messageIdListByChatId.delete(chatId);
  };

  const cleanup = (chatId: string, excludeMessageId?: number): number[] => {
    const storedList = messageIdListByChatId.get(chatId) ?? [];

    messageIdListByChatId.delete(chatId);

    if (excludeMessageId === undefined) {
      return storedList;
    }

    return storedList.filter((id) => id !== excludeMessageId);
  };

  return { get, set, delete: deleteChat, cleanup };
};

export { createMessageTracker };
