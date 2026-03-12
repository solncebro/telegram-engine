import { Telegraf } from "telegraf";
import type {
  CreateSenderArgs,
  SendMessageArgs,
  EditMessageArgs,
  TelegramSender,
} from "../types/bot.types";

const createSender = ({
  getBot,
  accessControl,
  onLog,
}: CreateSenderArgs): TelegramSender => {
  const getTelegram = (): Telegraf["telegram"] | undefined => {
    const bot = getBot();

    return bot?.telegram;
  };

  const sendMessage = async ({
    message,
    peer,
    isSilentMessage = false,
    useMarkdownV2 = false,
    returnMessageId = false,
  }: SendMessageArgs): Promise<void | number> => {
    if (accessControl && !accessControl.isAllowedPeer(peer)) {
      onLog?.(`Skip send to ${peer}: not allowed`);

      return;
    }

    const telegram = getTelegram();

    if (!telegram) {
      onLog?.(`Bot not available, message: ${message}`);

      return;
    }

    const sentMessage = await telegram.sendMessage(peer, message, {
      disable_notification: isSilentMessage,
      ...(useMarkdownV2 && { parse_mode: "MarkdownV2" }),
    });

    if (returnMessageId) {
      return sentMessage.message_id;
    }
  };

  const pinMessage = async (
    chatId: string,
    messageId: number,
  ): Promise<void> => {
    const telegram = getTelegram();

    if (!telegram) {
      return;
    }

    await telegram.pinChatMessage(chatId, messageId);
  };

  const unpinMessage = async (
    chatId: string,
    messageId: number,
  ): Promise<void> => {
    const telegram = getTelegram();

    if (!telegram) {
      return;
    }

    await telegram.unpinChatMessage(chatId, messageId);
  };

  const editMessage = async ({
    chatId,
    messageId,
    text,
    useMarkdownV2 = false,
  }: EditMessageArgs): Promise<void> => {
    const telegram = getTelegram();

    if (!telegram) {
      return;
    }

    await telegram.editMessageText(
      chatId,
      messageId,
      undefined,
      text,
      useMarkdownV2 ? { parse_mode: "MarkdownV2" } : undefined,
    );
  };

  const deleteMessage = async (
    chatId: string,
    messageId: number,
  ): Promise<void> => {
    const telegram = getTelegram();

    if (!telegram) {
      return;
    }

    await telegram.deleteMessage(chatId, messageId);
  };

  return {
    sendMessage,
    pinMessage,
    unpinMessage,
    editMessage,
    deleteMessage,
  };
};

export { createSender };
