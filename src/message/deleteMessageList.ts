import type { DeleteMessageListByIdArgs } from "../types/message.types";

const deleteMessageListById = async ({
  telegram,
  chatId,
  messageIdList,
  onLog,
}: DeleteMessageListByIdArgs): Promise<void> => {
  for (const messageId of messageIdList) {
    try {
      await telegram.deleteMessage(chatId, messageId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      onLog?.("Failed to delete message", {
        error: errorMessage,
        chatId,
        messageId,
      });
    }
  }
};

export { deleteMessageListById };
