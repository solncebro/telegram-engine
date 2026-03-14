import type { Telegram } from "telegraf";
import { LogFunction } from "./bot.types";

interface MessageTracker {
  get: (chatId: string) => number[];
  set: (chatId: string, messageIdList: number[]) => void;
  delete: (chatId: string) => void;
  cleanup: (chatId: string, excludeMessageId?: number) => number[];
}

interface DeleteMessageListByIdArgs {
  telegram: Telegram;
  chatId: number;
  messageIdList: number[];
  onLog?: LogFunction;
}

interface FormattingMarkerItem {
  marker: string;
  isCodeBlock: boolean;
}

export type {
  MessageTracker,
  DeleteMessageListByIdArgs,
  FormattingMarkerItem,
};
